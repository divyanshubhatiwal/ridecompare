import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


_CATEGORY_EMOJI = {
    "bike":       "🏍",
    "bike taxi":  "🏍",
    "auto":       "🛺",
    "tuk":        "🛺",
    "mini":       "🚗",
    "go":         "🚗",
    "economy":    "🚗",
    "car":        "🚗",
    "sedan":      "🚗",
    "prime":      "🚗",
    "comfort":    "🚗",
    "xl":         "🚙",
    "suv":        "🚙",
    "premium":    "🚙",
    "uberxl":     "🚙",
}

def _cat_emoji(category_display: str) -> str:
    cat = (category_display or "").lower()
    for key, emoji in _CATEGORY_EMOJI.items():
        if key in cat:
            return emoji
    return "🚕"


def _format_for_whatsapp(route: dict, results: list) -> str:
    """Build a WhatsApp message — each option has its own direct booking link."""
    cheapest = results[0] if results else None
    best_val = next((r for r in results if 'best_value' in (r.get('badges') or [])), None)
    if best_val and best_val is cheapest:
        best_val = results[1] if len(results) > 1 else None

    def _label(r):
        cat = r.get("category_display") or ""
        return f"{r['provider']}" + (f" {cat}" if cat else "")

    def _url(r):
        return (r.get("booking_url") or "").strip()

    lines = [
        "🚕 *RideCompare Update*",
        f"📍 {route.get('pickup', 'Pickup')} → {route.get('destination', 'Destination')}",
        "",
    ]

    if cheapest:
        lines.append(f"💸 *Cheapest:* {_label(cheapest)} — *{cheapest['fare']}* ({cheapest['eta']} min ETA)")
        if _url(cheapest):
            lines.append(_url(cheapest))

    if best_val:
        lines.append(f"⭐ *Best Value:* {_label(best_val)} — *{best_val['fare']}* ({best_val['eta']} min ETA)")
        if _url(best_val):
            lines.append(_url(best_val))

    if results:
        lines += ["", "*All options:*"]
        for i, r in enumerate(results, 1):
            surge    = " 🔥" if r.get("is_surging") else ""
            cat      = r.get("category_display") or ""
            emoji    = _cat_emoji(cat)
            cat_part = f" {cat}" if cat else ""
            lines.append(f"{i}. {emoji} *{r['provider']}{cat_part}* — {r['fare']} ({r['eta']} min){surge}")

        # One booking link per unique provider (deduped) — keeps message short
        seen: set = set()
        book_lines = []
        for r in results:
            url = _url(r)
            if url and r["provider"] not in seen:
                seen.add(r["provider"])
                cat      = r.get("category_display") or ""
                emoji    = _cat_emoji(cat)
                book_lines.append(f"{emoji} *{r['provider']}* → {url}")
        if book_lines:
            lines += ["", "📲 *Book now:*"] + book_lines

    from datetime import datetime
    lines += [
        "",
        f"🔁 {datetime.now().strftime('%d %b · %I:%M %p')}",
        "_via RideCompare_",
    ]
    return "\n".join(lines)


def send_whatsapp(to_number: str, message: str) -> dict:
    """
    Send a WhatsApp message via Twilio.
    Returns {"ok": True, "sid": "..."} or {"ok": False, "error": "..."}.
    """
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.warning("Twilio not configured — TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN missing")
        return {"ok": False, "error": "Twilio credentials not configured"}

    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        # Normalise number: strip non-digits then add +
        digits = "".join(c for c in to_number if c.isdigit())
        if not digits.startswith("91") and len(digits) == 10:
            digits = f"91{digits}"
        wa_to = f"whatsapp:+{digits}"

        msg = client.messages.create(
            body=message,
            from_=settings.TWILIO_WHATSAPP_FROM,
            to=wa_to,
        )
        logger.info(f"WhatsApp sent to {wa_to}: {msg.sid}")
        return {"ok": True, "sid": msg.sid}

    except Exception as exc:
        logger.error(f"Twilio send failed: {exc}")
        return {"ok": False, "error": str(exc)}


def send_ride_update(to_number: str, route: dict, results: list) -> dict:
    message = _format_for_whatsapp(route, results)
    return send_whatsapp(to_number, message)
