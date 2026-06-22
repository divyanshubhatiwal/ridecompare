"""
Rapido provider adapter.
Rapido focuses on bikes and auto. Mock-ready with realistic pricing.
"""
import random
import math
from typing import List
from app.providers.base import BaseRideProvider, RideEstimate, RouteInfo
from app.core.config import settings


RAPIDO_CATEGORIES = [
    {"id": "bike", "display_name": "Rapido Bike", "vehicle_type": "bike",
     "comfort_level": "economy", "base_per_km": 7, "base_fare": 10, "min_fare": 20},
    {"id": "auto", "display_name": "Rapido Auto", "vehicle_type": "auto",
     "comfort_level": "economy", "base_per_km": 10, "base_fare": 15, "min_fare": 30},
    {"id": "cab_economy", "display_name": "Rapido Cab Economy", "vehicle_type": "mini",
     "comfort_level": "economy", "base_per_km": 13, "base_fare": 22, "min_fare": 45},
]


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


class RapidoProvider(BaseRideProvider):
    provider_name = "rapido"
    provider_display_name = "Rapido"
    store_url = "https://play.google.com/store/apps/details?id=com.rapido.passenger"
    logo_url = "https://cdn.ridecompare.app/logos/rapido.png"

    def __init__(self):
        self.api_key = settings.RAPIDO_API_KEY

    async def get_estimates(self, route: RouteInfo) -> List[RideEstimate]:
        return self._mock_estimates(route)

    def _mock_estimates(self, route: RouteInfo) -> List[RideEstimate]:
        dist = _haversine_km(route.pickup_lat, route.pickup_lng,
                             route.destination_lat, route.destination_lng)
        surge = random.choice([1.0, 1.0, 1.0, 1.0, 1.0, 1.1])
        results = []
        for cat in RAPIDO_CATEGORIES:
            base = cat["base_fare"] + cat["base_per_km"] * dist
            fare_min = max(cat["min_fare"], base * 0.92) * surge
            fare_max = max(cat["min_fare"], base * 1.05) * surge
            eta = int(random.randint(3, 10) if cat["vehicle_type"] == "bike" else random.randint(5, 14))
            results.append(RideEstimate(
                provider=self.provider_name,
                category=cat["id"],
                category_display=cat["display_name"],
                eta_minutes=eta,
                fare_min=round(fare_min, 0),
                fare_max=round(fare_max, 0),
                currency="INR",
                surge_multiplier=surge,
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
        fallback = quote("https://play.google.com/store/apps/details?id=com.rapido.passenger", safe="")
        path = (
            f"book?pickup_lat={route.pickup_lat}&pickup_lng={route.pickup_lng}"
            f"&drop_lat={route.destination_lat}&drop_lng={route.destination_lng}"
            f"&service_type={category}"
        )
        return (
            f"intent://{path}"
            f"#Intent;scheme=rapido;package=com.rapido.passenger;"
            f"S.browser_fallback_url={fallback};end"
        )

    async def health_check(self) -> bool:
        return True
