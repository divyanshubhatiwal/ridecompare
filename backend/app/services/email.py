import smtplib
import logging
import secrets
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

BREVO_URL = "https://api.brevo.com/v3/smtp/email"


def generate_otp(length: int = 6) -> str:
    return "".join(secrets.choice("0123456789") for _ in range(length))


def _code_html(title: str, intro: str, otp: str, color: str, tint: str) -> str:
    digits = "".join(
        f'<span style="display:inline-block;width:44px;height:52px;line-height:52px;'
        f'text-align:center;font-size:28px;font-weight:bold;color:{color};'
        f'background:{tint};border-radius:10px;margin:0 4px;">{d}</span>'
        for d in otp
    )
    return f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#0B0B0F;padding:24px 32px;">
      <span style="color:white;font-size:20px;font-weight:bold;">RideCompare</span>
    </div>
    <div style="padding:36px 32px;">
      <h2 style="margin:0 0 8px;color:#111827;">{title}</h2>
      <p style="color:#6B7280;margin:0 0 28px;">{intro}</p>
      <div style="text-align:center;margin:0 0 28px;">{digits}</div>
      <p style="color:#9CA3AF;font-size:13px;">
        This code expires in <strong>10 minutes</strong>. If you didn't request it, ignore this email.
      </p>
    </div>
  </div>
</body>
</html>"""


def _send_via_brevo(to_email: str, subject: str, html: str) -> None:
    resp = httpx.post(
        BREVO_URL,
        headers={"api-key": settings.BREVO_API_KEY, "accept": "application/json"},
        json={
            "sender": {"name": settings.EMAIL_FROM_NAME, "email": settings.EMAIL_FROM_ADDRESS or settings.SMTP_USER},
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html,
        },
        timeout=15,
    )
    if resp.status_code >= 300:
        raise RuntimeError(f"Brevo {resp.status_code}: {resp.text[:300]}")


def _send_via_smtp(to_email: str, subject: str, html: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        server.ehlo()
        if settings.SMTP_TLS:
            server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        server.sendmail(settings.SMTP_USER, to_email, msg.as_string())


def send_email(to_email: str, subject: str, html: str) -> bool:
    try:
        if settings.BREVO_API_KEY:
            _send_via_brevo(to_email, subject, html)
        elif settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASS:
            _send_via_smtp(to_email, subject, html)
        else:
            logger.warning(f"No email provider configured; not sending '{subject}' to {to_email}")
            return False
        logger.info(f"Email '{subject}' sent to {to_email}")
        return True
    except Exception as exc:
        logger.error(f"Email to {to_email} failed: {exc}")
        return False


def send_otp_email(to_email: str, name: str, otp: str) -> bool:
    html = _code_html(f"Verify your email, {name}", "Enter this 6-digit code in the app:", otp, "#0071E3", "#EBF5FF")
    return send_email(to_email, f"{otp} is your RideCompare verification code", html)


def send_reset_email(to_email: str, name: str, otp: str) -> bool:
    html = _code_html(f"Reset your password, {name}", "Enter this 6-digit code to set a new password:", otp, "#DC2626", "#FEF2F2")
    return send_email(to_email, f"{otp} is your RideCompare password reset code", html)
