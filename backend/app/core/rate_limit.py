from collections import defaultdict, deque
from threading import Lock
from time import monotonic
from fastapi import HTTPException, Request, status

# In-memory protection for a single instance. Use Redis-backed rate limiting
# before horizontally scaling the API.
_attempts = defaultdict(deque)
_lock = Lock()

def _limit(request: Request, scope: str, maximum: int, seconds: int, message: str):
    client_ip = request.client.host if request.client else "unknown"
    now = monotonic()
    with _lock:
        window = _attempts[(scope, client_ip)]
        while window and now - window[0] > seconds:
            window.popleft()
        if len(window) >= maximum:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=message, headers={"Retry-After": str(seconds)})
        window.append(now)


def limit_registration(request: Request):
    _limit(request, "registration", 5, 3600, "Too many registration attempts. Try again in an hour.")


def limit_order(request: Request):
    _limit(request, "order", 10, 3600, "Too many order attempts. Try again later.")


def limit_admin(request: Request):
    _limit(request, "admin", 10, 900, "Too many admin access attempts. Try again in 15 minutes.")
