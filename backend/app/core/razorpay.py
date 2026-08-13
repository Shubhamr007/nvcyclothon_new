import base64
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from .config import settings


class RazorpayError(Exception):
    pass


def create_order(*, amount_paise: int, receipt: str) -> dict:
    if not settings.razorpay_enabled:
        raise RazorpayError("Payments are not configured")
    credentials = base64.b64encode(f"{settings.razorpay_key_id}:{settings.razorpay_key_secret}".encode()).decode()
    request = Request(
        "https://api.razorpay.com/v1/orders",
        data=json.dumps({"amount": amount_paise, "currency": "INR", "receipt": receipt, "notes": {"event": "NV Cyclothon 2026"}}).encode(),
        headers={"Authorization": f"Basic {credentials}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=15) as response:
            payload = json.loads(response.read())
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
        raise RazorpayError("Unable to create a payment order") from error
    if not isinstance(payload.get("id"), str) or payload.get("amount") != amount_paise or payload.get("currency") != "INR":
        raise RazorpayError("Invalid payment order response")
    return payload
