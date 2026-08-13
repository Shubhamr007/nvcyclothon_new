from datetime import datetime
from typing import Optional
import re
from urllib.parse import urlparse
from pydantic import BaseModel, ConfigDict, Field, field_validator

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
INDIAN_MOBILE_PATTERN = re.compile(r"^[6-9]\d{9}$")


def validate_https_url(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password:
        raise ValueError("Image URLs must use HTTPS and may not include credentials")
    return value


def normalize_indian_mobile(value: str) -> str:
    """Accept a local Indian mobile number or +91 and store canonical E.164."""
    compact = re.sub(r"[\s()\-]", "", value)
    if compact.startswith("+91"):
        local_number = compact[3:]
    elif compact.startswith("+"):
        raise ValueError("Use an Indian mobile number with country code +91")
    else:
        local_number = compact
    if not INDIAN_MOBILE_PATTERN.fullmatch(local_number):
        raise ValueError("Enter a valid 10-digit Indian mobile number")
    return f"+91{local_number}"


class SecureModel(BaseModel):
    """Reject unnoticed input and normalize all human-entered plain text."""
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    @field_validator("*", mode="before")
    @classmethod
    def reject_control_characters(cls, value):
        if isinstance(value, str) and any(ord(char) < 32 and char not in "\n\t" for char in value):
            raise ValueError("Control characters are not allowed")
        return value


class ContactValidation:
    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not EMAIL_PATTERN.fullmatch(normalized):
            raise ValueError("Enter a valid email address")
        return normalized

    @field_validator("phone")
    @classmethod
    def valid_phone(cls, value: Optional[str]) -> Optional[str]:
        return normalize_indian_mobile(value) if value else value


class ProductRead(SecureModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    name: str
    origin: str
    price_paise: int
    description: Optional[str]
    image_url: Optional[str]
    inventory: int


class ProductCreate(SecureModel):
    slug: str = Field(pattern=r"^[a-z0-9-]+$")
    name: str = Field(min_length=2, max_length=160)
    origin: str = Field(min_length=2, max_length=160)
    price_paise: int = Field(gt=0)
    description: Optional[str] = None
    image_url: Optional[str] = None
    inventory: int = Field(default=0, ge=0)

    @field_validator("image_url")
    @classmethod
    def https_image_url(cls, value: Optional[str]) -> Optional[str]:
        return validate_https_url(value)


class UploadRead(SecureModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    original_name: str
    size_bytes: int
    created_at: datetime


class ProductUpdate(SecureModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=160)
    origin: Optional[str] = Field(default=None, min_length=2, max_length=160)
    price_paise: Optional[int] = Field(default=None, gt=0)
    description: Optional[str] = None
    image_url: Optional[str] = None
    inventory: Optional[int] = Field(default=None, ge=0)

    @field_validator("image_url")
    @classmethod
    def https_image_url(cls, value: Optional[str]) -> Optional[str]:
        return validate_https_url(value)


class OrderLineCreate(SecureModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=20)


class OrderCreate(ContactValidation, SecureModel):
    customer_name: str = Field(min_length=2, max_length=160)
    email: str = Field(min_length=5, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=32)
    shipping_address: str = Field(min_length=10, max_length=1000)
    items: list[OrderLineCreate] = Field(min_length=1, max_length=20)


class OrderLineRead(SecureModel):
    model_config = ConfigDict(from_attributes=True)
    product_id: int
    quantity: int
    unit_price_paise: int


class OrderRead(SecureModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    payment_status: str
    total_paise: int
    shipping_address: str
    created_at: datetime
    items: list[OrderLineRead]


class CyclothonRegistrationCreate(ContactValidation, SecureModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: str = Field(min_length=5, max_length=255)
    phone: str = Field(min_length=8, max_length=32)
    age: int = Field(ge=10, le=100)
    city: str = Field(min_length=2, max_length=100)
    gender: str = Field(pattern=r"^(Female|Male|Non-binary|Prefer not to say)$")
    ride_category: str = Field(pattern=r"^(60 Km Road Challenge|30 Km MTB Challenge|10 Km Green Ride|Kid-o-thon)$")
    emergency_contact: str = Field(min_length=5, max_length=160)
    t_shirt_size: str = Field(pattern=r"^(XS|S|M|L|XL|XXL|N/A)$")
    waiver_accepted: bool
    privacy_accepted: bool

    @field_validator("emergency_contact")
    @classmethod
    def valid_emergency_contact(cls, value: str) -> str:
        return normalize_indian_mobile(value)


class CyclothonRegistrationRead(SecureModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    ride_category: str
    status: str
    created_at: datetime


class RazorpayCheckout(SecureModel):
    key_id: str
    order_id: str
    amount_paise: int
    currency: str = "INR"


class CyclothonRegistrationCheckoutRead(CyclothonRegistrationRead):
    checkout: Optional[RazorpayCheckout] = None


class RazorpayPaymentVerification(SecureModel):
    razorpay_order_id: str = Field(min_length=5, max_length=100)
    razorpay_payment_id: str = Field(min_length=5, max_length=100)
    razorpay_signature: str = Field(min_length=32, max_length=128)


class RegistrationAdminRead(CyclothonRegistrationRead):
    email: str
    phone: str
    age: int
    city: str
    gender: str
    emergency_contact: str
    t_shirt_size: str


class RegistrationStatusUpdate(SecureModel):
    status: str = Field(pattern=r"^(pending|approved|checked_in|cancelled)$")


class BulkRegistrationStatusUpdate(SecureModel):
    registration_ids: list[int] = Field(min_length=1, max_length=1000)
    status: str = Field(pattern=r"^(pending|approved|checked_in|cancelled)$")


class OfferBase(SecureModel):
    title: str = Field(min_length=2, max_length=160)
    description: Optional[str] = Field(default=None, max_length=2000)
    code: Optional[str] = Field(default=None, max_length=64)
    active: bool = True
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class OfferCreate(OfferBase):
    pass


class OfferUpdate(OfferBase):
    pass


class OfferRead(OfferBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class PublicOfferRead(SecureModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: Optional[str]
    active: bool
    starts_at: Optional[datetime]
    ends_at: Optional[datetime]
    created_at: datetime


class ChiefGuestBase(SecureModel):
    name: str = Field(min_length=2, max_length=160)
    designation: str = Field(min_length=2, max_length=200)
    bio: Optional[str] = Field(default=None, max_length=3000)
    image_url: Optional[str] = Field(default=None, max_length=500)
    featured: bool = True
    display_order: int = Field(default=0, ge=0)

    @field_validator("image_url")
    @classmethod
    def https_image_url(cls, value: Optional[str]) -> Optional[str]:
        return validate_https_url(value)


class ChiefGuestCreate(ChiefGuestBase):
    pass


class ChiefGuestUpdate(ChiefGuestBase):
    pass


class ChiefGuestRead(ChiefGuestBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class DelegationBase(SecureModel):
    organization: str = Field(min_length=2, max_length=160)
    contact_name: str = Field(min_length=2, max_length=160)
    contact_email: Optional[str] = Field(default=None, max_length=255)
    contact_phone: Optional[str] = Field(default=None, max_length=32)
    member_count: int = Field(default=1, ge=1, le=10000)
    status: str = Field(default="invited", pattern=r"^(invited|confirmed|declined|attended)$")
    notes: Optional[str] = Field(default=None, max_length=3000)


class DelegationCreate(DelegationBase):
    pass


class DelegationUpdate(DelegationBase):
    pass


class DelegationRead(DelegationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class AnalyticsRead(SecureModel):
    total_registrations: int
    approved_registrations: int
    checked_in_registrations: int
    registrations_today: int
    registrations_by_route: dict[str, int]
    registrations_by_status: dict[str, int]
    registrations_by_city: list[dict[str, object]]
    delegation_count: int
    delegation_members: int
    active_offers: int


class AdminLogin(SecureModel):
    admin_key: str = Field(min_length=1, max_length=512)


class AdminSession(SecureModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class EventUpdateEmailCreate(SecureModel):
    subject: str = Field(min_length=3, max_length=160)
    message: str = Field(min_length=3, max_length=5000)
