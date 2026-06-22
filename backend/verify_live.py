# -*- coding: utf-8 -*-
"""Verify the live API returns correct UTF-8 fare strings."""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import httpx

BASE = "http://127.0.0.1:8000/api/v1"

login = httpx.post(f"{BASE}/auth/login",
    json={"email": "live@demo.app", "password": "demo1234"})
token = login.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

r = httpx.post(f"{BASE}/compare/rides",
    json={
        "pickup_lat": 28.6304, "pickup_lng": 77.2177,
        "pickup_address": "Connaught Place, New Delhi",
        "destination_lat": 28.6129, "destination_lng": 77.2295,
        "destination_address": "India Gate, New Delhi"
    },
    headers=headers)

data = r.json()
print(f"HTTP {r.status_code}  search_id={data['search_id']}  "
      f"providers={data['available_providers']}/{data['total_providers']}  "
      f"options={len(data['results'])}")
print()
print(f"  {'Ride':<24} {'Fare':>12} {'ETA':>7}  {'Surge':>6}  Badges")
print("  " + "-" * 65)

for e in sorted(data["results"], key=lambda x: x["fare_min"]):
    surge = f"{e['surge_multiplier']}x" if e["is_surging"] else "-"
    badges = ", ".join(e["badges"]) or "-"
    print(f"  {e['category_display']:<24} {e['fare_display']:>12} {e['eta_minutes']:>6}m"
          f"  {surge:>6}  {badges}")

print()
print("fare_display byte check (first result):")
sample = sorted(data["results"], key=lambda x: x["fare_min"])[0]["fare_display"]
print(f"  value  : {sample}")
print(f"  bytes  : {sample.encode('utf-8').hex()}")
print(f"  correct: rupee sign U+20B9 = e2 82 b9")
print(f"  match  : {'e2 82 b9' in sample.encode('utf-8').hex()}")
