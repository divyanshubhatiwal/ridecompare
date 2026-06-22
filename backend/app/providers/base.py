from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class RideEstimate:
    provider: str
    category: str
    category_display: str
    eta_minutes: int
    fare_min: float
    fare_max: float
    currency: str
    surge_multiplier: float
    deeplink_url: str
    available: bool
    comfort_level: str          # economy, standard, premium
    vehicle_type: str           # auto, bike, mini, sedan, suv
    logo_url: str
    store_url: Optional[str] = None
    raw_data: Optional[dict] = None

    @property
    def is_surging(self) -> bool:
        return self.surge_multiplier > 1.0

    @property
    def fare_display(self) -> str:
        if self.fare_min == self.fare_max:
            return f"₹{int(self.fare_min)}"
        return f"₹{int(self.fare_min)}–₹{int(self.fare_max)}"


@dataclass
class RouteInfo:
    pickup_lat: float
    pickup_lng: float
    destination_lat: float
    destination_lng: float
    distance_km: Optional[float] = None
    duration_minutes: Optional[float] = None


class BaseRideProvider(ABC):
    provider_name: str = ""
    provider_display_name: str = ""
    logo_url: str = ""
    is_available_in_region: bool = True

    @abstractmethod
    async def get_estimates(self, route: RouteInfo) -> List[RideEstimate]:
        """Fetch all ride category estimates for a given route."""
        ...

    @abstractmethod
    def create_deeplink(self, route: RouteInfo, category: str) -> str:
        """Generate a deep link URL to open the provider app at the booking screen."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the provider API is reachable."""
        ...

    def _normalize_estimate(self, raw: dict) -> RideEstimate:
        """Subclasses can override for provider-specific normalization."""
        raise NotImplementedError
