# Architecture

## System Design

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Flutter)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Riverpod │  │ GoRouter │  │   Dio    │  │ Maps   │  │
│  │ Providers│  │   Nav    │  │ HTTP/JWT │  │  SDK   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS (JWT)
┌─────────────────────▼───────────────────────────────────┐
│                    Nginx (TLS termination)               │
│                  Rate limiting per route                 │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│               FastAPI Application                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │                 API Router v1                     │  │
│  │  /auth  /users  /compare  /places  /alerts        │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │             Provider Abstraction Layer            │  │
│  │  UberAdapter OlaAdapter RapidoAdapter NYAdapter   │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Repository  │  │    Redis     │  │   Celery     │  │
│  │   Pattern    │  │   Cache      │  │  Workers     │  │
│  └──────┬───────┘  └──────────────┘  └──────────────┘  │
└─────────┼───────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────┐
│                  PostgreSQL Database                     │
│  users · refresh_tokens · saved_places · ride_searches  │
│  ride_results · preferences · price_alerts · notif_logs │
└─────────────────────────────────────────────────────────┘
```

## Provider Adapter Pattern

Each provider implements `BaseRideProvider`. The `compare/rides` endpoint calls all providers concurrently via `asyncio.gather()`, collects results, assigns badges, and caches in Redis.

```
POST /compare/rides
  │
  ├── asyncio.gather(
  │     uber.get_estimates(route),
  │     ola.get_estimates(route),
  │     rapido.get_estimates(route),
  │     namma_yatri.get_estimates(route),
  │   )
  │
  ├── badge_results(all_estimates)
  │     cheapest = min(fare_min)
  │     fastest  = min(eta_minutes)
  │     best_val = min(fare_min + eta_minutes * 2)
  │
  ├── cache in Redis (30s TTL)
  ├── save to ride_searches + ride_results
  └── return CompareResponse
```

## State Management (Flutter)

Riverpod `AsyncNotifier` pattern:

```
User action (select route)
       ↓
selectedRouteProvider (StateProvider)
       ↓
CompareNotifier.compare(route) → POST /compare/rides
       ↓
compareResultsProvider (AsyncNotifierProvider<CompareResponse>)
       ↓
sortedResultsProvider (derived Provider, re-sorts on sortModeProvider change)
       ↓
ListView of ProviderCard widgets
       ↓
User taps BOOK → url_launcher → deep link to provider app
```

## Deep Link Strategy

Each provider has a documented URI scheme:

| Provider | Deep Link Scheme |
|----------|-----------------|
| Uber | `uber://?action=setPickup&pickup[latitude]=...` |
| Ola | `olacabs://app/launch?lat=...` |
| Rapido | `in.rapido.passenger://book?pickup_lat=...` |
| Namma Yatri | `in.juspay.nammayatri://app?sourceLat=...` |

`url_launcher` checks `canLaunchUrl()` first — if the app is not installed, it falls back to the web booking URL.

## Caching Strategy

```
Request arrives
      ↓
Redis key = "compare:{pickup_lat:.4f}:{pickup_lng:.4f}:{dest_lat:.4f}:{dest_lng:.4f}"
      ↓
Cache hit? → return cached JSON (skip provider calls)
Cache miss? → call all providers → cache result (TTL=30s) → return
```

Cache TTLs:
- Provider estimates: **30 seconds** (fares change fast)
- Places autocomplete: **1 hour** (address data is stable)
- Route info: **60 seconds**

## Alert System

Celery Beat fires `check_price_alerts` every 5 minutes:

```
For each active PriceAlert:
  → call provider.get_estimates(route)
  → if fare_min ≤ threshold (price_below)
     OR surge_multiplier == 1.0 (surge_ended)
  → send FCM push via firebase-admin
  → increment triggered_count
  → log in notification_logs
```
