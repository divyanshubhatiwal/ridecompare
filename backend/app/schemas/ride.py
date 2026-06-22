from pydantic import BaseModel, field_validator
from typing import List, Optional


class CompareRequest(BaseModel):
    pickup_lat: float
    pickup_lng: float
    pickup_address: str
    destination_lat: float
    destination_lng: float
    destination_address: str

    @field_validator("pickup_lat", "destination_lat")
    @classmethod
    def validate_latitude(cls, v: float) -> float:
        if not -90 <= v <= 90:
            raise ValueError("Latitude must be between -90 and 90")
        return v

    @field_validator("pickup_lng", "destination_lng")
    @classmethod
    def validate_longitude(cls, v: float) -> float:
        if not -180 <= v <= 180:
            raise ValueError("Longitude must be between -180 and 180")
        return v


class RideEstimateResponse(BaseModel):
    provider: str
    provider_display_name: str
    category: str
    category_display: str
    eta_minutes: int
    fare_min: float
    fare_max: float
    fare_display: str
    currency: str
    surge_multiplier: float
    is_surging: bool
    deeplink_url: str
    store_url: Optional[str] = None
    available: bool
    comfort_level: str
    vehicle_type: str
    logo_url: str
    badges: List[str] = []


class CompareResponse(BaseModel):
    search_id: int
    results: List[RideEstimateResponse]
    pickup_address: str
    destination_address: str
    distance_km: Optional[float]
    total_providers: int
    available_providers: int


class RideHistoryItem(BaseModel):
    id: int
    pickup_address: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    destination_address: str
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None
    searched_at: str
    result_count: int
    cheapest_fare: Optional[float]
    cheapest_provider: Optional[str]

    class Config:
        from_attributes = True


class RideHistoryDetail(BaseModel):
    id: int
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    destination_address: str
    destination_lat: float
    destination_lng: float
    distance_km: Optional[float]
    searched_at: str
    results: List[RideEstimateResponse]

    class Config:
        from_attributes = True
