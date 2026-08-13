import hashlib
import hmac
from datetime import date, datetime, timedelta, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from ..core.security import require_admin
from ..core.rate_limit import limit_registration
from ..db import get_db
from ..models import CyclothonRegistration
from ..core.config import settings
from ..core.email import send_payment_receipt, send_registration_confirmation
from ..core.razorpay import RazorpayError, create_order
from ..schemas import (CyclothonRegistrationCheckoutRead, CyclothonRegistrationCreate,
    CyclothonRegistrationRead, RazorpayCheckout, RazorpayPaymentVerification)

router = APIRouter(prefix="/api/cyclothon", tags=["NV Cyclothon"])
_EVENT_DATE = date(2026, 10, 18)
_LAST_WEEK_START = _EVENT_DATE - timedelta(days=7)
_EARLY_BIRD_LIMIT = 50
_RACE_CATEGORIES = {
    "60 Km Road Challenge": {"capacity": 100, "early_bird": 89_900, "regular": 109_900, "last_week": 129_900},
    "30 Km MTB Challenge": {"capacity": 150, "early_bird": 79_900, "regular": 99_900, "last_week": 119_900},
    "10 Km Green Ride": {"capacity": 200, "early_bird": 39_900, "regular": 49_900, "last_week": 59_900},
    "Kid-o-thon": {"capacity": 50, "early_bird": 29_900, "regular": 29_900, "last_week": 29_900},
}


def _registration_fee_paise(db: Session, ride_category: str) -> int:
    """Choose a server-authoritative fee while serializing limited allocations."""
    category = _RACE_CATEGORIES[ride_category]
    # Capacity and the shared early-bird pool are both global counters. A
    # transaction-scoped Postgres advisory lock prevents two simultaneous
    # registrations from receiving the same final place or early-bird slot.
    db.execute(text("SELECT pg_advisory_xact_lock(20261018)"))
    active_category_count = db.scalar(
        select(func.count()).select_from(CyclothonRegistration).where(
            CyclothonRegistration.ride_category == ride_category,
            CyclothonRegistration.status != "cancelled",
        )
    )
    if active_category_count >= category["capacity"]:
        raise HTTPException(status_code=409, detail=f"{ride_category} is full")
    if ride_category == "Kid-o-thon":
        return category["regular"]
    if date.today() >= _LAST_WEEK_START:
        return category["last_week"]
    active_registration_count = db.scalar(
        select(func.count()).select_from(CyclothonRegistration).where(
            CyclothonRegistration.status != "cancelled"
        )
    )
    return category["early_bird"] if active_registration_count < _EARLY_BIRD_LIMIT else category["regular"]


@router.post("/registrations", response_model=CyclothonRegistrationCheckoutRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(limit_registration)])
def create_registration(payload: CyclothonRegistrationCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if not payload.waiver_accepted or not payload.privacy_accepted:
        raise HTTPException(status_code=400, detail="The rider waiver and privacy notice must be accepted")
    duplicate = db.scalar(select(CyclothonRegistration).where(CyclothonRegistration.email == payload.email.lower()))
    if duplicate:
        raise HTTPException(status_code=409, detail="This email is already registered for NV Cyclothon")
    registration_data = payload.model_dump(exclude={"waiver_accepted", "privacy_accepted"})
    registration_data["email"] = payload.email.lower()
    registration_fee_paise = _registration_fee_paise(db, payload.ride_category)
    registration = CyclothonRegistration(
        **registration_data, waiver_accepted=True, privacy_accepted=True,
        registration_fee_paise=registration_fee_paise,
    )
    db.add(registration)
    try:
        db.flush()
        checkout = None
        if settings.razorpay_enabled:
            razorpay_order = create_order(amount_paise=registration.registration_fee_paise, receipt=f"cyclothon-{registration.id}")
            registration.razorpay_order_id = razorpay_order["id"]
            checkout = RazorpayCheckout(key_id=settings.razorpay_key_id, order_id=registration.razorpay_order_id, amount_paise=registration.registration_fee_paise)
        db.commit()
    except IntegrityError:
        db.rollback()
        # The unique index is the authority in a race; never rely only on the
        # earlier convenience lookup.
        raise HTTPException(status_code=409, detail="This email is already registered for NV Cyclothon")
    except RazorpayError:
        db.rollback()
        raise HTTPException(status_code=503, detail="Unable to start payment. Please try again.")
    db.refresh(registration)
    if not settings.razorpay_enabled:
        background_tasks.add_task(send_registration_confirmation, recipient=registration.email, name=registration.full_name, rider_id=registration.id, route=registration.ride_category)
    return CyclothonRegistrationCheckoutRead.model_validate(registration).model_copy(update={"checkout": checkout})


@router.post("/registrations/{registration_id}/payment/verify", response_model=CyclothonRegistrationRead)
def verify_registration_payment(registration_id: int, payload: RazorpayPaymentVerification, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    registration = db.scalar(select(CyclothonRegistration).where(CyclothonRegistration.id == registration_id).with_for_update())
    if not registration or not registration.razorpay_order_id:
        raise HTTPException(status_code=404, detail="Payment registration not found")
    if registration.payment_status == "paid":
        if registration.razorpay_payment_id == payload.razorpay_payment_id:
            return registration
        raise HTTPException(status_code=409, detail="This registration has already been paid")
    if payload.razorpay_order_id != registration.razorpay_order_id:
        raise HTTPException(status_code=400, detail="Payment order does not match this registration")
    expected = hmac.new(settings.razorpay_key_secret.encode(), f"{registration.razorpay_order_id}|{payload.razorpay_payment_id}".encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment signature verification failed")
    registration.payment_status = "paid"
    registration.razorpay_payment_id = payload.razorpay_payment_id
    registration.razorpay_signature = payload.razorpay_signature
    registration.payment_verified_at = datetime.now(timezone.utc)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This payment has already been recorded")
    db.refresh(registration)
    background_tasks.add_task(send_registration_confirmation, recipient=registration.email, name=registration.full_name, rider_id=registration.id, route=registration.ride_category)
    background_tasks.add_task(send_payment_receipt, recipient=registration.email, name=registration.full_name, order_id=registration.id, total_paise=registration.registration_fee_paise)
    return registration


@router.get("/registrations", response_model=list[CyclothonRegistrationRead], dependencies=[Depends(require_admin)])
def list_registrations(db: Session = Depends(get_db)):
    return db.scalars(select(CyclothonRegistration).order_by(CyclothonRegistration.created_at.desc())).all()
