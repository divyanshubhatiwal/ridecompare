import smtplib
import logging
import random
import string
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

logger = logging.getLogger(__name__)


def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def _otp_html(name: str, otp: str) -> str:
    digits = "".join(
        f'<span style="display:inline-block;width:44px;height:52px;line-height:52px;'
        f'text-align:center;font-size:28px;font-weight:bold;color:#6366F1;'
        f'background:#EEF2FF;border:2px solid #C7D2FE;border-radius:10px;margin:0 4px;">'
        f'{d}</span>'
        for d in otp
    )
    return f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:28px 32px;">
      <span style="font-size:28px;">🚗</span>
      <span style="color:white;font-size:20px;font-weight:bold;margin-left:8px;">RideCompare</span>
    </div>
    <div style="padding:36px 32px;">
      <h2 style="margin:0 0 8px;color:#111827;">Verify your email, {name} 👋</h2>
      <p style="color:#6B7280;margin:0 0 28px;">Enter this 6-digit code in the app to activate your account:</p>
      <div style="text-align:center;margin:0 0 28px;">{digits}</div>
      <p style="color:#9CA3AF;font-size:13px;">
        This code expires in <strong>10 minutes</strong>.<br>
        If you didn't sign up for RideCompare, ignore this email.
      </p>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;">
      <p style="color:#D1D5DB;font-size:12px;margin:0;">© 2026 RideCompare · Compare Uber, Ola, Rapido & InDrive</p>
    </div>
  </div>
</body>
</html>"""


def send_otp_email(to_email: str, name: str, otp: str) -> bool:
    """
    Send verification OTP email.
    In dev (no SMTP configured) just logs the OTP — no crash.
    """
    # Always log OTP so it can be found in server logs if email fails
    logger.warning(f"[OTP] {to_email} → {otp}")

    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASS:
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"{otp} is your RideCompare verification code"
        msg["From"]    = f"{settings.EMAIL_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"]      = to_email
        msg.attach(MIMEText(_otp_html(name, otp), "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            if settings.SMTP_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

        logger.info(f"OTP email sent to {to_email}")
        return True

    except Exception as exc:
        logger.error(f"OTP email failed for {to_email}: {exc}")
        return False
