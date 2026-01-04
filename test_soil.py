import requests

def test_soil():
    lat = 12.97
    lon = 77.59
    url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    params = {
        "lat": lat,
        "lon": lon,
        "property": ["clay", "sand", "silt"],
        "depth": "0-30cm",
        "value": "mean"
    }
    print(f"Testing SoilGrids API: {url}")
    try:
        r = requests.get(url, params=params, timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text[:500]}...")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_soil()
