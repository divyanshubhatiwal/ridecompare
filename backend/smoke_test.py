"""Full smoke test of the RideCompare API."""
import os, sys, json

os.environ["DEV_SQLITE"] = "1"
os.environ["SECRET_KEY"] = "dev_secret"
os.environ["POSTGRES_USER"] = "dev"
os.environ["POSTGRES_PASSWORD"] = "dev"
os.environ["POSTGRES_DB"] = "dev"
sys.path.insert(0, os.path.dirname(__file__))

from app.db.database import Base, engine
from app.db.models import *  # noqa
Base.metadata.create_all(bind=engine)

import logging
logging.disable(logging.CRITICAL)  # silence request logs for clean output

from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)

def check(label, resp, expected_status=200):
    status = "OK" if resp.status_code == expected_status else "FAIL"
    print(f"  [{status}] {label:40s} [{resp.status_code}]")
    if resp.status_code not in (expected_status, 200, 201, 204):
        print(f"    ERROR: {resp.text[:200]}")
    return resp.status_code == expected_status

print()
print("=" * 60)
print("  RideCompare API - Smoke Test")
print("=" * 60)

# ── AUTH ──────────────────────────────────────────────────────────
print("\n[AUTH]")
r = client.post("/api/v1/auth/register", json={
    "email": "rider@ridecompare.app",
    "full_name": "Priya Nair",
    "password": "password99"
})
check("POST /auth/register", r, 201)
tokens = r.json()
access_token = tokens["access_token"]
refresh_token = tokens["refresh_token"]
headers = {"Authorization": f"Bearer {access_token}"}

r = client.post("/api/v1/auth/login", json={"email": "rider@ridecompare.app", "password": "password99"})
check("POST /auth/login", r, 200)

r = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
check("POST /auth/refresh", r, 200)
new_tokens = r.json()
headers = {"Authorization": f"Bearer {new_tokens['access_token']}"}

# ── USERS ─────────────────────────────────────────────────────────
print("\n[USERS]")
r = client.get("/api/v1/users/me", headers=headers)
check("GET /users/me", r, 200)
me = r.json()
print(f"    → {me['full_name']} <{me['email']}>")

r = client.patch("/api/v1/users/me", json={"phone_number": "+91-9876543210"}, headers=headers)
check("PATCH /users/me", r, 200)

# ── PLACES ───────────────────────────────────────────────────────
print("\n[PLACES]")
r = client.get("/api/v1/places/autocomplete?query=koramangala", headers=headers)
check("GET /places/autocomplete", r, 200)
places = r.json()
print(f"    → {len(places)} autocomplete results")

r = client.post("/api/v1/places/save", json={
    "label": "Home",
    "address": "Koramangala 4th Block, Bangalore",
    "latitude": 12.9352,
    "longitude": 77.6245,
    "icon": "home",
    "is_favorite": True
}, headers=headers)
check("POST /places/save", r, 201)

r = client.get("/api/v1/places/saved", headers=headers)
check("GET /places/saved", r, 200)
print(f"    → {len(r.json())} saved place(s)")

# ── COMPARE RIDES ─────────────────────────────────────────────────
print("\n[COMPARE RIDES]")
compare_payload = {
    "pickup_lat": 12.9352,
    "pickup_lng": 77.6245,
    "pickup_address": "Koramangala 4th Block, Bangalore",
    "destination_lat": 12.9121,
    "destination_lng": 77.6446,
    "destination_address": "HSR Layout Sector 2, Bangalore"
}
r = client.post("/api/v1/compare/rides", json=compare_payload, headers=headers)
check("POST /compare/rides", r, 200)
data = r.json()
search_id = data["search_id"]
print(f"    → search_id={search_id}  providers={data['available_providers']}/{data['total_providers']}  options={len(data['results'])}")

print()
print(f"  {'Category':<24} {'Fare':>10} {'ETA':>7}  {'Surge':>6}  Badges")
print("  " + "-" * 62)
for est in sorted(data["results"], key=lambda x: x["fare_min"]):
    surge = f"{est['surge_multiplier']}x" if est["is_surging"] else "-"
    badges = ", ".join(est["badges"]) or "-"
    print(f"  {est['category_display']:<24} {est['fare_display']:>10} {est['eta_minutes']:>6}m  {surge:>6}  {badges}")

# ── HISTORY ───────────────────────────────────────────────────────
print("\n[HISTORY]")
r = client.get("/api/v1/compare/history", headers=headers)
check("GET /compare/history", r, 200)
print(f"    → {len(r.json())} history item(s)")

r = client.get(f"/api/v1/compare/history/{search_id}", headers=headers)
check(f"GET /compare/history/{search_id}", r, 200)

# ── ALERTS ────────────────────────────────────────────────────────
print("\n[ALERTS]")
r = client.post("/api/v1/alerts/price", json={
    "alert_type": "price_below",
    "pickup_address": "Koramangala",
    "pickup_lat": 12.9352,
    "pickup_lng": 77.6245,
    "destination_address": "Airport",
    "destination_lat": 13.1989,
    "destination_lng": 77.7068,
    "threshold_amount": 300
}, headers=headers)
check("POST /alerts/price", r, 201)
alert_id = r.json()["id"]

r = client.get("/api/v1/alerts", headers=headers)
check("GET /alerts", r, 200)
print(f"    → {len(r.json())} alert(s)")

r = client.delete(f"/api/v1/alerts/{alert_id}", headers=headers)
check(f"DELETE /alerts/{alert_id}", r, 204)

# ── PREFERENCES ───────────────────────────────────────────────────
print("\n[PREFERENCES]")
r = client.get("/api/v1/preferences", headers=headers)
check("GET /preferences", r, 200)
print(f"    → sort={r.json()['preferred_sort']}  avoid_surge={r.json()['avoid_surge']}")

r = client.patch("/api/v1/preferences", json={
    "preferred_sort": "fastest",
    "avoid_surge": True
}, headers=headers)
check("PATCH /preferences", r, 200)
print(f"    → updated sort={r.json()['preferred_sort']}")

# ── LOGOUT ────────────────────────────────────────────────────────
print("\n[AUTH LOGOUT]")
r = client.post("/api/v1/auth/logout", json={"refresh_token": new_tokens["refresh_token"]})
check("POST /auth/logout", r, 204)

print()
print("=" * 60)
print("  All tests complete!")
print("=" * 60)
print()
