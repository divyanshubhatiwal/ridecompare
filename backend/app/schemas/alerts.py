from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CreateAlertRequest(BaseModel):
    alert_type: str           # price_below, surge_ended
    pickup_address: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    destination_address: str
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None
    provider: Optional[str] = None
    threshold_amount: Optional[float] = None
    expires_at: Optional[datetime] = None


class AlertResponse(BaseModel):
    id: int
    alert_type: str
    pickup_address: str
    destination_address: str
    provider: Optional[str]
    threshold_amount: Optional[float]
    is_active: bool
    triggered_count: int
    last_triggered_at: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class PreferencesResponse(BaseModel):
    preferred_sort: str
    avoid_surge: bool
    max_surge_multiplier: float
    preferred_providers: list
    preferred_ride_types: list
    airport_mode: bool
    notifications_enabled: bool
    price_alert_enabled: bool
    surge_alert_enabled: bool
    currency: str

    class Config:
        from_attributes = True


class UpdatePreferencesRequest(BaseModel):
    preferred_sort: Optional[str] = None
    avoid_surge: Optional[bool] = None
    max_surge_multiplier: Optional[float] = None
    preferred_providers: Optional[list] = None
    preferred_ride_types: Optional[list] = None
    airport_mode: Optional[bool] = None
    notifications_enabled: Optional[bool] = None
    price_alert_enabled: Optional[bool] = None
    surge_alert_enabled: Optional[bool] = None
