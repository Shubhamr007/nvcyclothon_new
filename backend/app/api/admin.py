from datetime import datetime, timezone
import csv
import io
import json
import re
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Response, UploadFile, status
from openpyxl import load_workbook
from pypdf import PdfReader
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from ..core.security import require_admin
from ..db import get_db
from ..core.config import settings
from ..models import ChiefGuest, CyclothonRegistration, Delegation, EventOffer
from ..schemas import (AnalyticsRead, ChiefGuestCreate, ChiefGuestRead, ChiefGuestUpdate,
    DelegationCreate, DelegationRead, DelegationUpdate, OfferCreate, OfferRead, OfferUpdate,
    RegistrationAdminRead, RegistrationStatusUpdate, BulkRegistrationStatusUpdate, EventUpdateEmailCreate)
from ..core.email import send_event_update, send_participation_certificate
from ..core.certificates import generate_participation_certificate

router = APIRouter(prefix="/api/admin", tags=["Admin"], dependencies=[Depends(require_admin)])

def get_or_404(db: Session, model, item_id: int):
    item = db.get(model, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Record not found")
    return item

@router.get("/analytics", response_model=AnalyticsRead)
def analytics(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    status_rows = db.execute(select(CyclothonRegistration.status, func.count()).group_by(CyclothonRegistration.status)).all()
    route_rows = db.execute(select(CyclothonRegistration.ride_category, func.count()).group_by(CyclothonRegistration.ride_category)).all()
    city_rows = db.execute(select(CyclothonRegistration.city, func.count().label("total")).group_by(CyclothonRegistration.city).order_by(func.count().desc()).limit(5)).all()
    statuses, routes = dict(status_rows), dict(route_rows)
    return AnalyticsRead(
        total_registrations=sum(statuses.values()), approved_registrations=statuses.get("approved", 0),
        checked_in_registrations=statuses.get("checked_in", 0),
        registrations_today=db.scalar(select(func.count()).select_from(CyclothonRegistration).where(CyclothonRegistration.created_at >= today)) or 0,
        registrations_by_route=routes, registrations_by_status=statuses,
        registrations_by_city=[{"city": city, "count": total} for city, total in city_rows],
        delegation_count=db.scalar(select(func.count()).select_from(Delegation)) or 0,
        delegation_members=db.scalar(select(func.coalesce(func.sum(Delegation.member_count), 0))) or 0,
        active_offers=db.scalar(select(func.count()).select_from(EventOffer).where(EventOffer.active.is_(True))) or 0,
    )

@router.get("/registrations", response_model=list[RegistrationAdminRead])
def registrations(db: Session = Depends(get_db)):
    return db.scalars(select(CyclothonRegistration).order_by(CyclothonRegistration.created_at.desc())).all()

@router.post("/registrations/bulk-status")
def bulk_update_registration_status(
    payload: BulkRegistrationStatusUpdate,
    db: Session = Depends(get_db),
):
    ids = sorted(set(payload.registration_ids))
    if not ids:
        raise HTTPException(status_code=400, detail="Select at least one participant")
    registrations = db.scalars(select(CyclothonRegistration).where(CyclothonRegistration.id.in_(ids))).all()
    found_ids = {registration.id for registration in registrations}
    for registration in registrations:
        registration.status = payload.status
    db.commit()
    return {"updated": len(registrations), "missing_ids": [item_id for item_id in ids if item_id not in found_ids]}


@router.post("/registrations/roster-match")
async def match_registration_roster(roster_file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = (roster_file.filename or "").lower()
    if not filename.endswith((".csv", ".xlsx", ".pdf")):
        raise HTTPException(status_code=415, detail="Upload a CSV, XLSX, or text-based PDF participant roster")
    content = await roster_file.read(settings.max_upload_size_bytes + 1)
    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(status_code=413, detail="The participant roster exceeds the upload limit")

    rows = []
    if filename.endswith(".csv"):
        try:
            rows = list(csv.DictReader(io.StringIO(content.decode("utf-8-sig"))))
        except UnicodeDecodeError:
            raise HTTPException(status_code=415, detail="CSV roster must use UTF-8 encoding")
    elif filename.endswith(".xlsx"):
        workbook = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
        worksheet = workbook.active
        values = list(worksheet.values)
        if values:
            headers = [str(value or "").strip().lower() for value in values[0]]
            rows = [dict(zip(headers, row)) for row in values[1:]]
    else:
        if not content.startswith(b"%PDF-"):
            raise HTTPException(status_code=415, detail="Invalid PDF roster")
        try:
            roster_text = "\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(content)).pages)
        except Exception:
            raise HTTPException(status_code=415, detail="Unable to read this PDF roster")
        rows = [{"email": email} for email in re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", roster_text)]

    registrations = db.scalars(select(CyclothonRegistration)).all()
    by_email = {registration.email.lower(): registration.id for registration in registrations}
    by_id = {str(registration.id): registration.id for registration in registrations}
    matched_ids = set()
    unmatched = 0
    for row in rows:
        normalized = {str(key or "").strip().lower().replace(" ", "_"): value for key, value in row.items()}
        email = str(normalized.get("email") or normalized.get("email_address") or "").strip().lower()
        rider_id = str(normalized.get("rider_id") or normalized.get("registration_id") or normalized.get("id") or "").strip()
        matched_id = by_email.get(email) or by_id.get(rider_id)
        if matched_id:
            matched_ids.add(matched_id)
        elif email or rider_id:
            unmatched += 1
    return {"matched_ids": sorted(matched_ids), "matched": len(matched_ids), "unmatched": unmatched}


@router.post("/registrations/certificates", status_code=status.HTTP_202_ACCEPTED)
async def send_participation_certificates(
    background_tasks: BackgroundTasks,
    registration_ids: str = Form(...),
    certificate_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        ids = sorted(set(json.loads(registration_ids)))
    except (json.JSONDecodeError, TypeError):
        raise HTTPException(status_code=400, detail="registration_ids must be a JSON array")
    if not ids or not all(isinstance(item_id, int) and item_id > 0 for item_id in ids):
        raise HTTPException(status_code=400, detail="Select at least one participant")
    if not certificate_file.filename or not certificate_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Upload a PDF certificate file")
    certificate_pdf = await certificate_file.read(settings.max_upload_size_bytes + 1)
    if len(certificate_pdf) > settings.max_upload_size_bytes:
        raise HTTPException(status_code=413, detail="The certificate PDF exceeds the upload limit")
    if certificate_file.content_type != "application/pdf" or not certificate_pdf.startswith(b"%PDF-"):
        raise HTTPException(status_code=415, detail="Invalid PDF certificate file")

    registrations = db.scalars(
        select(CyclothonRegistration).where(CyclothonRegistration.id.in_(ids))
    ).all()
    eligible = [registration for registration in registrations if registration.status == "checked_in"]
    queued_ids = [registration.id for registration in eligible]
    for registration in eligible:
        background_tasks.add_task(
            send_participation_certificate,
            recipient=registration.email,
            name=registration.full_name,
            rider_id=registration.id,
            route=registration.ride_category,
            certificate_pdf=certificate_pdf,
        )
    return {
        "queued": len(eligible),
        "queued_ids": queued_ids,
        "skipped": len(registrations) - len(eligible),
        "skipped_ids": [registration.id for registration in registrations if registration.id not in queued_ids],
        "missing_ids": [item_id for item_id in ids if item_id not in {registration.id for registration in registrations}],
    }


@router.post("/registrations/certificates/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_and_send_participation_certificates(
    background_tasks: BackgroundTasks,
    registration_ids: list[int],
    db: Session = Depends(get_db),
):
    ids = sorted(set(registration_ids))
    if not ids:
        raise HTTPException(status_code=400, detail="Select at least one participant")
    registrations = db.scalars(
        select(CyclothonRegistration).where(CyclothonRegistration.id.in_(ids))
    ).all()
    eligible = [registration for registration in registrations if registration.status == "checked_in"]
    for registration in eligible:
        certificate_pdf = generate_participation_certificate(
            name=registration.full_name,
            rider_id=registration.id,
            route=registration.ride_category,
        )
        background_tasks.add_task(
            send_participation_certificate,
            recipient=registration.email,
            name=registration.full_name,
            rider_id=registration.id,
            route=registration.ride_category,
            certificate_pdf=certificate_pdf,
        )
    queued_ids = [registration.id for registration in eligible]
    return {
        "queued": len(eligible),
        "queued_ids": queued_ids,
        "skipped": len(registrations) - len(eligible),
        "skipped_ids": [registration.id for registration in registrations if registration.id not in queued_ids],
        "missing_ids": [item_id for item_id in ids if item_id not in {registration.id for registration in registrations}],
    }


@router.get("/registrations/{registration_id}/certificate-preview")
def preview_participation_certificate(registration_id: int, db: Session = Depends(get_db)):
    """Generate a single certificate on demand for staff visual review."""
    registration = get_or_404(db, CyclothonRegistration, registration_id)
    if registration.status != "checked_in":
        raise HTTPException(status_code=409, detail="Only checked-in participants are eligible for certificates")
    certificate_pdf = generate_participation_certificate(
        name=registration.full_name,
        rider_id=registration.id,
        route=registration.ride_category,
    )
    return Response(
        content=certificate_pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="nv-cyclothon-certificate-{registration.id}.pdf"'},
    )


@router.patch("/registrations/{registration_id}", response_model=RegistrationAdminRead)
def update_registration(registration_id: int, payload: RegistrationStatusUpdate, db: Session = Depends(get_db)):
    registration = get_or_404(db, CyclothonRegistration, registration_id)
    registration.status = payload.status
    db.commit(); db.refresh(registration)
    return registration


@router.post("/event-updates/email", status_code=status.HTTP_202_ACCEPTED)
def email_event_update(payload: EventUpdateEmailCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Send an essential event update without exposing recipients to one another."""
    recipients = list(db.scalars(select(CyclothonRegistration.email)).all())
    background_tasks.add_task(send_event_update, recipients=recipients, subject=payload.subject, message=payload.message)
    return {"queued_recipients": len(recipients)}

def crud(model, read_schema, create_schema, update_schema, path):
    @router.get(path, response_model=list[read_schema])
    def list_items(db: Session = Depends(get_db)):
        return db.scalars(select(model).order_by(model.created_at.desc())).all()
    @router.post(path, response_model=read_schema, status_code=201)
    def create_item(payload: create_schema, db: Session = Depends(get_db)):
        item = model(**payload.model_dump()); db.add(item); db.commit(); db.refresh(item); return item
    @router.put(f"{path}/{{item_id}}", response_model=read_schema)
    def update_item(item_id: int, payload: update_schema, db: Session = Depends(get_db)):
        item = get_or_404(db, model, item_id)
        for key, value in payload.model_dump().items(): setattr(item, key, value)
        db.commit(); db.refresh(item); return item
    @router.delete(f"{path}/{{item_id}}", status_code=204)
    def delete_item(item_id: int, db: Session = Depends(get_db)):
        db.delete(get_or_404(db, model, item_id)); db.commit(); return Response(status_code=204)

crud(EventOffer, OfferRead, OfferCreate, OfferUpdate, "/offers")
crud(ChiefGuest, ChiefGuestRead, ChiefGuestCreate, ChiefGuestUpdate, "/chief-guests")
crud(Delegation, DelegationRead, DelegationCreate, DelegationUpdate, "/delegations")
