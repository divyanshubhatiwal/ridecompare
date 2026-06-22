"""
InDrive provider adapter.
InDrive uses a bidding model — passengers propose a fare, drivers accept/counter.
We return a suggested fare range based on distance (what drivers typically accept).
"""
import random
import math
from typing import List
from urllib.parse import quote
from app.providers.base import BaseRideProvider, RideEstimate, RouteInfo


INDRIVE_CATEGORIES = [
    {
        "product_name": "economy",
        "display_name": "InDrive Economy",
        "vehicle_type": "mini",
        "comfort_level": "economy",
        "base_fare_per_km": 10,
        "base_fare": 20,
        "min_fare": 40,
    },
    {
        "product_name": "comfort",
        "display_name": "InDrive Comfort",
        "vehicle_type": "sedan",
        "comfort_level": "standard",
        "base_fare_per_km": 14,
        "base_fare": 35,
        "min_fare": 65,
    },
]


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
         * math.sin(dlon / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


class InDriveProvider(BaseRideProvider):
    provider_name = "indrive"
    provider_display_name = "InDrive"
    logo_url = ""
    store_url = "https://play.google.com/store/apps/details?id=sinet.startup.inDriver"

    async def get_estimates(self, route: RouteInfo) -> List[RideEstimate]:
        return self._mock_estimates(route)

    async def health_check(self) -> bool:
        return True  # Mock provider always healthy

    def _mock_estimates(self, route: RouteInfo) -> List[RideEstimate]:
        dist = _haversine_km(
            route.pickup_lat, route.pickup_lng,
            route.destination_lat, route.destination_lng,
        )
        results = []
        for cat in INDRIVE_CATEGORIES:
            base = cat["base_fare"] + cat["base_fare_per_km"] * dist
            # InDrive: no surge; fares are negotiated so range is wider
            fare_min = max(cat["min_fare"], round(base * 0.85))
            fare_max = max(cat["min_fare"], round(base * 1.05))
            eta = random.randint(5, 16)
            results.append(RideEstimate(
                provider=self.provider_name,
                category=cat["product_name"],
                category_display=cat["display_name"],
                eta_minutes=eta,
                fare_min=fare_min,
                fare_max=fare_max,
                currency="INR",
                surge_multiplier=1.0,
                deeplink_url=self.create_deeplink(route, cat["product_name"]),
                available=True,
                comfort_level=cat["comfort_level"],
                vehicle_type=cat["vehicle_type"],
                logo_url=self.logo_url,
                store_url=self.store_url,
            ))
        return results

    def create_deeplink(self, route: RouteInfo, category: str) -> str:
        fallback = quote(self.store_url, safe="")
        path = (f"?pickup_lat={route.pickup_lat}&pickup_lng={route.pickup_lng}"
                f"&dropoff_lat={route.destination_lat}&dropoff_lng={route.destination_lng}")
        return (f"intent://{path}#Intent;scheme=indrive;"
                f"package=sinet.startup.inDriver;S.browser_fallback_url={fallback};end")
