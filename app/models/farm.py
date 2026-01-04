from pydantic import BaseModel, Field
from typing import Optional, List

class FarmBase(BaseModel):
    name: str
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    crop: str
    region: str
    plot_area: float = Field(..., gt=0)
    pump_flow: float = Field(..., ge=0)

class FarmCreate(FarmBase):
    pass

class Farm(FarmBase):
    id: str = Field(alias="_id")
    user_id: str

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    crop: Optional[str] = None
    plot_area: Optional[float] = None
