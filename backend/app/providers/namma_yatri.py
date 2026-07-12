"""
Namma Yatri provider — open-source, no surge, South India focused.
Real fare rates per city. Available in Bangalore, Hyderabad, Chennai, Kolkata.
"""
import random
from typing import List
from app.providers.base import BaseRideProvider, RideEstimate, RouteInfo
from app.providers.fare_utils import road_km, city_from_coords

# Namma Yatri has no surge — key differentiator
_CITY_RATES = {
    "bangalore": {
        "auto":      (30, 10, 50),
        "bike_taxi": (15,  5, 25),
    },
    "hyderabad": {
        "auto":      (25, 10, 45),
        "bike_taxi": (12,  5, 22),
    },
    "chennai": {
        "auto":      (30, 11, 50),
        "bike_taxi": (None, None, None),
    },
    "kolkata": {
        "auto":      (25,  9, 40),
        "bike_taxi": (None, None, None),
    },
    "other": {
        "auto":      (25, 10, 45),
        "bike_taxi": (12,  5, 22),
    },
}

_CATEGORIES = [
    {"id": "auto",      "display_name": "Namma Yatri Auto", "vehicle_type": "auto", "comfort_level": "economy"},
    {"id": "bike_taxi", "display_name": "Namma Yatri Bike", "vehicle_type": "bike", "comfort_level": "economy"},
]


class NammaYatriProvider(BaseRideProvider):
    provider_name = "namma_yatri"
    provider_display_name = "Namma Yatri"
    store_url = "https://play.google.com/store/apps/details?id=in.juspay.nammayatri"
    logo_url = "https://cdn.ridecompare.app/logos/namma_yatri.png"

    async def get_estimates(self, route: RouteInfo) -> List[RideEstimate]:
        dist  = road_km(route.pickup_lat, route.pickup_lng, route.destination_lat, route.destination_lng)
        city  = city_from_coords(route.pickup_lat, route.pickup_lng)
        rates = _CITY_RATES.get(city, _CITY_RATES["other"])
        results = []
        for cat in _CATEGORIES:
            base_fare, per_km, min_fare = rates.get(cat["id"], (None, None, None))
            if base_fare is None:
                continue
            base = base_fare + per_km * dist
            fare = round(max(min_fare, base))
            results.append(RideEstimate(
                provider=self.provider_name,
                category=cat["id"],
                category_display=cat["display_name"],
                eta_minutes=random.randint(4, 12),
                fare_min=fare,
                fare_max=round(fare * 1.05),
                currency="INR",
                surge_multiplier=1.0,  # No surge — key differentiator
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
        fallback = quote(self.store_url, safe="")
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
