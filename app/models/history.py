from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal

class IrrigationEvent(BaseModel):
    farm_id: str
    date: str = Field(..., description="YYYY-MM-DD format")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Recommendations
    recommended_volume_liters: float
    recommended_duration_minutes: float
    
    # Actuals (Nullable if skipped)
    actual_volume_liters: Optional[float] = None
    actual_duration_minutes: Optional[float] = None
    
    # Strict Status
    status: Literal["DONE", "SKIPPED", "MISSED"]
    
    # Metadata
    source: Literal["MANUAL", "DEVICE"] = "MANUAL"
    reason: Optional[str] = None

class FarmState(BaseModel):
    farm_id: str
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    # Derived Metrics
    last_irrigation_date: Optional[str] = None
    last_irrigation_volume: float = 0
    weekly_water_applied: float = 0
    consecutive_skips: int = 0
    
    # System Health
    system_confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    calibration_status: str = "Initializing"

class WeeklyStats(BaseModel):
    week_start: datetime
    total_volume_liters: float
    session_count: int
    average_duration_minutes: float
