from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.core.dependencies import get_current_active_user, get_db
from app.db.models.user import User
from app.db.repositories.user_repository import UserRepository
from app.services.whatsapp import send_ride_update, send_whatsapp
from app.core.config import settings

router = APIRouter(prefix="/notify", tags=["notifications"])


class SavePhoneRequest(BaseModel):
    phone_number: str  # e.g. "9876543210" or "+919876543210"


class RideResult(BaseModel):
    provider: str
    fare: str
    eta: int
    is_surging: bool = False
    badges: Optional[List[str]] = []
    category_display: Optional[str] = ''
    booking_url: Optional[str] = ''


class WhatsAppNotifyRequest(BaseModel):
    route_pickup: str
    route_destination: str
    results: List[RideResult]


@router.get("/whatsapp/status")
def whatsapp_status():
    """Check whether Twilio is configured and ready."""
    configured = bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN)
    return {
        "configured": configured,
        "from_number": settings.TWILIO_WHATSAPP_FROM if configured else None,
        "sandbox_hint": (
            "For testing, send 'join <sandbox-keyword>' to +1 415 523 8886 on WhatsApp first."
            if not configured else None
        ),
    }


@router.put("/whatsapp/number")
def save_whatsapp_number(
    body: SavePhoneRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Save the user's WhatsApp number to their profile."""
    digits = "".join(c for c in body.phone_number if c.isdigit())
    if not digits.startswith("91") and len(digits) == 10:
        digits = f"91{digits}"
    if len(digits) < 10:
        raise HTTPException(status_code=422, detail="Invalid phone number")

    repo = UserRepository(db)
    repo.update(current_user, phone_number=digits)
    return {"ok": True, "saved": f"+{digits}"}


@router.post("/whatsapp/send")
def send_whatsapp_update(
    body: WhatsAppNotifyRequest,
    current_user: User = Depends(get_current_active_user),
):
    """Send a WhatsApp ride-update to the current user's saved number."""
    if not current_user.phone_number:
        raise HTTPException(
            status_code=400,
            detail="No WhatsApp number saved. Go to Profile and add your number first.",
        )

    route = {
        "pickup": body.route_pickup,
        "destination": body.route_destination,
    }
    results = [r.model_dump() for r in body.results]
    result = send_ride_update(current_user.phone_number, route, results)

    if not result["ok"]:
        raise HTTPException(status_code=502, detail=result["error"])

    return {"ok": True, "sid": result.get("sid"), "sent_to": f"+{current_user.phone_number}"}


@router.post("/whatsapp/test")
def send_test_message(current_user: User = Depends(get_current_active_user)):
    """Send a test WhatsApp message to verify the setup."""
    if not current_user.phone_number:
        raise HTTPException(status_code=400, detail="No phone number saved")

    msg = (
        "👋 *Hello from RideCompare!*\n\n"
        "✅ Your WhatsApp notifications are set up correctly.\n"
        "You'll now receive ride comparison updates here.\n\n"
        "_via RideCompare_"
    )
    result = send_whatsapp(current_user.phone_number, msg)
    if not result["ok"]:
        raise HTTPException(status_code=502, detail=result["error"])
    return {"ok": True, "message": "Test message sent!"}
