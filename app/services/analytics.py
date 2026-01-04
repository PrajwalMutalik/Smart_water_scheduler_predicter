from typing import List, Dict, Optional
from datetime import datetime, timedelta
from app.services.db import get_database
from app.models.history import IrrigationEvent, FarmState, WeeklyStats

class AnalyticsService:
    
    @staticmethod
    async def get_weekly_stats(farm_id: str) -> WeeklyStats:
        """Calculates stats for the last 7 days based on CONFIRMED (DONE) events."""
        db = await get_database()
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        pipeline = [
            {
                "$match": {
                    "farm_id": farm_id,
                    "status": "DONE",
                    "timestamp": {"$gte": seven_days_ago}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_volume": {"$sum": "$actual_volume_liters"},
                    "count": {"$sum": 1},
                    "avg_duration": {"$avg": "$actual_duration_minutes"}
                }
            }
        ]
        
        cursor = db["irrigation_history"].aggregate(pipeline)
        result = await cursor.to_list(length=1)
        
        if result:
            stats = result[0]
            return WeeklyStats(
                week_start=seven_days_ago,
                total_volume_liters=round(stats["total_volume"], 2),
                session_count=stats["count"],
                average_duration_minutes=round(stats["avg_duration"] or 0, 1)
            )
        else:
            return WeeklyStats(
                week_start=seven_days_ago,
                total_volume_liters=0,
                session_count=0,
                average_duration_minutes=0
            )

    @staticmethod
    async def calculate_system_state(farm_id: str) -> FarmState:
        """
        Derives system confidence mainly from consistency of manual acknowledgements.
        This provides the 'System Confidence' score shown on the UI.
        """
        db = await get_database()
        
        # Get existing state or create default
        existing_state_data = await db["farm_states"].find_one({"farm_id": farm_id})
        current_state = FarmState(**existing_state_data) if existing_state_data else FarmState(farm_id=farm_id)

        # Count total historical events (DONE vs SKIPPED)
        total_actions = await db["irrigation_history"].count_documents({"farm_id": farm_id})
        
        if total_actions == 0:
            current_state.system_confidence_score = 0.0
            current_state.calibration_status = "Initializing"
            return current_state

        # High confidence if user is active (ratio of Ack vs Total)
        # But we also want to reward consistency. For now, simple count-based:
        # > 5 actions = 50% confidence. > 20 actions = 90% confidence.
        # Skips reduce confidence slightly in this model as implies rejection of advice?
        # Actually prompting says: +5% per confirmed, -10% per skipped.
        
        # Let's recalculate from scratch to be safe (idempotent)
        done_count = await db["irrigation_history"].count_documents({"farm_id": farm_id, "status": "DONE"})
        skipped_count = await db["irrigation_history"].count_documents({"farm_id": farm_id, "status": "SKIPPED"})
        
        # Base Score
        score = (done_count * 0.05) - (skipped_count * 0.10)
        
        # Cap limits
        if score < 0.1: score = 0.1
        if score > 1.0: score = 1.0
        
        current_state.system_confidence_score = round(score, 2)
        
        if score < 0.3:
            current_state.calibration_status = "Learning"
        elif score < 0.7:
             current_state.calibration_status = "Calibrating"
        else:
             current_state.calibration_status = "Optimized"
             
        # Persist derived state
        await db["farm_states"].update_one(
            {"farm_id": farm_id},
            {"$set": current_state.dict()},
            upsert=True
        )
        
        return current_state

    @staticmethod
    async def get_raw_history(farm_id: str, limit: int = 50) -> List[Dict]:
        """Returns raw event list for detailed views."""
        db = await get_database()
        cursor = db["irrigation_history"].find({"farm_id": farm_id}).sort("timestamp", -1).limit(limit)
        events = await cursor.to_list(length=limit)
        
        # Convert ObjectId to str for JSON serialization
        results = []
        for event in events:
            event["_id"] = str(event["_id"])
            results.append(event)
        return results

async def update_farm_state(db, farm_id: str, event_type: str):
    """
    Helper to update running totals in FarmState.
    """
    state_data = await db["farm_states"].find_one({"farm_id": farm_id})
    state = FarmState(**state_data) if state_data else FarmState(farm_id=farm_id)
    
    if event_type == "DONE":
        state.consecutive_skips = 0
        state.last_irrigation_date = datetime.utcnow().strftime("%Y-%m-%d")
    elif event_type == "SKIPPED":
        state.consecutive_skips += 1
        
    # Trigger score recalculation
    await AnalyticsService.calculate_system_state(farm_id)

async def log_manual_irrigation(db, farm_id: str, volume_liters: float):
    """
    Logs a manual confirmation (DONE).
    """
    event = IrrigationEvent(
        farm_id=farm_id,
        date=datetime.utcnow().strftime("%Y-%m-%d"),
        recommended_volume_liters=volume_liters, # Assuming match for now
        recommended_duration_minutes=0, # Need to pass this if available
        actual_volume_liters=volume_liters,
        actual_duration_minutes=0,
        status="DONE",
        source="MANUAL"
    )
    
    await db["irrigation_history"].insert_one(event.dict())
    await update_farm_state(db, farm_id, "DONE")
    return True

async def check_irrigation_status_today(db, farm_id: str) -> bool:
    """
    Checks if there has already been a DONE or SKIPPED event today.
    """
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    count = await db["irrigation_history"].count_documents({
        "farm_id": str(farm_id),
        "date": today_str
    })
    return count > 0

async def log_skip_event(db, farm_id: str):
    """
    Logs a user decision to SKIP irrigation.
    """
    event = IrrigationEvent(
        farm_id=farm_id,
        date=datetime.utcnow().strftime("%Y-%m-%d"),
        recommended_volume_liters=0,
        recommended_duration_minutes=0,
        status="SKIPPED",
        source="MANUAL"
    )
    
    await db["irrigation_history"].insert_one(event.dict())
    await update_farm_state(db, farm_id, "SKIPPED")
    return True

async def check_yesterday_skip(db, farm_id: str) -> bool:
    """
    Checks if the user explicitly skipped irrigation yesterday.
    """
    yesterday = datetime.utcnow() - timedelta(days=1)
    yesterday_str = yesterday.strftime("%Y-%m-%d")
    
    count = await db["irrigation_history"].count_documents({
        "farm_id": str(farm_id),
        "status": "SKIPPED",
        "date": yesterday_str
    })
    return count > 0
