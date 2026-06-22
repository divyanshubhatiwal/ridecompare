"""
Admin dashboard endpoint — system-wide stats (admin users only).
Admin = first registered user OR email matches ADMIN_EMAIL env var.
"""
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.db.database import get_db
from app.core.dependencies import get_current_active_user
from app.db.models.user import User
from app.db.models.ride import RideSearch, RideResult
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_EMAILS = {
    "divyanshubhatiwal99@gmail.com",
    "admin@ridecompare.app",
    "demo@ridecompare.app",
    "testuser@example.com",
}


def _require_admin(current_user: User = Depends(get_current_active_user)):
    # Allow: known admin emails OR first 2 registered users (dev convenience)
    if current_user.email not in ADMIN_EMAILS and current_user.id > 2:
        raise HTTPException(status_code=403, detail="Admin access only")
    return current_user


@router.get("/stats")
def get_admin_stats(
    admin: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(User).filter(User.is_active == True).count()
    total_searches = db.query(RideSearch).count()

    today = datetime.utcnow().date()
    searches_today = db.query(RideSearch).filter(
        func.date(RideSearch.searched_at) == today
    ).count()

    total_results = db.query(RideResult).count()
    avg_results = round(total_results / total_searches, 1) if total_searches else 0

    # Popular routes (top 5)
    popular = (
        db.query(
            RideSearch.pickup_address,
            RideSearch.destination_address,
            func.count(RideSearch.id).label("cnt"),
        )
        .group_by(RideSearch.pickup_address, RideSearch.destination_address)
        .order_by(desc("cnt"))
        .limit(5)
        .all()
    )
    popular_routes = [
        {"route": f"{r.pickup_address} → {r.destination_address}", "count": r.cnt}
        for r in popular
    ]

    # Provider cheapest win counts
    provider_stats: dict[str, dict] = {}
    all_searches = db.query(RideSearch).all()
    for s in all_searches:
        available = [r for r in s.results if r.is_available and r.fare_min]
        if available:
            cheapest = min(available, key=lambda r: r.fare_min)
            p = cheapest.provider_name
            if p not in provider_stats:
                provider_stats[p] = {"cheapest_wins": 0}
            provider_stats[p]["cheapest_wins"] += 1

    # New users last 7 days
    from datetime import timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users_week = db.query(User).filter(User.created_at >= week_ago).count()

    return {
        "total_users": total_users,
        "total_searches": total_searches,
        "searches_today": searches_today,
        "avg_results": avg_results,
        "popular_routes": popular_routes,
        "provider_stats": provider_stats,
        "new_users_week": new_users_week,
    }
