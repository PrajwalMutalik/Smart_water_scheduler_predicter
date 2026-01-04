from fastapi import APIRouter
from services.irrigation_pipeline import run_irrigation_pipeline

router = APIRouter()

@router.post("/irrigation/predict")
def predict_irrigation(data: dict):
    return run_irrigation_pipeline(
        lat=data["lat"],
        lon=data["lon"],
        crop=data["crop"],
        region=data["region"],
        plot_area=data["plot_area"],
        pump_flow=data["pump_flow"]
    )
