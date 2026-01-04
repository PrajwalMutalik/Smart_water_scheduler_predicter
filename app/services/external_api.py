import requests
import time

def fetch_weather(lat, lon):
    """
    Fetches strict weather data from Open-Meteo.
    Ref: https://open-meteo.com/en/docs
    Returns: Dict with temperature_c, rain_probability, humidity, wind_kmph
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": ["temperature_2m", "precipitation", "wind_speed_10m", "relative_humidity_2m"],
        "hourly": ["soil_moisture_3_9cm"],
        "daily": ["precipitation_probability_max"],
        "timezone": "auto",
        "forecast_days": 1
    }

    try:
        r = requests.get(url, params=params, timeout=5) # Reduced timeout for responsiveness
        r.raise_for_status()
        data = r.json()
        
        current = data.get("current", {})
        daily = data.get("daily", {})
        hourly = data.get("hourly", {})
        
        # Safe extraction with defaults
        rain_prob = daily.get("precipitation_probability_max", [0])[0]
        if rain_prob is None: rain_prob = 0
        
        # Extract Hour 0 for Soil Moisture (Approximation for 'Current')
        sm_list = hourly.get("soil_moisture_3_9cm", [])
        sm_val = sm_list[0] if sm_list else 0.2

        return {
            "temperature_c": current.get("temperature_2m", 25),
            "rain_probability": rain_prob,
            "humidity": current.get("relative_humidity_2m", 50),
            "wind_kmph": current.get("wind_speed_10m", 0),
            "soil_moisture_index": sm_val # Volumetric (0.0 - 1.0)
        }
    except Exception as e:
        print(f"Weather API Error: {e}. Using Fallback.")
        # Return safe default instead of None to prevent "System Offline"
        return {
            "temperature_c": 25.0,
            "rain_probability": 10, # Conservative
            "humidity": 50,
            "wind_kmph": 5,
            "soil_moisture_index": 0.3, # Loam/Moist
            "is_fallback": True
        }

def fetch_soil_type(lat, lon, retries=1):
    """
    Fetches soil properties from ISRIC SoilGrids.
    Query: 0-30cm depth.
    Derives type based on composition.
    Includes robust retries for user-requested persistence.
    """
    url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    params = {
        "lat": lat,
        "lon": lon,
        "property": ["clay", "sand", "silt"],
        "depth": "0-30cm",
        "value": "mean"
    }

    backoff = 1
    for attempt in range(retries + 1): # Try once + retries
        try:
            print(f"DEBUG SOIL: Fetching {url} with params {params} (Attempt {attempt+1}/{retries+1})")
            r = requests.get(url, params=params, timeout=3) # Aggressive timeout for UI responsiveness
            
            if r.status_code == 400:
                print(f"DEBUG SOIL: 400 Bad Request (Invalid Coords?) - Aborting")
                return None
            
            r.raise_for_status()
                
            props = r.json().get("properties")
            if not props:
                print(f"DEBUG SOIL: No 'properties' in response: {r.json().keys()}")
                # Retry if empty response, could be transient
                raise ValueError("Invalid SoilGrids response")
                
            print(f"DEBUG SOIL: Success. Keys: {props.keys()}")
            
            def get_val(prop):
                try:
                    return props[prop]["depths"][0]["values"]["mean"]
                except:
                    return 0
            
            clay = get_val("clay")
            sand = get_val("sand")
            silt = get_val("silt")
            
            # SoilGrids units: cg/kg (e.g. 300 = 30%)
            derived_type = "Loamy"
            if clay > 350:
                derived_type = "Clay"
            elif sand > 500:
                derived_type = "Sandy"
            
            return {
                "type": derived_type,
                "source": "SoilGrids",
                "details": {
                    "clay": clay,
                    "sand": sand,
                    "silt": silt
                }
            }
        except Exception as e:
            if attempt < retries:
                print(f"DEBUG SOIL: Error {e}. Retrying in {backoff}s...")
                time.sleep(backoff)
            else:
                 print(f"DEBUG SOIL: API Failed after {retries+1} attempts: {e}")
            
    print("DEBUG SOIL: Exhausted retries. Returning None.")
    return None
