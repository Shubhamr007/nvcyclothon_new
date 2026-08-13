"""Transactional email helpers. Messages are sent one recipient at a time."""
import logging
import smtplib
from typing import Optional
from email.message import EmailMessage
from html import escape
from .config import settings

logger = logging.getLogger(__name__)


def _send(recipient: str, subject: str, text: str, html: str, attachment: Optional[tuple[str, bytes, str]] = None) -> None:
    if not settings.email_enabled:
        logger.info("Email disabled; skipped transactional message type=%s", subject)
        return
    message = EmailMessage()
    message["From"] = settings.smtp_from_email
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(text)
    message.add_alternative(html, subtype="html")
    if attachment:
        filename, content, content_type = attachment
        maintype, subtype = content_type.split("/", 1)
        message.add_attachment(content, maintype=maintype, subtype=subtype, filename=filename)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as client:
            if settings.smtp_use_tls:
                client.starttls()
            if settings.smtp_username:
                client.login(settings.smtp_username, settings.smtp_password)
            client.send_message(message)
    except (OSError, smtplib.SMTPException):
        # Never expose SMTP errors or personal data through the public API.
        logger.exception("Transactional email delivery failed")


def send_registration_confirmation(*, recipient: str, name: str, rider_id: int, route: str) -> None:
    subject = "Your NV Cyclothon 2026 registration is confirmed"
    text = f"Hi {name},\n\nYour rider ID is #{rider_id}. You are registered for the {route} route on 18 October 2026 in Rewa, Madhya Pradesh. Start time: 5:30 AM.\n\nNV Cyclothon, in association with Rewa Cycling Federation"
    html = f"<h1>You are on the list.</h1><p>Hi {escape(name)},</p><p>Your rider ID is <strong>#{rider_id}</strong>.</p><p>You are registered for the <strong>{escape(route)}</strong> route on <strong>18 October 2026</strong> in Rewa, Madhya Pradesh. Start time: 5:30 AM.</p><p>NV Cyclothon, in association with Rewa Cycling Federation</p>"
    _send(recipient, subject, text, html)


def send_payment_receipt(*, recipient: str, name: str, order_id: int, total_paise: int) -> None:
    """Call only after a payment provider webhook has been signature-verified."""
    total = f"₹{total_paise / 100:.2f}"
    subject = f"Payment receipt for order #{order_id}"
    text = f"Hi {name},\n\nWe received payment of {total} for order #{order_id}. Keep this email as your receipt."
    html = f"<h1>Payment received</h1><p>Hi {escape(name)},</p><p>We received <strong>{total}</strong> for order <strong>#{order_id}</strong>.</p>"
    _send(recipient, subject, text, html)


def send_event_update(*, recipients: list[str], subject: str, message: str) -> None:
    safe_message = escape(message).replace("\n", "<br>")
    for recipient in recipients:
        _send(recipient, subject, message, f"<p>{safe_message}</p>")


def send_participation_certificate(*, recipient: str, name: str, rider_id: int, route: str, certificate_pdf: bytes) -> None:
    subject = "Congratulations on completing NV Cyclothon 2026"
    text = (
        f"Hi {name},\n\n"
        f"Congratulations and thank you for participating in NV Cyclothon 2026. "
        f"Your participation certificate for the {route} route is attached. "
        f"Rider ID: #{rider_id}.\n\n"
        "We hope to see you on the road again soon!\n\n"
        "NV Cyclothon"
    )
    html = (
        "<h1>Congratulations!</h1>"
        f"<p>Hi {escape(name)},</p>"
        f"<p>Thank you for participating in NV Cyclothon 2026. "
        f"Your participation certificate for the <strong>{escape(route)}</strong> route is attached.</p>"
        f"<p>Your rider ID is <strong>#{rider_id}</strong>.</p>"
        "<p>We hope to see you on the road again soon!</p>"
        "<p>NV Cyclothon</p>"
    )
    _send(
        recipient,
        subject,
        text,
        html,
        attachment=(f"nv-cyclothon-certificate-{rider_id}.pdf", certificate_pdf, "application/pdf"),
    )
