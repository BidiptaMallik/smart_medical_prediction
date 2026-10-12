import os
import re
import smtplib
from datetime import datetime
from email.message import EmailMessage

from app import settings


def _save_to_outbox(msg, to):
    os.makedirs(settings.OUTBOX_DIR, exist_ok=True)
    safe = re.sub(r"[^A-Za-z0-9]+", "_", to)
    path = os.path.join(settings.OUTBOX_DIR, f"{datetime.now():%Y%m%d_%H%M%S_%f}_{safe}.eml")
    with open(path, "wb") as f:
        f.write(bytes(msg))


def send_email(to, subject, body, attachments=None):
    
    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM or "chexray-demo@localhost"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    for filename, data, mimetype in attachments or []:
        maintype, _, subtype = mimetype.partition("/")
        msg.add_attachment(data, maintype=maintype, subtype=subtype or "octet-stream", filename=filename)

    if settings.SMTP_HOST and settings.SMTP_USER:
        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            return "sent"
        except Exception:
            _save_to_outbox(msg, to)
            return "smtp_failed_saved_to_outbox"

    _save_to_outbox(msg, to)
    return "saved_to_outbox"