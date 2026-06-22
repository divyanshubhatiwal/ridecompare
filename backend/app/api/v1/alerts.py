from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.core.dependencies import get_current_active_user
from app.db.models.user import User
from app.db.models.preferences import PriceAlert, UserPreferences
from app.schemas.alerts import CreateAlertRequest, AlertResponse, PreferencesResponse, UpdatePreferencesRequest

router = APIRouter(tags=["alerts & preferences"])


@router.post("/alerts/price", response_model=AlertResponse, status_code=201)
def create_price_alert(
    body: CreateAlertRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    alert = PriceAlert(
        user_id=current_user.id,
        alert_type=body.alert_type,
        pickup_address=body.pickup_address,
        pickup_lat=body.pickup_lat,
        pickup_lng=body.pickup_lng,
        destination_address=body.destination_address,
        destination_lat=body.destination_lat,
        destination_lng=body.destination_lng,
        provider=body.provider,
        threshold_amount=body.threshold_amount,
        expires_at=body.expires_at,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return _alert_response(alert)


@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    alerts = (
        db.query(PriceAlert)
        .filter(PriceAlert.user_id == current_user.id, PriceAlert.is_active == True)
        .order_by(PriceAlert.created_at.desc())
        .all()
    )
    return [_alert_response(a) for a in alerts]


@router.delete("/alerts/{alert_id}", status_code=204)
def delete_alert(
    alert_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    alert = (
        db.query(PriceAlert)
        .filter(PriceAlert.id == alert_id, PriceAlert.user_id == current_user.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_active = False
    db.commit()


@router.get("/preferences", response_model=PreferencesResponse)
def get_preferences(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    prefs = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs


@router.patch("/preferences", response_model=PreferencesResponse)
def update_preferences(
    body: UpdatePreferencesRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    prefs = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)

    for key, value in body.model_dump(exclude_none=True).items():
        setattr(prefs, key, value)

    db.commit()
    db.refresh(prefs)
    return prefs


def _alert_response(alert: PriceAlert) -> AlertResponse:
    return AlertResponse(
        id=alert.id,
        alert_type=alert.alert_type,
        pickup_address=alert.pickup_address,
        destination_address=alert.destination_address,
        provider=alert.provider,
        threshold_amount=alert.threshold_amount,
        is_active=alert.is_active,
        triggered_count=alert.triggered_count,
        last_triggered_at=alert.last_triggered_at.isoformat() if alert.last_triggered_at else None,
        created_at=alert.created_at.isoformat(),
    )
