from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.core.dependencies import get_current_active_user, get_db
from app.db.models.user import User
from app.db.repositories.user_repository import UserRepository
from app.services.whatsapp import send_ride_update, send_whatsapp
from app.services.sms import send_whatsapp_ultramsg
from app.services.voice import send_voice_bland_ai
from app.core.config import settings

router = APIRouter(prefix="/notify", tags=["notifications"])


class SavePhoneRequest(BaseModel):
    phone_number: str


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


class SOSRequest(BaseModel):
    ec_phone: str
    ec_name: Optional[str] = "Emergency Contact"
    user_name: Optional[str] = ""


@router.get("/whatsapp/status")
def whatsapp_status():
    configured = bool(settings.ULTRAMSG_INSTANCE_ID and settings.ULTRAMSG_TOKEN)
    return {"configured": configured, "provider": "UltraMsg"}


@router.put("/whatsapp/number")
def save_whatsapp_number(
    body: SavePhoneRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
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
    if not current_user.phone_number:
        raise HTTPException(
            status_code=400,
            detail="No WhatsApp number saved. Go to Profile and add your number first.",
        )
    route = {"pickup": body.route_pickup, "destination": body.route_destination}
    results = [r.model_dump() for r in body.results]
    result = send_ride_update(current_user.phone_number, route, results)
    if not result["ok"]:
        raise HTTPException(status_code=502, detail=result["error"])
    return {"ok": True, "sent_to": f"+{current_user.phone_number}"}


@router.post("/whatsapp/sos")
def send_sos(
    body: SOSRequest,
    current_user: User = Depends(get_current_active_user),
):
    """Send SOS WhatsApp alert via UltraMsg — works for any number, no verification needed."""
    digits = "".join(c for c in body.ec_phone if c.isdigit())
    if len(digits) < 10:
        raise HTTPException(status_code=422, detail="Invalid emergency contact number")

    name = body.user_name or current_user.full_name or "Someone"
    wa_msg = (
        f"🆘 *SOS ALERT from {name}*\n\n"
        f"⚠️ This is an emergency alert sent via RideCompare.\n"
        f"Please call or check on *{name}* immediately.\n\n"
        f"_Sent automatically via RideCompare Safety_"
    )
    result = send_whatsapp_ultramsg(digits, wa_msg)
    if not result["ok"]:
        raise HTTPException(status_code=502, detail=result["error"])
    return {"ok": True, "sent_via": "ultramsg_whatsapp", "sent_to": f"+{digits}"}


@router.post("/voice/sos")
def make_sos_call(
    body: SOSRequest,
    current_user: User = Depends(get_current_active_user),
):
    """Make an AI voice call via Bland AI — free 10 min/month, any number."""
    digits = "".join(c for c in body.ec_phone if c.isdigit())
    if len(digits) < 10:
        raise HTTPException(status_code=422, detail="Invalid phone number")

    name = body.user_name or current_user.full_name or "Someone"
    ec_name = body.ec_name or "Emergency Contact"
    result = send_voice_bland_ai(digits, name, ec_name)
    if not result["ok"]:
        raise HTTPException(status_code=502, detail=result["error"])
    return {"ok": True, "call_id": result.get("call_id")}


@router.post("/whatsapp/test")
def send_test_message(current_user: User = Depends(get_current_active_user)):
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
