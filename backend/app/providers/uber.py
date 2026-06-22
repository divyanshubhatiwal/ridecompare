"""
Uber provider adapter.
Uses Uber's Price Estimates API (v1.2) and Time Estimates API (v1.2).
Requires UBER_SERVER_TOKEN in env. Falls back to realistic mock data when token absent.
"""
import random
import math
from typing import List
from urllib.parse import quote
import httpx
from app.providers.base import BaseRideProvider, RideEstimate, RouteInfo
from app.core.config import settings


UBER_CATEGORIES = [
    {
        "product_name": "UberAuto",
        "display_name": "Uber Auto",
        "vehicle_type": "auto",
        "comfort_level": "economy",
        "base_fare_per_km": 12.5,
        "base_fare": 20,
        "min_fare": 40,
    },
    {
        "product_name": "UberGo",
        "display_name": "Uber Go",
        "vehicle_type": "mini",
        "comfort_level": "economy",
        "base_fare_per_km": 16,
        "base_fare": 30,
        "min_fare": 60,
    },
    {
        "product_name": "UberX",
        "display_name": "Uber X",
        "vehicle_type": "sedan",
        "comfort_level": "standard",
        "base_fare_per_km": 22,
        "base_fare": 50,
        "min_fare": 80,
    },
    {
        "product_name": "UberXL",
        "display_name": "Uber XL",
        "vehicle_type": "suv",
        "comfort_level": "premium",
        "base_fare_per_km": 28,
        "base_fare": 80,
        "min_fare": 150,
    },
]


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


class UberProvider(BaseRideProvider):
    provider_name = "uber"
    provider_display_name = "Uber"
    logo_url = "https://cdn.ridecompare.app/logos/uber.png"
    store_url = "https://play.google.com/store/apps/details?id=com.ubercab"

    def __init__(self):
        self.server_token = settings.UBER_SERVER_TOKEN
        self.base_url = "https://api.uber.com/v1.2"

    async def get_estimates(self, route: RouteInfo) -> List[RideEstimate]:
        if self.server_token:
            return await self._fetch_live(route)
        return self._mock_estimates(route)

    async def _fetch_live(self, route: RouteInfo) -> List[RideEstimate]:
        async with httpx.AsyncClient(timeout=8.0) as client:
            price_resp = await client.get(
                f"{self.base_url}/estimates/price",
                headers={"Authorization": f"Token {self.server_token}"},
                params={
                    "start_latitude": route.pickup_lat,
                    "start_longitude": route.pickup_lng,
                    "end_latitude": route.destination_lat,
                    "end_longitude": route.destination_lng,
                },
            )
            time_resp = await client.get(
                f"{self.base_url}/estimates/time",
                headers={"Authorization": f"Token {self.server_token}"},
                params={"start_latitude": route.pickup_lat, "start_longitude": route.pickup_lng},
            )
            prices = price_resp.json().get("prices", [])
            times = {t["display_name"]: t["estimate"] for t in time_resp.json().get("times", [])}

            results = []
            for p in prices:
                cat = next((c for c in UBER_CATEGORIES if c["product_name"] == p.get("display_name")), None)
                results.append(RideEstimate(
                    provider=self.provider_name,
                    category=p.get("display_name", ""),
                    category_display=p.get("localized_display_name", p.get("display_name", "")),
                    eta_minutes=int(times.get(p.get("display_name", ""), 600) / 60),
                    fare_min=p.get("low_estimate", 0),
                    fare_max=p.get("high_estimate", 0),
                    currency=p.get("currency_code", "INR"),
                    surge_multiplier=p.get("surge_multiplier") or 1.0,
                    deeplink_url=self.create_deeplink(route, p.get("display_name", "")),
                    available=True,
                    comfort_level=cat["comfort_level"] if cat else "standard",
                    vehicle_type=cat["vehicle_type"] if cat else "car",
                    logo_url=self.logo_url,
                store_url=self.store_url,
                    raw_data=p,
                ))
            return results

    def _mock_estimates(self, route: RouteInfo) -> List[RideEstimate]:
        dist = _haversine_km(route.pickup_lat, route.pickup_lng,
                             route.destination_lat, route.destination_lng)
        surge = random.choice([1.0, 1.0, 1.0, 1.2, 1.5])
        results = []
        for cat in UBER_CATEGORIES:
            base = cat["base_fare"] + cat["base_fare_per_km"] * dist
            fare_min = max(cat["min_fare"], base * 0.9) * surge
            fare_max = max(cat["min_fare"], base * 1.1) * surge
            eta = int(random.randint(4, 12))
            results.append(RideEstimate(
                provider=self.provider_name,
                category=cat["product_name"],
                category_display=cat["display_name"],
                eta_minutes=eta,
                fare_min=round(fare_min, 0),
                fare_max=round(fare_max, 0),
                currency="INR",
                surge_multiplier=surge,
                deeplink_url=self.create_deeplink(route, cat["product_name"]),
                available=True,
                comfort_level=cat["comfort_level"],
                vehicle_type=cat["vehicle_type"],
                logo_url=self.logo_url,
                store_url=self.store_url,
            ))
        return results

    def create_deeplink(self, route: RouteInfo, category: str) -> str:
        # Android Intent URL — works reliably in Chrome on Android even if custom
        # scheme is blocked. Falls back to Play Store if app not installed.
        from urllib.parse import quote
        fallback = quote("https://play.google.com/store/apps/details?id=com.ubercab", safe="")
        path = (
            f"?action=setPickup"
            f"&pickup[latitude]={route.pickup_lat}"
            f"&pickup[longitude]={route.pickup_lng}"
            f"&dropoff[latitude]={route.destination_lat}"
            f"&dropoff[longitude]={route.destination_lng}"
            f"&product_id={category}"
        )
        return (
            f"intent://{path}"
            f"#Intent;scheme=uber;package=com.ubercab;"
            f"S.browser_fallback_url={fallback};end"
        )

    async def health_check(self) -> bool:
        return True
