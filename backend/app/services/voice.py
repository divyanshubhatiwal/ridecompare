import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_voice_bland_ai(to_phone: str, user_name: str, ec_name: str) -> dict:
    """Make an AI voice call via Bland AI (free 10 min/month, any number). Returns {ok, error}."""
    if not settings.BLAND_AI_API_KEY:
        return {"ok": False, "error": "BLAND_AI_API_KEY not configured"}

    digits = "".join(c for c in to_phone if c.isdigit())
    if not digits.startswith("91"):
        digits = f"91{digits[-10:]}"

    task = (
        f"You are making an emergency call from RideCompare, a ride booking app. "
        f"Tell the person that {user_name} needs immediate help and has sent an SOS alert. "
        f"Ask them to call {user_name} right away. "
        f"Keep the message short and urgent. Repeat the message once."
    )

    try:
        r = httpx.post(
            "https://api.bland.ai/v1/calls",
            headers={"authorization": settings.BLAND_AI_API_KEY},
            json={
                "phone_number": f"+{digits}",
                "task": task,
                "voice": "maya",
                "language": "en",
                "max_duration": 2,
                "reduce_latency": True,
            },
            timeout=15,
        )
        data = r.json()
        if data.get("status") == "success" or data.get("call_id"):
            logger.info(f"Bland AI call placed to +{digits}: {data.get('call_id')}")
            return {"ok": True, "call_id": data.get("call_id")}
        return {"ok": False, "error": str(data.get("message", data))}
    except Exception as exc:
        logger.error(f"Bland AI error: {exc}")
        return {"ok": False, "error": str(exc)}
