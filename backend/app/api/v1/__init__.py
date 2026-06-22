from fastapi import APIRouter
from app.api.v1 import auth, users, compare, places, alerts, analytics, admin, notify

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(compare.router)
api_router.include_router(places.router)
api_router.include_router(alerts.router)
api_router.include_router(analytics.router)
api_router.include_router(admin.router)
api_router.include_router(notify.router)
