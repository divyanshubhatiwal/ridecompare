"""
InDrive provider — bidding model, no surge.
Shows suggested fare range based on what drivers typically accept.
"""
import random
from typing import List
from urllib.parse import quote
from app.providers.base import BaseRideProvider, RideEstimate, RouteInfo
from app.providers.fare_utils import road_km, city_from_coords

_CITY_RATES = {
    "bangalore": {
        "economy": ("mini",  "economy",  40, 11, 70),
        "comfort": ("sedan", "standard", 65, 17, 110),
    },
    "delhi": {
        "economy": ("mini",  "economy",  45, 12, 80),
        "comfort": ("sedan", "standard", 70, 18, 120),
    },
    "hyderabad": {
        "economy": ("mini",  "economy",  35, 10, 65),
        "comfort": ("sedan", "standard", 60, 16, 100),
    },
    "mumbai": {
        "economy": ("mini",  "economy",  55, 14, 90),
        "comfort": ("sedan", "standard", 80, 20, 130),
    },
    "other": {
        "economy": ("mini",  "economy",  40, 11, 70),
        "comfort": ("sedan", "standard", 65, 17, 110),
    },
}

_DISPLAY = {"economy": "InDrive Economy", "comfort": "InDrive Comfort"}


class InDriveProvider(BaseRideProvider):
    provider_name = "indrive"
    provider_display_name = "InDrive"
    logo_url = ""
    store_url = "https://play.google.com/store/apps/details?id=sinet.startup.inDriver"

    async def get_estimates(self, route: RouteInfo) -> List[RideEstimate]:
        dist  = road_km(route.pickup_lat, route.pickup_lng, route.destination_lat, route.destination_lng)
        city  = city_from_coords(route.pickup_lat, route.pickup_lng)
        rates = _CITY_RATES.get(city, _CITY_RATES["other"])
        results = []
        for cat_id, (vtype, comfort, base_fare, per_km, min_fare) in rates.items():
            base = base_fare + per_km * dist
            # InDrive: wider range since it's bidding-based
            fare_min = round(max(min_fare, base * 0.82))
            fare_max = round(max(min_fare, base * 1.08))
            results.append(RideEstimate(
                provider=self.provider_name,
                category=cat_id,
                category_display=_DISPLAY[cat_id],
                eta_minutes=random.randint(5, 16),
                fare_min=fare_min,
                fare_max=fare_max,
                currency="INR",
                surge_multiplier=1.0,
                deeplink_url=self.create_deeplink(route, cat_id),
                available=True,
                comfort_level=comfort,
                vehicle_type=vtype,
                logo_url=self.logo_url,
                store_url=self.store_url,
            ))
        return results

    def create_deeplink(self, route: RouteInfo, category: str) -> str:
        fallback = quote(self.store_url, safe="")
        path = (
            f"?pickup_lat={route.pickup_lat}&pickup_lng={route.pickup_lng}"
            f"&dropoff_lat={route.destination_lat}&dropoff_lng={route.destination_lng}"
        )
        return (
            f"intent://{path}#Intent;scheme=indrive;"
            f"package=sinet.startup.inDriver;S.browser_fallback_url={fallback};end"
        )

    async def health_check(self) -> bool:
        return True
