"""
Celery background tasks:
- check_price_alerts: polls ride estimates for active alerts and sends push notifications
- cleanup_expired_tokens: removes expired refresh tokens
- cleanup_provider_cache: removes stale DB cache entries
"""
import asyncio
import logging
from datetime import datetime, timezone

from app.workers.celery_app import celery_app
from app.db.database import SessionLocal
from app.db.models.preferences import PriceAlert, NotificationLog
from app.db.models.auth import RefreshToken
from app.db.models.ride import ProviderCache
from app.providers.registry import get_provider_by_name, get_all_providers
from app.providers.base import RouteInfo

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.tasks.check_price_alerts", bind=True, max_retries=3)
def check_price_alerts(self):
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        alerts = (
            db.query(PriceAlert)
            .filter(
                PriceAlert.is_active == True,
                (PriceAlert.expires_at == None) | (PriceAlert.expires_at > now),
            )
            .all()
        )

        for alert in alerts:
            try:
                _process_alert(db, alert)
            except Exception as e:
                logger.error(f"Error processing alert {alert.id}: {e}")
    finally:
        db.close()


def _process_alert(db, alert: PriceAlert):
    if not (alert.pickup_lat and alert.destination_lat):
        return

    route = RouteInfo(
        pickup_lat=alert.pickup_lat,
        pickup_lng=alert.pickup_lng,
        destination_lat=alert.destination_lat,
        destination_lng=alert.destination_lng,
    )

    providers = get_all_providers() if not alert.provider else [get_provider_by_name(alert.provider)]

    loop = asyncio.new_event_loop()
    try:
        for provider in providers:
            estimates = loop.run_until_complete(provider.get_estimates(route))
            for est in estimates:
                triggered = False
                if alert.alert_type == "price_below" and alert.threshold_amount:
                    triggered = est.fare_min <= alert.threshold_amount
                elif alert.alert_type == "surge_ended":
                    triggered = not est.is_surging

                if triggered:
                    _send_notification(db, alert, est)
                    alert.triggered_count += 1
                    alert.last_triggered_at = datetime.now(timezone.utc)
                    db.commit()
                    break
    finally:
        loop.close()


def _send_notification(db, alert: PriceAlert, estimate):
    from app.db.models.user import User
    user = db.query(User).filter(User.id == alert.user_id).first()
    if not user or not user.fcm_token:
        return

    title = "RideCompare Alert"
    if alert.alert_type == "price_below":
        body = f"{estimate.category_display} now ₹{int(estimate.fare_min)} — below your ₹{int(alert.threshold_amount)} limit!"
    else:
        body = f"Surge pricing ended on {estimate.category_display}! Book now at ₹{int(estimate.fare_min)}"

    log = NotificationLog(
        user_id=user.id,
        alert_id=alert.id,
        title=title,
        body=body,
        notification_type=alert.alert_type,
    )

    try:
        import firebase_admin
        from firebase_admin import messaging
        msg = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            token=user.fcm_token,
            data={"alert_type": alert.alert_type, "provider": estimate.provider},
        )
        messaging.send(msg)
        log.is_sent = True
        log.sent_at = datetime.now(timezone.utc)
    except Exception as e:
        log.error_message = str(e)[:512]

    db.add(log)
    db.commit()


@celery_app.task(name="app.workers.tasks.cleanup_expired_tokens")
def cleanup_expired_tokens():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        deleted = (
            db.query(RefreshToken)
            .filter((RefreshToken.expires_at < now) | (RefreshToken.is_revoked == True))
            .delete()
        )
        db.commit()
        logger.info(f"Cleaned up {deleted} expired tokens")
    finally:
        db.close()


@celery_app.task(name="app.workers.tasks.cleanup_provider_cache")
def cleanup_provider_cache():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        deleted = db.query(ProviderCache).filter(ProviderCache.expires_at < now).delete()
        db.commit()
        logger.info(f"Cleaned up {deleted} expired cache entries")
    finally:
        db.close()
