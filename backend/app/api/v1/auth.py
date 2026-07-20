from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from pydantic import BaseModel, EmailStr

from app.db.database import get_db
from app.db.repositories.user_repository import UserRepository
from app.db.models.auth import RefreshToken
from app.core.security import (
    verify_password, create_access_token, create_refresh_token,
    verify_refresh_token,
)
from app.core.config import settings
from app.core.dependencies import get_redis_client
from app.schemas.auth import (
    RegisterRequest, LoginRequest, RefreshRequest,
    TokenResponse, UserResponse
)
from app.services.email import send_otp_email, generate_otp

router = APIRouter(prefix="/auth", tags=["auth"])

OTP_TTL    = 600   # 10 minutes
OTP_PREFIX = "otp:"


# ── helpers ────────────────────────────────────────────────────────────────

def _token_response(user_id: int) -> TokenResponse:
    access  = create_access_token(user_id)
    refresh = create_refresh_token(user_id)
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def _store_refresh_token(db: Session, user_id: int, token: str, request: Request) -> None:
    token_hash = sha256(token.encode()).hexdigest()
    rt = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        ip_address=request.client.host if request.client else None,
        device_info=request.headers.get("user-agent", "")[:512],
    )
    db.add(rt)
    db.commit()


def _save_otp(redis, email: str, otp: str):
    redis.setex(f"{OTP_PREFIX}{email.lower()}", OTP_TTL, otp)


def _get_otp(redis, email: str) -> str | None:
    return redis.get(f"{OTP_PREFIX}{email.lower()}")


def _delete_otp(redis, email: str):
    redis.delete(f"{OTP_PREFIX}{email.lower()}")


# ── schemas ────────────────────────────────────────────────────────────────

class RegisterResponse(BaseModel):
    message: str
    email: str
    requires_verification: bool = True


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str


class ResendOtpRequest(BaseModel):
    email: EmailStr


# ── endpoints ──────────────────────────────────────────────────────────────

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    if repo.get_by_email(body.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create unverified user
    user = repo.create(email=body.email, full_name=body.full_name, password=body.password)

    # Generate + store OTP
    redis = get_redis_client()
    otp   = generate_otp()
    _save_otp(redis, body.email, otp)

    # Send email (logs OTP in dev when SMTP not configured)
    send_otp_email(body.email, body.full_name.split()[0], otp)

    return RegisterResponse(
        message="Verification code sent to your email",
        email=body.email,
    )


@router.post("/verify-email", response_model=TokenResponse)
def verify_email(body: VerifyEmailRequest, request: Request, db: Session = Depends(get_db)):
    redis = get_redis_client()
    stored_otp = _get_otp(redis, body.email)

    if not stored_otp:
        raise HTTPException(status_code=400, detail="OTP expired or not found. Request a new one.")

    if stored_otp != body.otp.strip():
        raise HTTPException(status_code=400, detail="Incorrect OTP. Please try again.")

    _delete_otp(redis, body.email)

    repo = UserRepository(db)
    user = repo.get_by_email(body.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Mark verified
    repo.update(user, is_verified=True)

    tokens = _token_response(user.id)
    _store_refresh_token(db, user.id, tokens.refresh_token, request)
    return tokens


@router.post("/resend-otp")
def resend_otp(body: ResendOtpRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_email(body.email)
    if not user:
        raise HTTPException(status_code=404, detail="No account with that email")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    redis = get_redis_client()
    otp   = generate_otp()
    _save_otp(redis, body.email, otp)
    send_otp_email(body.email, user.full_name.split()[0], otp)

    return {"message": "New OTP sent"}


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_email(body.email)

    if not user or not user.hashed_password or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    tokens = _token_response(user.id)
    _store_refresh_token(db, user.id, tokens.refresh_token, request)
    return tokens


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(body: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    user_id = verify_refresh_token(body.refresh_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    token_hash = sha256(body.refresh_token.encode()).hexdigest()
    stored = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )
    if not stored:
        raise HTTPException(status_code=401, detail="Refresh token revoked or expired")

    stored.is_revoked = True
    db.commit()

    tokens = _token_response(int(user_id))
    _store_refresh_token(db, int(user_id), tokens.refresh_token, request)
    return tokens


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


RESET_PREFIX = "reset_otp:"


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_email(body.email)
    # Always return success to avoid email enumeration
    if not user:
        return {"message": "If that email exists, a reset code was sent"}

    redis = get_redis_client()
    otp   = generate_otp()
    redis.setex(f"{RESET_PREFIX}{body.email.lower()}", OTP_TTL, otp)
    _send_reset_email(body.email, user.full_name.split()[0], otp)
    return {"message": "If that email exists, a reset code was sent"}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(body.new_password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    redis = get_redis_client()
    stored = redis.get(f"{RESET_PREFIX}{body.email.lower()}")
    if not stored:
        raise HTTPException(status_code=400, detail="Code expired or not found. Request a new one.")
    if stored != body.otp.strip():
        raise HTTPException(status_code=400, detail="Incorrect code. Please try again.")

    redis.delete(f"{RESET_PREFIX}{body.email.lower()}")

    repo = UserRepository(db)
    user = repo.get_by_email(body.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from app.core.security import get_password_hash
    user.hashed_password = get_password_hash(body.new_password)
    db.commit()
    return {"message": "Password reset successfully. You can now log in."}


def _send_reset_email(to_email: str, name: str, otp: str) -> None:
    from app.services.email import send_otp_email
    import logging
    logger = logging.getLogger(__name__)
    if not __import__('app.core.config', fromlist=['settings']).settings.SMTP_HOST:
        logger.warning(f"[DEV] Password reset OTP for {to_email}: {otp}")
        return
    # Reuse the OTP email but with reset subject
    try:
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        from app.core.config import settings
        digits = "".join(
            f'<span style="display:inline-block;width:44px;height:52px;line-height:52px;'
            f'text-align:center;font-size:28px;font-weight:bold;color:#EF4444;'
            f'background:#FEF2F2;border:2px solid #FECACA;border-radius:10px;margin:0 4px;">'
            f'{d}</span>'
            for d in otp
        )
        html = f"""<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#EF4444,#DC2626);padding:28px 32px;">
      <span style="font-size:28px;">🔑</span>
      <span style="color:white;font-size:20px;font-weight:bold;margin-left:8px;">RideCompare</span>
    </div>
    <div style="padding:36px 32px;">
      <h2 style="margin:0 0 8px;color:#111827;">Reset your password, {name} 🔐</h2>
      <p style="color:#6B7280;margin:0 0 28px;">Enter this 6-digit code to reset your password:</p>
      <div style="text-align:center;margin:0 0 28px;">{digits}</div>
      <p style="color:#9CA3AF;font-size:13px;">Expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email.</p>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;">
      <p style="color:#D1D5DB;font-size:12px;margin:0;">© 2026 RideCompare</p>
    </div>
  </div></body></html>"""
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"{otp} — RideCompare password reset code"
        msg["From"]    = f"{settings.EMAIL_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"]      = to_email
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            if settings.SMTP_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
    except Exception as exc:
        __import__('logging').getLogger(__name__).error(f"Reset email failed: {exc}")


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(body: RefreshRequest, db: Session = Depends(get_db)):
    token_hash = sha256(body.refresh_token.encode()).hexdigest()
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if stored:
        stored.is_revoked = True
        db.commit()
