import httpx
import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import redis

from app.db.database import get_db
from app.core.dependencies import get_current_active_user, get_redis_client
from app.db.models.user import User
from app.db.models.place import SavedPlace
from app.schemas.place import SavePlaceRequest, SavedPlaceResponse, PlaceAutocompleteResult
from app.core.config import settings

router = APIRouter(prefix="/places", tags=["places"])


@router.get("/autocomplete", response_model=List[PlaceAutocompleteResult])
async def autocomplete(
    query: str = Query(..., min_length=2),
    session_token: str = Query(default=""),
    redis_client: redis.Redis = Depends(get_redis_client),
    current_user: User = Depends(get_current_active_user),
):
    cache_key = f"places:autocomplete:{query.lower()}"
    cached = redis_client.get(cache_key)
    if cached:
        return [PlaceAutocompleteResult(**p) for p in json.loads(cached)]

    if not settings.GOOGLE_MAPS_API_KEY:
        # Use Photon (Komoot/OpenStreetMap) — free, no API key required
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(
                    "https://photon.komoot.io/api/",
                    params={"q": query, "limit": 6, "lang": "en"},
                    headers={"User-Agent": "RideCompare/1.0"},
                    timeout=6.0,
                )
                features = resp.json().get("features", [])
            except Exception:
                features = []

        results = []
        seen = set()
        for feat in features:
            props = feat.get("properties", {})
            coords = feat.get("geometry", {}).get("coordinates", [])
            if len(coords) < 2:
                continue
            lon, lat = float(coords[0]), float(coords[1])

            name = props.get("name") or props.get("city") or props.get("county") or ""
            city = props.get("city") or props.get("county") or ""
            state = props.get("state") or ""
            country = props.get("country") or ""
            secondary_parts = [p for p in [city if city != name else "", state, country] if p]
            secondary_text = ", ".join(secondary_parts)
            description = name + (f", {secondary_text}" if secondary_text else "")

            key = (name, state)
            if key in seen or not name:
                continue
            seen.add(key)

            osm_id = props.get("osm_id", "")
            osm_type = props.get("osm_type", "")
            results.append(PlaceAutocompleteResult(
                place_id=f"photon_{osm_type}_{osm_id}",
                description=description,
                main_text=name,
                secondary_text=secondary_text,
                latitude=lat,
                longitude=lon,
            ))

        redis_client.setex(cache_key, settings.PLACES_CACHE_TTL, json.dumps([r.model_dump() for r in results]))
        return results

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://maps.googleapis.com/maps/api/place/autocomplete/json",
            params={
                "input": query,
                "key": settings.GOOGLE_MAPS_API_KEY,
                "sessiontoken": session_token,
                "components": "country:in",
                "types": "geocode|establishment",
            },
        )
        data = resp.json()

    results = []
    for p in data.get("predictions", []):
        structured = p.get("structured_formatting", {})
        results.append(PlaceAutocompleteResult(
            place_id=p["place_id"],
            description=p["description"],
            main_text=structured.get("main_text", p["description"]),
            secondary_text=structured.get("secondary_text", ""),
        ))

    redis_client.setex(cache_key, settings.PLACES_CACHE_TTL, json.dumps([r.model_dump() for r in results]))
    return results


@router.post("/save", response_model=SavedPlaceResponse, status_code=201)
def save_place(
    body: SavePlaceRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    place = SavedPlace(
        user_id=current_user.id,
        label=body.label,
        address=body.address,
        latitude=body.latitude,
        longitude=body.longitude,
        place_id=body.place_id,
        icon=body.icon,
        is_favorite=body.is_favorite,
    )
    db.add(place)
    db.commit()
    db.refresh(place)
    return place


@router.get("/saved", response_model=List[SavedPlaceResponse])
def get_saved_places(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(SavedPlace)
        .filter(SavedPlace.user_id == current_user.id, SavedPlace.deleted_at.is_(None))
        .order_by(SavedPlace.is_favorite.desc(), SavedPlace.created_at.desc())
        .all()
    )


@router.delete("/saved/{place_id}", status_code=204)
def delete_saved_place(
    place_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    place = (
        db.query(SavedPlace)
        .filter(SavedPlace.id == place_id, SavedPlace.user_id == current_user.id)
        .first()
    )
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    from datetime import datetime, timezone
    place.deleted_at = datetime.now(timezone.utc)
    db.commit()
