from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from app.models.farm import Farm, FarmCreate
from app.models.user import User
from app.services.db import get_database
from app.routes.auth import get_current_user
from services.irrigation_pipeline import run_irrigation_pipeline
from bson import ObjectId

router = APIRouter()

@router.get("/summary")
async def get_dashboard_summary(current_user: User = Depends(get_current_user)):
    """
    Provides real-time summary for the dashboard:
    - Active farms count
    - Count of farms needing attention (no action today)
    - Brief list of pending actions
    """
    db = await get_database()
    
    # Get all farms
    farms_cursor = db["farms"].find({"user_id": current_user.email})
    farms = await farms_cursor.to_list(length=100)
    
    total_farms = len(farms)
    farms_needing_action = []
    
    for farm in farms:
        farm_id = str(farm["_id"])
        
        # Check if action taken today
        is_done = await check_irrigation_status_today(db, farm_id)
        
        if not is_done:
            farms_needing_action.append({
                "id": farm_id,
                "name": farm["name"],
                "location": farm.get("region", "Unknown"),
                "status": "Pending Advice"
            })
            
    return {
        "active_farms": total_farms,
        "pending_actions": len(farms_needing_action),
        "farms_needing_action": farms_needing_action,
        "system_status": "All Systems Operational",
        "alerts": [] # Placeholder for system-wide alerts
    }

@router.get("/", response_model=List[Farm])
async def get_farms(current_user: User = Depends(get_current_user)):
    db = await get_database()
    farms_cursor = db["farms"].find({"user_id": current_user.email})
    farms = await farms_cursor.to_list(length=100)
    for farm in farms:
        farm["_id"] = str(farm["_id"])
    return farms

@router.post("/", response_model=Farm)
async def create_farm(farm: FarmCreate, current_user: User = Depends(get_current_user)):
    db = await get_database()
    farm_dict = farm.dict()
    farm_dict["user_id"] = current_user.email
    
    new_farm = await db["farms"].insert_one(farm_dict)
    created_farm = await db["farms"].find_one({"_id": new_farm.inserted_id})
    created_farm["_id"] = str(created_farm["_id"])
    return created_farm

from app.services.analytics import AnalyticsService, check_irrigation_status_today, log_manual_irrigation, check_yesterday_skip, log_skip_event

@router.get("/{farm_id}/advice")
async def get_farm_advice(farm_id: str, current_user: User = Depends(get_current_user)):
    db = await get_database()
    try:
        obj_id = ObjectId(farm_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Farm ID")

    farm = await db["farms"].find_one({"_id": obj_id, "user_id": current_user.email})
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    # Check statuses
    is_irrigated = await check_irrigation_status_today(db, farm_id)
    
    # Get System State (Single Source of Truth)
    # This recalculates confidence and gets consecutive skips
    state = await AnalyticsService.calculate_system_state(farm_id)
    consecutive_skips = state.consecutive_skips
    confidence_score = state.system_confidence_score

    # Call the locked pipeline
    try:
        prediction = run_irrigation_pipeline(
            lat=farm["lat"],
            lon=farm["lon"],
            crop=farm["crop"],
            region=farm["region"],
            plot_area=farm["plot_area"],
            pump_flow=farm["pump_flow"],
            is_irrigated_today=is_irrigated,
            consecutive_skips=consecutive_skips
        )
        
        # Override confidence in advice with System Confidence (Long-term)
        # Pipeline gives "Session Confidence", but User wants "System Reliability"
        prediction["recommendation"]["confidence_score"] = confidence_score # 0-1.0
        prediction["recommendation"]["confidence"] = "High" if confidence_score > 0.7 else "Medium" if confidence_score > 0.3 else "Low"

    except Exception as e:
        print(f"ERROR: Pipeline failed for farm {farm_id}: {str(e)}")
        # Fallback Safe Mode
        prediction = {
            "water_demand": {"mm": 0, "reason": "System offline or data unavailable. Manual check recommended."},
            "action": "MONITOR",
            "confidence": 0,
            "recommendation": {
                "action": "MONITOR",
                "reason": "System Offline", 
                "confidence": "Low",
                "confidence_score": 0.0
            }
        }
    
    return {
        "farm_id": farm_id,
        "advice": prediction,
        "explanation": prediction["water_demand"]["reason"] 
    }

@router.post("/{farm_id}/skip_irrigation")
async def skip_irrigation_event(farm_id: str, current_user: User = Depends(get_current_user)):
    """
    Logs a decision to SKIP irrigation.
    """
    db = await get_database()
    try:
        farm = await db["farms"].find_one({"_id": ObjectId(farm_id), "user_id": current_user.email})
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")
            
        await log_skip_event(db, farm_id)
        return {"status": "success", "message": "Irrigation skipped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{farm_id}/acknowledge_irrigation")
async def acknowledge_irrigation(farm_id: str, volume: float = 0, current_user: User = Depends(get_current_user)):
    """
    Manually acknowledges an irrigation event.
    """
    db = await get_database()
    try:
        # Verify ownership
        farm = await db["farms"].find_one({"_id": ObjectId(farm_id), "user_id": current_user.email})
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")
            
        await log_manual_irrigation(db, farm_id, volume)
        return {"status": "success", "message": "Irrigation acknowledged"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_farm(farm_id: str, current_user: User = Depends(get_current_user)):
    db = await get_database()
    try:
        obj_id = ObjectId(farm_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Farm ID")

    result = await db["farms"].delete_one({"_id": obj_id, "user_id": current_user.email})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Farm not found or not authorized")
    
    return None

# --- Analytics Endpoints ---

from app.services.analytics import AnalyticsService

@router.get("/{farm_id}/analytics")
async def get_farm_analytics(farm_id: str, limit: int = 7, current_user: User = Depends(get_current_user)):
    # 1. Verify Ownership
    db = await get_database()
    # 1. Verify Ownership
    db = await get_database()
    
    print(f"DEBUG ANALYTICS: Lookup request for farm_id={farm_id}")

    # Robust Lookup Strategy
    queries = []
    
    # Strategy A: Standard ObjectId
    if ObjectId.is_valid(farm_id):
        queries.append({"_id": ObjectId(farm_id), "user_id": current_user.email})
        
    # Strategy B: String _id (Legacy/Imported data)
    queries.append({"_id": farm_id, "user_id": current_user.email})
    
    # Strategy C: Custom 'id' field
    queries.append({"id": farm_id, "user_id": current_user.email})

    farm = None
    for q in queries:
        # print(f"DEBUG ANALYTICS: Trying query: {q}") 
        farm = await db["farms"].find_one(q)
        if farm:
            # print(f"DEBUG ANALYTICS: Match found with query: {q}")
            break
            
    if not farm:
        print(f"DEBUG ANALYTICS: FAILED. Farm {farm_id} not found for user {current_user.email}")
        raise HTTPException(status_code=404, detail="Farm not found")

    # 2. Get Data
    weekly_stats = await AnalyticsService.get_weekly_stats(farm_id)
    system_state = await AnalyticsService.calculate_system_state(farm_id)
    history = await AnalyticsService.get_raw_history(farm_id, limit=limit) # Fetch last N events
    
    return {
        "farm_id": farm_id,
        "weekly_stats": weekly_stats,
        "system_state": system_state,
        "water_demand": {
            "mm_today": 0,
            "reason": "Calculated in Real-time Advisory"
        },
        "reason": "See Advisory",
        "confidence": "High" if system_state.system_confidence_score > 0.7 else "Medium" if system_state.system_confidence_score > 0.3 else "Low",
        "history": history
    }
