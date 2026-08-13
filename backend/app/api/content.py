from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import ChiefGuest, EventOffer
from ..schemas import ChiefGuestRead, PublicOfferRead

router = APIRouter(prefix="/api/content", tags=["Event content"])

@router.get("/offers", response_model=list[PublicOfferRead])
def public_offers(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    return db.scalars(select(EventOffer).where(EventOffer.active.is_(True), or_(EventOffer.starts_at.is_(None), EventOffer.starts_at <= now), or_(EventOffer.ends_at.is_(None), EventOffer.ends_at >= now)).order_by(EventOffer.created_at.desc())).all()

@router.get("/chief-guests", response_model=list[ChiefGuestRead])
def public_chief_guests(db: Session = Depends(get_db)):
    return db.scalars(select(ChiefGuest).where(ChiefGuest.featured.is_(True)).order_by(ChiefGuest.display_order, ChiefGuest.created_at.desc())).all()
