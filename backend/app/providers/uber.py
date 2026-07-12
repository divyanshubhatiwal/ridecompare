"""
Uber provider — real API when UBER_SERVER_TOKEN set, accurate fare formulas otherwise.
Get your token at: https://developer.uber.com
"""
import random
from typing import List
import httpx
from app.providers.base import BaseRideProvider, RideEstimate, RouteInfo
from app.providers.fare_utils import road_km, time_surge, city_from_coords
from app.core.config import settings

_CITY_RATES = {
    "bangalore": {
        "UberAuto": ("auto",  "economy",  20, 12, 50),
        "UberGo":   ("mini",  "economy",  50, 14, 90),
        "UberX":    ("sedan", "standard", 80, 20, 130),
        "UberXL":   ("suv",   "premium",  120, 27, 200),
    },
    "delhi": {
        "UberAuto": ("auto",  "economy",  25, 11, 50),
        "UberGo":   ("mini",  "economy",  55, 14, 90),
        "UberX":    ("sedan", "standard", 85, 21, 140),
        "UberXL":   ("suv",   "premium",  130, 28, 220),
    },
    "mumbai": {
        "UberGo":   ("mini",  "economy",  65, 17, 110),
        "UberX":    ("sedan", "standard", 95, 24, 160),
        "UberXL":   ("suv",   "premium",  140, 32, 230),
    },
    "hyderabad": {
        "UberAuto": ("auto",  "economy",  20, 11, 45),
        "UberGo":   ("mini",  "economy",  50, 13, 85),
        "UberX":    ("sedan", "standard", 75, 19, 125),
        "UberXL":   ("suv",   "premium",  110, 26, 180),
    },
    "other": {
        "UberAuto": ("auto",  "economy",  20, 12, 45),
        "UberGo":   ("mini",  "economy",  50, 13, 85),
        "UberX":    ("sedan", "standard", 80, 20, 130),
        "UberXL":   ("suv",   "premium",  120, 27, 200),
    },
}

_DISPLAY = {
    "UberAuto": "Uber Auto",
    "UberGo":   "Uber Go",
    "UberX":    "Uber X",
    "UberXL":   "Uber XL",
}


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
        return self._estimated(route)

    async def _fetch_live(self, route: RouteInfo) -> List[RideEstimate]:
        async with httpx.AsyncClient(timeout=8.0) as client:
            price_resp = await client.get(
                f"{self.base_url}/estimates/price",
                headers={"Authorization": f"Token {self.server_token}"},
                params={
                    "start_latitude": route.pickup_lat, "start_longitude": route.pickup_lng,
                    "end_latitude": route.destination_lat, "end_longitude": route.destination_lng,
                },
            )
            time_resp = await client.get(
                f"{self.base_url}/estimates/time",
                headers={"Authorization": f"Token {self.server_token}"},
                params={"start_latitude": route.pickup_lat, "start_longitude": route.pickup_lng},
            )
            times = {t["display_name"]: t["estimate"] for t in time_resp.json().get("times", [])}
            results = []
            for p in price_resp.json().get("prices", []):
                name = p.get("display_name", "")
                city_rates = _CITY_RATES.get(
                    city_from_coords(route.pickup_lat, route.pickup_lng), _CITY_RATES["other"]
                )
                cat_info = city_rates.get(name, ("car", "standard", 0, 0, 0))
                results.append(RideEstimate(
                    provider=self.provider_name,
                    category=name,
                    category_display=p.get("localized_display_name", name),
                    eta_minutes=int(times.get(name, 600) / 60),
                    fare_min=p.get("low_estimate", 0),
                    fare_max=p.get("high_estimate", 0),
                    currency=p.get("currency_code", "INR"),
                    surge_multiplier=p.get("surge_multiplier") or 1.0,
                    deeplink_url=self.create_deeplink(route, name),
                    available=True,
                    comfort_level=cat_info[1],
                    vehicle_type=cat_info[0],
                    logo_url=self.logo_url,
                    store_url=self.store_url,
                    raw_data=p,
                ))
            return results

    def _estimated(self, route: RouteInfo) -> List[RideEstimate]:
        dist  = road_km(route.pickup_lat, route.pickup_lng, route.destination_lat, route.destination_lng)
        surge = time_surge()
        city  = city_from_coords(route.pickup_lat, route.pickup_lng)
        rates = _CITY_RATES.get(city, _CITY_RATES["other"])
        results = []
        for product_id, (vtype, comfort, base_fare, per_km, min_fare) in rates.items():
            base = base_fare + per_km * dist
            fare_min = round(max(min_fare, base * 0.92) * surge)
            fare_max = round(max(min_fare, base * 1.08) * surge)
            results.append(RideEstimate(
                provider=self.provider_name,
                category=product_id,
                category_display=_DISPLAY.get(product_id, product_id),
                eta_minutes=random.randint(4, 12),
                fare_min=fare_min,
                fare_max=fare_max,
                currency="INR",
                surge_multiplier=surge,
                deeplink_url=self.create_deeplink(route, product_id),
                available=True,
                comfort_level=comfort,
                vehicle_type=vtype,
                logo_url=self.logo_url,
                store_url=self.store_url,
            ))
        return results

    def create_deeplink(self, route: RouteInfo, category: str) -> str:
        from urllib.parse import quote
        fallback = quote("https://play.google.com/store/apps/details?id=com.ubercab", safe="")
        path = (
            f"?action=setPickup"
            f"&pickup[latitude]={route.pickup_lat}&pickup[longitude]={route.pickup_lng}"
            f"&dropoff[latitude]={route.destination_lat}&dropoff[longitude]={route.destination_lng}"
            f"&product_id={category}"
        )
        return (
            f"intent://{path}"
            f"#Intent;scheme=uber;package=com.ubercab;"
            f"S.browser_fallback_url={fallback};end"
        )

    async def health_check(self) -> bool:
        return True
