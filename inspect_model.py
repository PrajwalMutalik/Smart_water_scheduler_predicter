import joblib
import pandas as pd
import sklearn

print(f"Sklearn version: {sklearn.__version__}")

try:
    preprocessor = joblib.load("app/ml/saved_models/preprocessor.pkl")
    print("Preprocessor Loaded.")
    
    if hasattr(preprocessor, "transformers_"):
        print("Transformers:", preprocessor.transformers_)
        for name, trans, cols in preprocessor.transformers_:
            print(f"Transformer: {name}, Cols: {cols}")
            if hasattr(trans, "categories_"):
                 print(f"  Categories: {trans.categories_}")
            elif hasattr(trans, "named_steps"): 
                 for step_name, step in trans.named_steps.items():
                     if hasattr(step, "categories_"):
                         print(f"  Categories for {step_name}: {step.categories_}")
            elif name == "cat" and hasattr(trans, "get_feature_names_out"):
                 try:
                     print(f"  Feature Names: {trans.get_feature_names_out()}")
                 except: pass
            
    # Also load model to see if it has info
    model = joblib.load("app/ml/saved_models/irrigation_model.pkl")
    print("Model Loaded:", type(model))
    if hasattr(model, "feature_names_in_"):
        print("Model Features:", model.feature_names_in_)

except Exception as e:
    print(f"Error: {e}")
