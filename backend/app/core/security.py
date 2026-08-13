import base64
import hashlib
import hmac
import json
import time
from secrets import compare_digest
from fastapi import HTTPException, Request, status
from .config import settings


def issue_admin_token() -> str:
    """Create a short-lived, signed session token. The master key is never reused as a token."""
    payload = json.dumps({"scope": "admin", "exp": int(time.time()) + settings.admin_session_ttl_seconds}, separators=(",", ":")).encode()
    encoded = base64.urlsafe_b64encode(payload).rstrip(b"=")
    signature = hmac.new(settings.admin_api_key.encode(), encoded, hashlib.sha256).digest()
    return f"{encoded.decode()}.{base64.urlsafe_b64encode(signature).rstrip(b'=').decode()}"


def require_admin(request: Request):
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin authentication is required")
    try:
        encoded, provided_signature = token.split(".", 1)
        expected_signature = base64.urlsafe_b64encode(
            hmac.new(settings.admin_api_key.encode(), encoded.encode(), hashlib.sha256).digest()
        ).rstrip(b"=").decode()
        payload = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin session")
    if not compare_digest(provided_signature, expected_signature) or payload.get("scope") != "admin" or not isinstance(payload.get("exp"), int) or payload["exp"] < time.time():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired admin session")
