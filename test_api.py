import requests

def test_weather():
    url = "https://api.open-meteo.com/v1/forecast"
    # Replicating the exact params from external_api.py
    params = {
        "latitude": 12.97,
        "longitude": 77.59,
        "current": ["temperature_2m", "precipitation", "wind_speed_10m", "relative_humidity_2m", "soil_moisture_3_9cm"],
        "daily": ["precipitation_probability_max"],
        "timezone": "auto"
    }
    print(f"Testing URL: {url}")
    print(f"Params: {params}")
    try:
        r = requests.get(url, params=params, timeout=5)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text[:500]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_weather()
