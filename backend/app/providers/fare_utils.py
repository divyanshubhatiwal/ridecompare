"""
Shared fare calculation utilities with real Indian city rates.
Road distance = haversine * 1.3 (typical Indian road factor).
Surge varies by time of day.
"""
import math
import random
from datetime import datetime, timezone


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def road_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Approximate road distance using 1.3x haversine factor."""
    return haversine_km(lat1, lon1, lat2, lon2) * 1.3


def time_surge() -> float:
    """Return realistic surge based on current hour (IST)."""
    hour = (datetime.now(timezone.utc).hour + 5) % 24  # approx IST
    # Peak hours: 8-10 AM, 5-8 PM
    if 8 <= hour <= 10 or 17 <= hour <= 20:
        return random.choice([1.2, 1.3, 1.5, 1.5, 1.0])
    # Late night: 11 PM - 5 AM
    if hour >= 23 or hour <= 5:
        return random.choice([1.3, 1.5, 1.0, 1.0])
    return random.choice([1.0, 1.0, 1.0, 1.0, 1.1])


def city_from_coords(lat: float, lon: float) -> str:
    """Detect Indian city from coordinates for city-specific rates."""
    cities = {
        "bangalore": ((12.7, 13.2), (77.4, 77.8)),
        "delhi":     ((28.4, 28.9), (76.8, 77.4)),
        "mumbai":    ((18.8, 19.4), (72.7, 73.1)),
        "hyderabad": ((17.2, 17.7), (78.2, 78.7)),
        "pune":      ((18.4, 18.7), (73.7, 74.1)),
        "chennai":   ((12.9, 13.3), (80.1, 80.4)),
        "kolkata":   ((22.4, 22.7), (88.2, 88.5)),
    }
    for city, ((lat_min, lat_max), (lon_min, lon_max)) in cities.items():
        if lat_min <= lat <= lat_max and lon_min <= lon <= lon_max:
            return city
    return "other"
