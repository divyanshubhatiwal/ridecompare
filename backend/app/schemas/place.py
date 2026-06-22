from pydantic import BaseModel
from typing import Optional, List


class SavePlaceRequest(BaseModel):
    label: str
    address: str
    latitude: float
    longitude: float
    place_id: Optional[str] = None
    icon: Optional[str] = "star"
    is_favorite: bool = False


class SavedPlaceResponse(BaseModel):
    id: int
    label: str
    address: str
    latitude: float
    longitude: float
    place_id: Optional[str]
    icon: Optional[str]
    is_favorite: bool

    class Config:
        from_attributes = True


class PlaceAutocompleteResult(BaseModel):
    place_id: str
    description: str
    main_text: str
    secondary_text: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
