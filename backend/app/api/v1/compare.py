import asyncio
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import redis

from app.db.database import get_db
from app.core.dependencies import get_current_active_user, get_redis_client
from app.db.models.user import User
from app.db.repositories.ride_repository import RideRepository
from app.providers.registry import get_all_providers
from app.providers.base import RouteInfo, RideEstimate
from app.schemas.ride import CompareRequest, CompareResponse, RideEstimateResponse, RideHistoryItem, RideHistoryDetail
from app.core.config import settings

router = APIRouter(prefix="/compare", tags=["compare"])


def _badge_results(estimates: List[RideEstimate]) -> List[RideEstimateResponse]:
    """Assign Cheapest / Fastest / Best Value badges."""
    available = [e for e in estimates if e.available]
    if not available:
        return [_to_response(e, []) for e in estimates]

    min_fare = min(e.fare_min for e in available)
    min_eta = min(e.eta_minutes for e in available)

    # Best Value = cheapest fare with reasonable ETA (within 1.5x fastest)
    best_value = min(available, key=lambda e: e.fare_min + e.eta_minutes * 2)

    result = []
    for e in estimates:
        badges = []
        if e.available:
            if e.fare_min == min_fare:
                badges.append("cheapest")
            if e.eta_minutes == min_eta:
                badges.append("fastest")
            if e == best_value and "cheapest" not in badges and "fastest" not in badges:
                badges.append("best_value")
        result.append(_to_response(e, badges))
    return result


def _to_response(e: RideEstimate, badges: List[str]) -> RideEstimateResponse:
    return RideEstimateResponse(
        provider=e.provider,
        provider_display_name=e.provider_display_name if hasattr(e, 'provider_display_name') else e.provider.capitalize(),
        category=e.category,
        category_display=e.category_display,
        eta_minutes=e.eta_minutes,
        fare_min=e.fare_min,
        fare_max=e.fare_max,
        fare_display=e.fare_display,
        currency=e.currency,
        surge_multiplier=e.surge_multiplier,
        is_surging=e.is_surging,
        deeplink_url=e.deeplink_url,
        store_url=e.store_url,
        available=e.available,
        comfort_level=e.comfort_level,
        vehicle_type=e.vehicle_type,
        logo_url=e.logo_url,
        badges=badges,
    )


def _cache_key(req: CompareRequest) -> str:
    return (
        f"compare:{req.pickup_lat:.4f}:{req.pickup_lng:.4f}"
        f":{req.destination_lat:.4f}:{req.destination_lng:.4f}"
    )


@router.post("/rides", response_model=CompareResponse)
async def compare_rides(
    body: CompareRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis_client),
):
    cache_key = _cache_key(body)
    cached = redis_client.get(cache_key)
    if cached:
        data = json.loads(cached)
        # Still save the search for history
        repo = RideRepository(db)
        search = repo.create_search(
            user_id=current_user.id,
            pickup_address=body.pickup_address,
            pickup_lat=body.pickup_lat,
            pickup_lng=body.pickup_lng,
            destination_address=body.destination_address,
            destination_lat=body.destination_lat,
            destination_lng=body.destination_lng,
        )
        return CompareResponse(**{**data, "search_id": search.id})

    route = RouteInfo(
        pickup_lat=body.pickup_lat,
        pickup_lng=body.pickup_lng,
        destination_lat=body.destination_lat,
        destination_lng=body.destination_lng,
    )

    providers = get_all_providers()
    tasks = [p.get_estimates(route) for p in providers]

    results_nested = await asyncio.gather(*tasks, return_exceptions=True)

    all_estimates: List[RideEstimate] = []
    for r in results_nested:
        if isinstance(r, Exception):
            continue
        all_estimates.extend(r)

    badged = _badge_results(all_estimates)

    repo = RideRepository(db)
    search = repo.create_search(
        user_id=current_user.id,
        pickup_address=body.pickup_address,
        pickup_lat=body.pickup_lat,
        pickup_lng=body.pickup_lng,
        destination_address=body.destination_address,
        destination_lat=body.destination_lat,
        destination_lng=body.destination_lng,
    )
    repo.save_results(search.id, [e.model_dump() if hasattr(e, 'model_dump') else e.__dict__ for e in all_estimates])

    response = CompareResponse(
        search_id=search.id,
        results=badged,
        pickup_address=body.pickup_address,
        destination_address=body.destination_address,
        distance_km=route.distance_km,
        total_providers=len(providers),
        available_providers=len(set(e.provider for e in all_estimates if e.available)),
    )

    redis_client.setex(cache_key, settings.PROVIDER_CACHE_TTL, response.model_dump_json())
    return response


@router.get("/history", response_model=List[RideHistoryItem])
def get_history(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    repo = RideRepository(db)
    searches = repo.get_user_history(current_user.id, limit=limit, offset=offset)
    items = []
    for s in searches:
        cheapest = min((r for r in s.results if r.is_available), key=lambda r: r.fare_min, default=None)
        items.append(RideHistoryItem(
            id=s.id,
            pickup_address=s.pickup_address,
            pickup_lat=s.pickup_lat,
            pickup_lng=s.pickup_lng,
            destination_address=s.destination_address,
            destination_lat=s.destination_lat,
            destination_lng=s.destination_lng,
            searched_at=s.searched_at.isoformat(),
            result_count=len(s.results),
            cheapest_fare=cheapest.fare_min if cheapest else None,
            cheapest_provider=cheapest.provider_name if cheapest else None,
        ))
    return items


@router.get("/history/{search_id}", response_model=RideHistoryDetail)
def get_history_detail(
    search_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    repo = RideRepository(db)
    search = repo.get_search_by_id(search_id, current_user.id)
    if not search:
        raise HTTPException(status_code=404, detail="Search not found")

    results = [
        RideEstimateResponse(
            provider=r.provider_name,
            provider_display_name=r.provider_name.capitalize(),
            category=r.category,
            category_display=r.category,
            eta_minutes=r.eta_minutes or 0,
            fare_min=r.fare_min or 0,
            fare_max=r.fare_max or 0,
            fare_display=f"₹{int(r.fare_min or 0)}–₹{int(r.fare_max or 0)}",
            currency=r.currency,
            surge_multiplier=r.surge_multiplier or 1.0,
            is_surging=(r.surge_multiplier or 1.0) > 1.0,
            deeplink_url=r.deeplink_url or "",
            available=r.is_available,
            comfort_level="standard",
            vehicle_type="car",
            logo_url="",
            badges=[],
        )
        for r in search.results
    ]

    return RideHistoryDetail(
        id=search.id,
        pickup_address=search.pickup_address,
        pickup_lat=search.pickup_lat,
        pickup_lng=search.pickup_lng,
        destination_address=search.destination_address,
        destination_lat=search.destination_lat,
        destination_lng=search.destination_lng,
        distance_km=search.distance_km,
        searched_at=search.searched_at.isoformat(),
        results=results,
    )
