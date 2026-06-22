# API Reference

Base URL: `https://api.ridecompare.app/api/v1`

All protected endpoints require: `Authorization: Bearer <access_token>`

---

## Auth

### POST /auth/register
Register a new user.

**Body:**
```json
{
  "email": "user@example.com",
  "full_name": "Arjun Sharma",
  "password": "strongpass123"
}
```

**Response 201:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

---

### POST /auth/login
Login with email + password.

**Body:**
```json
{ "email": "user@example.com", "password": "strongpass123" }
```

**Response 200:** Same as register.

---

### POST /auth/refresh
Exchange refresh token for new access token (rotates refresh token).

**Body:**
```json
{ "refresh_token": "eyJ..." }
```

---

### POST /auth/logout
Revoke a refresh token.

**Body:**
```json
{ "refresh_token": "eyJ..." }
```

**Response 204:** No content.

---

## Compare Rides

### POST /compare/rides
**The core endpoint.** Calls all provider adapters concurrently and returns normalized results.

**Body:**
```json
{
  "pickup_lat": 12.9716,
  "pickup_lng": 77.5946,
  "pickup_address": "Koramangala, Bangalore",
  "destination_lat": 12.9352,
  "destination_lng": 77.6245,
  "destination_address": "HSR Layout, Bangalore"
}
```

**Response 200:**
```json
{
  "search_id": 42,
  "pickup_address": "Koramangala, Bangalore",
  "destination_address": "HSR Layout, Bangalore",
  "distance_km": 5.2,
  "total_providers": 4,
  "available_providers": 4,
  "results": [
    {
      "provider": "rapido",
      "provider_display_name": "Rapido",
      "category": "bike",
      "category_display": "Rapido Bike",
      "eta_minutes": 4,
      "fare_min": 110,
      "fare_max": 120,
      "fare_display": "₹110–₹120",
      "currency": "INR",
      "surge_multiplier": 1.0,
      "is_surging": false,
      "deeplink_url": "in.rapido.passenger://book?...",
      "available": true,
      "comfort_level": "economy",
      "vehicle_type": "bike",
      "logo_url": "https://cdn.ridecompare.app/logos/rapido.png",
      "badges": ["cheapest", "fastest"]
    },
    {
      "provider": "ola",
      "provider_display_name": "Ola",
      "category": "mini",
      "category_display": "Ola Mini",
      "eta_minutes": 8,
      "fare_min": 198,
      "fare_max": 220,
      "fare_display": "₹198–₹220",
      "currency": "INR",
      "surge_multiplier": 1.0,
      "is_surging": false,
      "deeplink_url": "olacabs://app/launch?...",
      "available": true,
      "comfort_level": "economy",
      "vehicle_type": "mini",
      "logo_url": "https://cdn.ridecompare.app/logos/ola.png",
      "badges": []
    },
    {
      "provider": "uber",
      "provider_display_name": "Uber",
      "category": "UberAuto",
      "category_display": "Uber Auto",
      "eta_minutes": 6,
      "fare_min": 215,
      "fare_max": 240,
      "fare_display": "₹215–₹240",
      "currency": "INR",
      "surge_multiplier": 1.2,
      "is_surging": true,
      "deeplink_url": "uber://?action=setPickup&...",
      "available": true,
      "comfort_level": "economy",
      "vehicle_type": "auto",
      "logo_url": "https://cdn.ridecompare.app/logos/uber.png",
      "badges": []
    }
  ]
}
```

**Badges:**
- `cheapest` — lowest `fare_min` among available results
- `fastest` — lowest `eta_minutes` among available results
- `best_value` — best combined score of fare + ETA (only if not already cheapest or fastest)

---

## Alerts

### POST /alerts/price
Create a price or surge alert.

**Body:**
```json
{
  "alert_type": "price_below",
  "pickup_address": "Koramangala",
  "pickup_lat": 12.9716,
  "pickup_lng": 77.5946,
  "destination_address": "Airport",
  "destination_lat": 13.1989,
  "destination_lng": 77.7068,
  "provider": null,
  "threshold_amount": 300
}
```

`alert_type` values: `price_below` | `surge_ended`

---

## Error Responses

All errors return:
```json
{
  "detail": "Human-readable error message"
}
```

| Code | Meaning |
|------|---------|
| 400 | Validation error / duplicate |
| 401 | Invalid or expired token |
| 403 | Forbidden |
| 404 | Resource not found |
| 422 | Request body validation failed |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
