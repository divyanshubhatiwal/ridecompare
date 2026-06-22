"""
Namma Yatri provider adapter.
Open-source ride platform popular in South India.
"""
import random
import math
from typing import List
from app.providers.base import BaseRideProvider, RideEstimate, RouteInfo
from app.core.config import settings


NY_CATEGORIES = [
    {"id": "auto", "display_name": "Namma Yatri Auto", "vehicle_type": "auto",
     "comfort_level": "economy", "base_per_km": 10, "base_fare": 12, "min_fare": 30},
    {"id": "bike_taxi", "display_name": "Namma Yatri Bike", "vehicle_type": "bike",
     "comfort_level": "economy", "base_per_km": 6, "base_fare": 8, "min_fare": 18},
]


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


class NammaYatriProvider(BaseRideProvider):
    provider_name = "namma_yatri"
    provider_display_name = "Namma Yatri"
    store_url = "https://play.google.com/store/apps/details?id=net.openjoe.yatri"
    logo_url = "https://cdn.ridecompare.app/logos/namma_yatri.png"

    def __init__(self):
        self.api_key = settings.NAMMA_YATRI_API_KEY

    async def get_estimates(self, route: RouteInfo) -> List[RideEstimate]:
        return self._mock_estimates(route)

    def _mock_estimates(self, route: RouteInfo) -> List[RideEstimate]:
        dist = _haversine_km(route.pickup_lat, route.pickup_lng,
                             route.destination_lat, route.destination_lng)
        # Namma Yatri typically has no surge — key differentiator
        results = []
        for cat in NY_CATEGORIES:
            base = cat["base_fare"] + cat["base_per_km"] * dist
            fare = max(cat["min_fare"], base)
            eta = int(random.randint(5, 13))
            results.append(RideEstimate(
                provider=self.provider_name,
                category=cat["id"],
                category_display=cat["display_name"],
                eta_minutes=eta,
                fare_min=round(fare * 0.95, 0),
                fare_max=round(fare * 1.05, 0),
                currency="INR",
                surge_multiplier=1.0,  # Namma Yatri does not surge
                deeplink_url=self.create_deeplink(route, cat["id"]),
                available=True,
                comfort_level=cat["comfort_level"],
                vehicle_type=cat["vehicle_type"],
                logo_url=self.logo_url,
                store_url=self.store_url,
            ))
        return results

    def create_deeplink(self, route: RouteInfo, category: str) -> str:
        from urllib.parse import quote
        fallback = quote("https://play.google.com/store/apps/details?id=in.juspay.nammayatri", safe="")
        path = (
            f"app?sourceLat={route.pickup_lat}&sourceLong={route.pickup_lng}"
            f"&destLat={route.destination_lat}&destLong={route.destination_lng}"
        )
        return (
            f"intent://{path}"
            f"#Intent;scheme=yatri;package=in.juspay.nammayatri;"
            f"S.browser_fallback_url={fallback};end"
        )

    async def health_check(self) -> bool:
        return True
