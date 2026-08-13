from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi import Request
from uuid import uuid4
from .api.products import router as products_router
from .api.orders import router as orders_router
from .api.cyclothon import router as cyclothon_router
from .api.uploads import router as uploads_router, upload_wholesale_files
from .api.admin import router as admin_router
from .api.content import router as content_router
from .core.config import settings
from .core.security import issue_admin_token, require_admin
from .schemas import AdminLogin, AdminSession
from secrets import compare_digest
from .db import Base, engine
from sqlalchemy import text
from .seed import seed_catalogue

Base.metadata.create_all(bind=engine)
# `create_all` does not upgrade existing tables. This idempotent index is the
# production migration for deployments created before registration emails were
# made unique. It also prevents case-only duplicates in legacy data.
with engine.begin() as connection:
    connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_cyclothon_registrations_email_normalized ON cyclothon_registrations (lower(email))"))
    connection.execute(text("ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS registration_fee_paise INTEGER NOT NULL DEFAULT 0"))
    connection.execute(text("ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS gender VARCHAR(32) NOT NULL DEFAULT 'Prefer not to say'"))
    connection.execute(text("ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) NOT NULL DEFAULT 'pending'"))
    connection.execute(text("ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100)"))
    connection.execute(text("ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100)"))
    connection.execute(text("ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(128)"))
    connection.execute(text("ALTER TABLE cyclothon_registrations ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ"))
    connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_cyclothon_razorpay_order ON cyclothon_registrations (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL"))
    connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_cyclothon_razorpay_payment ON cyclothon_registrations (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL"))
seed_catalogue()
app = FastAPI(title=settings.app_name, version="1.0.0", description="Secure API for NV Cyclothon rider registrations.", docs_url=None if settings.environment.lower() == "production" else "/docs", redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=[origin.strip() for origin in settings.allowed_origins.split(",")], allow_credentials=False, allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"], allow_headers=["Authorization", "Content-Type", "X-Request-ID"], max_age=600)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=[host.strip() for host in settings.allowed_hosts.split(",")])


@app.middleware("http")
async def security_headers(request: Request, call_next):
    # Reject unexpectedly large non-upload payloads before parsing them.
    content_length = request.headers.get("content-length")
    if request.url.path != "/api/uploads" and content_length and int(content_length) > 1_048_576:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=413, content={"detail": "Request body is too large"})
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.headers.get("X-Request-ID", str(uuid4()))
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Resource-Policy"] = "same-site"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
    response.headers["Cache-Control"] = "no-store" if request.url.path.startswith("/api/admin") else "no-store, max-age=0"
    if settings.environment.lower() == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
app.include_router(products_router)
app.include_router(orders_router)
app.include_router(cyclothon_router)
app.include_router(uploads_router)
app.include_router(admin_router)
app.include_router(content_router)
# Temporary compatibility route for the existing frontend. New clients should
# use the versioned /api/uploads endpoint.
app.add_api_route("/upload", upload_wholesale_files, methods=["POST"], tags=["uploads"], status_code=201, dependencies=[Depends(require_admin)])


@app.post("/api/admin/session", response_model=AdminSession, tags=["Admin"])
def create_admin_session(payload: AdminLogin, request: Request):
    # Apply the same throttling as protected admin endpoints before checking a secret.
    from .core.rate_limit import limit_admin
    limit_admin(request)
    if not compare_digest(payload.admin_key, settings.admin_api_key):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid administrator credentials")
    return AdminSession(access_token=issue_admin_token(), expires_in=settings.admin_session_ttl_seconds)


@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok", "service": settings.app_name}
