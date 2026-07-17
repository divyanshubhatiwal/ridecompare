import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_whatsapp_ultramsg(to_phone: str, message: str) -> dict:
    """Send WhatsApp via UltraMsg (free, any number). Returns {ok, error}."""
    if not settings.ULTRAMSG_INSTANCE_ID or not settings.ULTRAMSG_TOKEN:
        return {"ok": False, "error": "UltraMsg not configured"}
    digits = "".join(c for c in to_phone if c.isdigit())
    if not digits.startswith("91"):
        digits = f"91{digits[-10:]}"
    wa_to = f"{digits}@c.us"
    try:
        r = httpx.post(
            f"https://api.ultramsg.com/{settings.ULTRAMSG_INSTANCE_ID}/messages/chat",
            data={"token": settings.ULTRAMSG_TOKEN, "to": wa_to, "body": message, "priority": 10},
            timeout=10,
        )
        data = r.json()
        if data.get("sent") == "true" or data.get("id"):
            logger.info(f"UltraMsg WhatsApp sent to +{digits}")
            return {"ok": True}
        return {"ok": False, "error": str(data)}
    except Exception as exc:
        logger.error(f"UltraMsg error: {exc}")
        return {"ok": False, "error": str(exc)}
