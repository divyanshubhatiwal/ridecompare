"""
Ola Cabs provider adapter.
Uses Ola's fare estimate API. Falls back to mock when key absent.
"""
import random
import math
from typing import List
import httpx
from app.providers.base import BaseRideProvider, RideEstimate, RouteInfo
from app.core.config import settings


OLA_CATEGORIES = [
    {"id": "auto", "display_name": "Ola Auto", "vehicle_type": "auto",
     "comfort_level": "economy", "base_per_km": 11, "base_fare": 15, "min_fare": 35},
    {"id": "mini", "display_name": "Ola Mini", "vehicle_type": "mini",
     "comfort_level": "economy", "base_per_km": 14, "base_fare": 25, "min_fare": 50},
    {"id": "prime_sedan", "display_name": "Ola Prime Sedan", "vehicle_type": "sedan",
     "comfort_level": "standard", "base_per_km": 20, "base_fare": 45, "min_fare": 75},
    {"id": "prime_suv", "display_name": "Ola Prime SUV", "vehicle_type": "suv",
     "comfort_level": "premium", "base_per_km": 26, "base_fare": 75, "min_fare": 130},
]


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


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
        return self._mock_estimates(route)

    async def _fetch_live(self, route: RouteInfo) -> List[RideEstimate]:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"{self.base_url}/products",
                headers={"X-APP-TOKEN": self.api_key},
                params={
                    "pickup_lat": route.pickup_lat,
                    "pickup_lng": route.pickup_lng,
                    "drop_lat": route.destination_lat,
                    "drop_lng": route.destination_lng,
                },
            )
            data = resp.json()
            categories = data.get("categories", [])
            results = []
            for c in categories:
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

    def _mock_estimates(self, route: RouteInfo) -> List[RideEstimate]:
        dist = _haversine_km(route.pickup_lat, route.pickup_lng,
                             route.destination_lat, route.destination_lng)
        surge = random.choice([1.0, 1.0, 1.0, 1.0, 1.3])
        results = []
        for cat in OLA_CATEGORIES:
            base = cat["base_fare"] + cat["base_per_km"] * dist
            fare_min = max(cat["min_fare"], base * 0.88) * surge
            fare_max = max(cat["min_fare"], base * 1.08) * surge
            eta = int(random.randint(5, 15))
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
