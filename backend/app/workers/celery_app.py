from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "ridecompare",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    beat_schedule={
        "check-price-alerts": {
            "task": "app.workers.tasks.check_price_alerts",
            "schedule": crontab(minute="*/5"),  # every 5 minutes
        },
        "cleanup-expired-tokens": {
            "task": "app.workers.tasks.cleanup_expired_tokens",
            "schedule": crontab(hour=2, minute=0),  # daily at 2am
        },
        "cleanup-old-cache": {
            "task": "app.workers.tasks.cleanup_provider_cache",
            "schedule": crontab(minute="*/30"),
        },
    },
)
