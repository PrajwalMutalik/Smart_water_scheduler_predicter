from services.external_api import fetch_weather, fetch_soil_type
from services.prediction_models import predict_irrigation

def run_irrigation_pipeline(lat, lon, crop, region, plot_area, pump_flow, is_irrigated_today=False, consecutive_skips=0):
    """
    Orchestrates the data gathering and decision making.
    Returns the strict Advisory Object required by frontend.
    """
    
    # Debug Logging
    print(f"DEBUG PIPELINE: Received Lat: {lat}, Lon: {lon}, IrrigatedToday: {is_irrigated_today}, ConsecutiveSkips: {consecutive_skips}")

    # 1. Authoritative Data Fetching
    weather_data = fetch_weather(lat, lon)
    soil_data = fetch_soil_type(lat, lon)
    
    status = "COMPLETE"
    missing_fields = []
    
    # 2. Handling Missing Data (Graceful Degradation)
    if not weather_data or weather_data.get("is_fallback"):
        if not weather_data:
            # Absolute failure (should be rare now)
            status = "PARTIAL"
            missing_fields.append("weather")
            weather_data = {
                "temperature_c": 25, "rain_probability": 0, 
                "humidity": 50, "wind_kmph": 0
            }
        else:
            # Fallback was active
            missing_fields.append("weather_approx")
        
    if not soil_data:
        # Fallback to Loam but allow pipeline to proceed
        print("DEBUG PIPELINE: Soil data missing. Defaulting to Loam.")
        soil_data = {
            "type": "loam", 
            "source": "Estimated (Default)"
        }
        missing_fields.append("soil_approx")

    # 3. Server-Side Decision Logic (Pseudo-ET Based)
    # Inputs
    temp = weather_data.get("temperature_c", 25)
    humidity = weather_data.get("humidity", 50)
    rain_prob = weather_data.get("rain_probability", 0)
    wind_speed = weather_data.get("wind_kmph", 0)
    soil_type = soil_data.get("type", "").lower()
    
    # Base Water Need (mm/day) - approximated for "Generic Crop" if not specified
    # High temp + Low humidity + High wind = High Evapotranspiration
    base_evapotranspiration = (temp / 25) * (1 + (100 - humidity)/100) + (wind_speed / 20)
    
    # Adjust for Crop (Simple Coefficients)
    crop_factor = 1.0
    if crop.lower() in ["rice", "sugarcane"]: crop_factor = 1.2
    elif crop.lower() in ["cactus", "aloe"]: crop_factor = 0.5
    elif crop.lower() in ["wheat", "corn"]: crop_factor = 1.0
    
    water_need_mm = base_evapotranspiration * crop_factor
    
    # Adjust for Soil Retention
    # Sand drains fast (needs more water/freq), Clay holds water (needs less)
    soil_factor = 1.0
    if "sand" in soil_type: soil_factor = 1.2
    elif "clay" in soil_type: soil_factor = 0.8
    
    # Calculate baseline heuristic first
    final_water_mm = water_need_mm * soil_factor
    
    # ML Model Integration
    try:
        from services.prediction_models import predict_irrigation
        ml_input = {
            "crop": crop,
            "region": region,
            "temperature": temp,
            "soil_moisture_index": weather_data.get("soil_moisture_index", 0.5),
            "rain_prob": rain_prob,
            "wind_speed": wind_speed
        }
        ml_prediction = predict_irrigation(ml_input)
        print(f"DEBUG PIPELINE: ML Prediction: {ml_prediction}")
        
        # Blend Heuristic (30%) and ML (70%) for robustness
        # Assuming model outputs 'mm' demand. If it outputs 0 or 1, we need to know.
        # But regressor usually means value. 
        final_water_mm = (final_water_mm * 0.3) + (ml_prediction * 0.7)
    except Exception as e:
        print(f"ML Pipeline Error: {e}")

    # Adjust for Live Soil Moisture (Fine Tuning on top of ML)
    sm_index = weather_data.get("soil_moisture_index", 0.3)
    moisture_note = "" # Reset or init
    
    if sm_index < 0.20:
        final_water_mm *= 1.2 # Slight boost if critical
        moisture_note = "Model adapted for critical dryness."
    elif sm_index < 0.30:
        final_water_mm *= 1.2
        moisture_note = "Soil moisture low."
    elif sm_index > 0.50:
        final_water_mm *= 0.5 # Soil is wet, reduce demand
    elif sm_index > 0.70:
        final_water_mm = 0 # Soil is saturated
        moisture_note = "Soil saturated."

    # Apply Cumulative Deficit from Skips
    deficit_reason = ""
    if consecutive_skips > 0:
        added_demand = 4.0 * consecutive_skips
        final_water_mm += added_demand
        deficit_reason = f" (Includes deficit from {consecutive_skips} skipped days)"

    # Decide Action
    action = "MONITOR"
    reason = "Conditions are optimal."
    confidence = "HIGH"

    if status == "PARTIAL": # Only weather triggers strict PARTIAL now
        action = "MONITOR"
        reason = f"Critical data unavailable: {', '.join(missing_fields)}. Monitor manually."
        confidence = "LOW"
    elif is_irrigated_today:
        action = "COMPLETE"
        reason = "Irrigation already completed for today."
        final_water_mm = 0
        confidence = "HIGH"
    elif rain_prob > 50:
        action = "NO_IRRIGATION"
        reason = f"High rain probability ({rain_prob}%). Irrigation postponed."
        final_water_mm = 0
    elif final_water_mm > 2.0: # Threshold for "Needs Water" (lowered for sensitivity)
        action = "IRRIGATE"
        reason = f"High evapotranspiration ({final_water_mm:.1f}mm) detected{deficit_reason}. {moisture_note} Soil drying likelihood high."
        if "soil_approx" in missing_fields:
             confidence = "MEDIUM"
             reason += " (Using generic soil profile)"
        if "weather_approx" in missing_fields:
             confidence = "LOW"
             reason += " (Using generic weather fallback)"
    else:
        action = "MONITOR"
        reason = f"Moisture levels adequate (Est. demand {final_water_mm:.1f}mm). {moisture_note} No action needed."

    # 96. Calculate Volume and Duration
    # 1mm on 1 acre = 4046.86 Liters
    # Volume (L) = mm * acres * 4046.86
    volume_liters = 0
    duration_minutes = 0
    
    if action == "IRRIGATE":
        volume_liters = final_water_mm * plot_area * 4047
        if pump_flow > 0:
            duration_minutes = int(volume_liters / pump_flow)
        else:
            duration_minutes = 0 # Prevent div by zero
            reason += " (Pump flow not set)"

    # --- Smart Scheduling (New) ---
    start_time_str = "N/A"
    end_time_str = "N/A"
    
    if action == "IRRIGATE":
        # Strategy: Avoid heat.
        # Temp > 30 => Evening (18:00) to minimize evap
        # Else => Morning (06:00) standard
        
        from datetime import datetime, timedelta
        
        base_hour = 6 # 6 AM default
        if temp > 30:
            base_hour = 17 # 5 PM if very hot
        
        # We need a reference date, but this is a generic daily advice.
        # We'll just return time strings.
        
        start_hour = base_hour
        start_minute = 0
        
        # Calculate End Time
        # Add duration minutes to start time
        # This is simple string math for now, or using dummy datetime
        dummy_start = datetime(2024, 1, 1, start_hour, start_minute)
        dummy_end = dummy_start + timedelta(minutes=duration_minutes)
        
        start_time_str = dummy_start.strftime("%I:%M %p")
        end_time_str = dummy_end.strftime("%I:%M %p")

    # 4. Construct Strict Response Object
    return {
        "location": {
            "lat": lat,
            "lon": lon
        },
        "weather": {
            "temperature": weather_data.get("temperature_c"),
            "rain_probability": weather_data.get("rain_probability"),
            "humidity": weather_data.get("humidity"),
            "wind": weather_data.get("wind_kmph")
        } if weather_data else None,
        "soil": soil_data,
        "water_demand": {
            "mm_today": round(final_water_mm, 2), 
            "volume_liters": round(volume_liters, 2),
            "reason": reason
        },
        "recommendation": {
            "action": action,
            "reason": reason,
            "confidence": confidence
        },
        "schedule": {
            "duration_minutes": duration_minutes,
            "volume_liters": round(volume_liters, 2),
            "start_time": start_time_str,
            "end_time": end_time_str,
            "strategy": "Heat Avoidance" if temp > 30 else "Standard Morning"
        },
        "status": status
    }
