"""
Analytics endpoint — per-user fare stats, savings, gamification, best-time-to-book.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_active_user
from app.db.models.user import User
from app.db.repositories.ride_repository import RideRepository

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def get_analytics_summary(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    repo = RideRepository(db)
    searches = repo.get_user_history(current_user.id, limit=500)

    total_searches = len(searches)

    cheapest_fares: list[float] = []
    total_savings  = 0.0
    provider_wins:         dict[str, int] = {}
    provider_appearances:  dict[str, int] = {}
    monthly_spend  = 0.0

    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_searches = 0

    for s in searches:
        available = [r for r in s.results if r.is_available]
        if not available:
            continue

        # Count provider appearances
        for r in available:
            p = r.provider_name
            provider_appearances[p] = provider_appearances.get(p, 0) + 1

        fares = [r.fare_min for r in available if r.fare_min]
        if not fares:
            continue

        min_f = min(fares)
        max_f = max(fares)
        cheapest_fares.append(min_f)
        total_savings += (max_f - min_f)

        cheapest_r = min(available, key=lambda r: r.fare_min or 9999)
        p = cheapest_r.provider_name
        provider_wins[p] = provider_wins.get(p, 0) + 1

        # Monthly stats
        if hasattr(s, 'searched_at') and s.searched_at >= month_start:
            monthly_searches += 1
            monthly_spend += min_f

    avg_fare       = round(sum(cheapest_fares) / len(cheapest_fares)) if cheapest_fares else 0
    min_fare_ever  = round(min(cheapest_fares)) if cheapest_fares else 0
    total_searches_count = len(searches)

    # ── Daily chart — last 7 days ──
    cutoff = now - timedelta(days=7)
    daily: dict[str, list] = {}
    for s in searches:
        if s.searched_at < cutoff:
            continue
        available = [r for r in s.results if r.is_available and r.fare_min]
        if not available:
            continue
        try:
            day = s.searched_at.strftime("%d %b")
        except Exception:
            day = str(s.searched_at)[:10]
        daily.setdefault(day, []).append(min(r.fare_min for r in available))

    chart_data = [
        {"day": d, "avg": round(sum(v) / len(v)), "searches": len(v)}
        for d, v in daily.items()
    ]

    # ── Best hours ──
    hourly: dict[int, list] = {}
    for s in searches:
        available = [r for r in s.results if r.is_available and r.fare_min]
        if not available:
            continue
        h = s.searched_at.hour
        hourly.setdefault(h, []).append(min(r.fare_min for r in available))

    best_hours = sorted(
        [{"hour": h, "avg_fare": round(sum(v) / len(v)), "count": len(v)}
         for h, v in hourly.items() if len(v) >= 1],
        key=lambda x: x["avg_fare"]
    )[:3]

    # ── Streak — consecutive days with at least 1 search ──
    search_days = sorted({s.searched_at.date() for s in searches}, reverse=True)
    streak = 0
    if search_days:
        today = now.date()
        check = today
        for day in search_days:
            if day == check or day == check - timedelta(days=1):
                streak += 1
                check = day
            else:
                break

    return {
        "total_searches":        total_searches_count,
        "avg_fare":              avg_fare,
        "cheapest_fare_ever":    min_fare_ever,
        "total_savings":         round(total_savings),
        "provider_wins":         provider_wins,
        "provider_appearances":  provider_appearances,
        "chart_data":            chart_data,
        "best_hours":            best_hours,
        "streak_days":           streak,
        "monthly_searches":      monthly_searches,
        "monthly_spend":         round(monthly_spend),
    }
