from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.db.models.ride import RideSearch, RideResult


class RideRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_search(self, user_id: Optional[int], pickup_address: str,
                      pickup_lat: float, pickup_lng: float,
                      destination_address: str, destination_lat: float,
                      destination_lng: float, distance_km: Optional[float] = None,
                      duration_minutes: Optional[float] = None) -> RideSearch:
        search = RideSearch(
            user_id=user_id,
            pickup_address=pickup_address,
            pickup_lat=pickup_lat,
            pickup_lng=pickup_lng,
            destination_address=destination_address,
            destination_lat=destination_lat,
            destination_lng=destination_lng,
            distance_km=distance_km,
            duration_minutes=duration_minutes,
        )
        self.db.add(search)
        self.db.commit()
        self.db.refresh(search)
        return search

    def save_results(self, search_id: int, results: List[dict]) -> List[RideResult]:
        db_results = []
        for r in results:
            result = RideResult(
                search_id=search_id,
                provider_name=r["provider"],
                category=r["category"],
                eta_minutes=r.get("eta_minutes"),
                fare_min=r.get("fare_min"),
                fare_max=r.get("fare_max"),
                currency=r.get("currency", "INR"),
                surge_multiplier=r.get("surge_multiplier", 1.0),
                is_available=r.get("available", True),
                deeplink_url=r.get("deeplink_url"),
                raw_response=r,
            )
            self.db.add(result)
            db_results.append(result)
        self.db.commit()
        return db_results

    def get_user_history(self, user_id: int, limit: int = 20, offset: int = 0) -> List[RideSearch]:
        return (
            self.db.query(RideSearch)
            .options(joinedload(RideSearch.results))
            .filter(RideSearch.user_id == user_id)
            .order_by(RideSearch.searched_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    def get_search_by_id(self, search_id: int, user_id: int) -> Optional[RideSearch]:
        return (
            self.db.query(RideSearch)
            .options(joinedload(RideSearch.results))
            .filter(RideSearch.id == search_id, RideSearch.user_id == user_id)
            .first()
        )
