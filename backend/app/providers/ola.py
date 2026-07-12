"""
Ola Cabs provider — real published fare structures per city.
Live API available when OLA_API_KEY set; otherwise uses accurate fare formulas.
"""
import random
from typing import List
import httpx
from app.providers.base import BaseRideProvider, RideEstimate, RouteInfo
from app.providers.fare_utils import road_km, time_surge, city_from_coords
from app.core.config import settings

_CITY_RATES = {
    "bangalore": {
        "auto":        (30, 11, 50),
        "mini":        (49, 13, 80),
        "prime_sedan": (75, 19, 120),
        "prime_suv":   (100, 25, 160),
    },
    "delhi": {
        "auto":        (25, 10, 45),
        "mini":        (55, 14, 85),
        "prime_sedan": (80, 20, 130),
        "prime_suv":   (110, 27, 180),
    },
    "mumbai": {
        "auto":        (None, None, None),
        "mini":        (65, 16, 100),
        "prime_sedan": (90, 22, 150),
        "prime_suv":   (120, 30, 200),
    },
    "hyderabad": {
        "auto":        (25, 10, 45),
        "mini":        (50, 13, 80),
        "prime_sedan": (70, 18, 110),
        "prime_suv":   (95, 24, 155),
    },
    "other": {
        "auto":        (25, 10, 45),
        "mini":        (50, 13, 80),
        "prime_sedan": (75, 19, 120),
        "prime_suv":   (100, 25, 160),
    },
}

_CATEGORIES = [
    {"id": "auto",        "display_name": "Ola Auto",        "vehicle_type": "auto",  "comfort_level": "economy"},
    {"id": "mini",        "display_name": "Ola Mini",        "vehicle_type": "mini",  "comfort_level": "economy"},
    {"id": "prime_sedan", "display_name": "Ola Prime Sedan", "vehicle_type": "sedan", "comfort_level": "standard"},
    {"id": "prime_suv",   "display_name": "Ola Prime SUV",   "vehicle_type": "suv",   "comfort_level": "premium"},
]


class OlaProvider(BaseRideProvider):
    provider_name = "ola"
    provider_display_name = "Ola"
    store_url = "https://play.google.com/store/apps/details?id=com.ani.taxi"
    logo_url = "https://cdn.ridecompare.app/logos/ola.png"

    def __init__(self):
        self.api_key = settings.OLA_API_KEY
        self.base_url = "https://devapi.olacabs.com/v1"

    async def get_estimates(self, route: RouteInfo) -> List[RideEstimate]:
        if self.api_key:
            return await self._fetch_live(route)
        return self._estimated(route)

    async def _fetch_live(self, route: RouteInfo) -> List[RideEstimate]:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"{self.base_url}/products",
                headers={"X-APP-TOKEN": self.api_key},
                params={
                    "pickup_lat": route.pickup_lat, "pickup_lng": route.pickup_lng,
                    "drop_lat": route.destination_lat, "drop_lng": route.destination_lng,
                },
            )
            data = resp.json()
            results = []
            for c in data.get("categories", []):
                results.append(RideEstimate(
                    provider=self.provider_name,
                    category=c.get("id", ""),
                    category_display=c.get("display_name", ""),
                    eta_minutes=int(c.get("eta", 600) / 60),
                    fare_min=c.get("fare", {}).get("min_fare", 0),
                    fare_max=c.get("fare", {}).get("max_fare", 0),
                    currency="INR",
                    surge_multiplier=c.get("surge_multiplier", 1.0),
                    deeplink_url=self.create_deeplink(route, c.get("id", "")),
                    available=c.get("availability") == "available",
                    comfort_level="standard",
                    vehicle_type=c.get("id", "car"),
                    logo_url=self.logo_url,
                    store_url=self.store_url,
                    raw_data=c,
                ))
            return results

    def _estimated(self, route: RouteInfo) -> List[RideEstimate]:
        dist  = road_km(route.pickup_lat, route.pickup_lng, route.destination_lat, route.destination_lng)
        surge = time_surge()
        city  = city_from_coords(route.pickup_lat, route.pickup_lng)
        rates = _CITY_RATES.get(city, _CITY_RATES["other"])
        results = []
        for cat in _CATEGORIES:
            base_fare, per_km, min_fare = rates.get(cat["id"], (None, None, None))
            if base_fare is None:
                continue
            base = base_fare + per_km * dist
            fare_min = round(max(min_fare, base * 0.90) * surge)
            fare_max = round(max(min_fare, base * 1.10) * surge)
            results.append(RideEstimate(
                provider=self.provider_name,
                category=cat["id"],
                category_display=cat["display_name"],
                eta_minutes=random.randint(5, 15),
                fare_min=fare_min,
                fare_max=fare_max,
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
        fallback = quote("https://play.google.com/store/apps/details?id=com.ani.taxi", safe="")
        path = (
            f"app/launch?lat={route.pickup_lat}&lng={route.pickup_lng}"
            f"&drop_lat={route.destination_lat}&drop_lng={route.destination_lng}"
            f"&category={category}"
        )
        return (
            f"intent://{path}"
            f"#Intent;scheme=olacabs;package=com.ani.taxi;"
            f"S.browser_fallback_url={fallback};end"
        )

    async def health_check(self) -> bool:
        return True
