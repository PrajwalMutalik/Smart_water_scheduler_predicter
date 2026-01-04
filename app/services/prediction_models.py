import joblib
import pandas as pd

MODEL_PATH = "app/ml/saved_models/irrigation_model.pkl"
PREPROCESSOR_PATH = "app/ml/saved_models/preprocessor.pkl"

model = joblib.load(MODEL_PATH)
preprocessor = joblib.load(PREPROCESSOR_PATH)

def predict_irrigation(data: dict) -> float:
    """
    Predicts irrigation requirement using the pre-trained Gradient Boosting model.
    Input data expected:
    - crop (str)
    - region (str)
    - soil_moisture_index (float 0-1)
    - temperature (float)
    - rain_prob (float)
    - wind_speed (float)
    """
    try:
        # 1. Map Crop
        val = data.get("crop", "WHEAT")
        crop = val.upper() if val else "WHEAT"
        valid_crops = ['BANANA', 'BEAN', 'CABBAGE', 'CITRUS', 'COTTON', 'MAIZE', 'MELON',
           'MUSTARD', 'ONION', 'POTATO', 'RICE', 'SOYABEAN', 'SUGARCANE',
           'TOMATO', 'WHEAT']
        if crop not in valid_crops: crop = "WHEAT" # Default
        
        # 2. Map Region
        val_reg = data.get("region", "SEMI ARID")
        region = val_reg.upper() if val_reg else "SEMI ARID"
        valid_regions = ['DESERT', 'HUMID', 'SEMI ARID', 'SEMI HUMID']
        if region not in valid_regions: region = "SEMI ARID"
    
        # 3. Map Soil (Condition based on moisture)
        sm = data.get("soil_moisture_index", 0.3)
        soil_cat = "HUMID"
        if sm < 0.3: soil_cat = "DRY"
        elif sm > 0.6: soil_cat = "WET"
        
        # 4. Map Temperature (Binning)
        temp = data.get("temperature", 25)
        temp_cat = "20-30"
        if temp < 20: temp_cat = "10-20"
        elif temp < 30: temp_cat = "20-30"
        elif temp < 40: temp_cat = "30-40"
        else: temp_cat = "40-50"
        
        # 5. Map Weather Condition
        rain = data.get("rain_prob", 0)
        wind = data.get("wind_speed", 0)
        weather_cat = "NORMAL"
        if rain > 50: weather_cat = "RAINY"
        elif wind > 20: weather_cat = "WINDY"
        elif temp > 30: weather_cat = "SUNNY"
    
        # Construct DataFrame with exact columns expected by OneHotEncoder
        input_df = pd.DataFrame([{
            "CROP TYPE": crop,
            "SOIL TYPE": soil_cat,
            "REGION": region,
            "TEMPERATURE": temp_cat,
            "WEATHER CONDITION": weather_cat
        }])
        
        # Transform
        X = preprocessor.transform(input_df)
        
        # Predict
        pred = model.predict(X)[0]
        return float(pred)
    except Exception as e:
        print(f"ML Prediction Error: {e}")
        return 0.0
