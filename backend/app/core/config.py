from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    # Resolve relative to the backend package, not the shell's working
    # directory. This makes `uvicorn backend.app.main:app` and running from
    # `backend/` load the same credentials.
    model_config = SettingsConfigDict(env_file=BACKEND_ENV_FILE, extra="ignore")
    app_name: str = "NV Cyclothon API"
    environment: str = "development"
    # PostgreSQL is the application database. Override this in backend/.env
    # with credentials supplied by your hosting provider for production.
    database_url: str = "postgresql+psycopg://shubham@127.0.0.1:5432/nv_cyclothon"
    upload_dir: str = "uploads"
    allowed_origins: str = "http://localhost:5173"
    allowed_hosts: str = "localhost,127.0.0.1"
    admin_api_key: str = "change-me-before-production"
    admin_session_ttl_seconds: int = 900
    max_files_per_upload: int = 10
    max_upload_size_bytes: int = 25 * 1024 * 1024
    allowed_upload_extensions: str = "csv,xlsx,pdf"
    email_enabled: bool = False
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_use_tls: bool = True
    razorpay_enabled: bool = False
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""

    @property
    def upload_path(self) -> Path:
        path = Path(self.upload_dir)
        path.mkdir(parents=True, exist_ok=True)
        return path


settings = Settings()

if not settings.database_url.startswith("postgresql"):
    raise RuntimeError(
        "DATABASE_URL must use PostgreSQL in every environment "
        "(for example: postgresql+psycopg://user:password@host:5432/database)"
    )

if settings.environment.lower() == "production" and settings.admin_api_key == "change-me-before-production":
    raise RuntimeError("ADMIN_API_KEY must be set to a secure value in production")

if settings.environment.lower() == "production":
    origins = [origin.strip() for origin in settings.allowed_origins.split(",")]
    if "*" in origins or not all(origin.startswith("https://") for origin in origins):
        raise RuntimeError("ALLOWED_ORIGINS must contain explicit HTTPS origins in production")
    if len(settings.admin_api_key) < 32:
        raise RuntimeError("ADMIN_API_KEY must be at least 32 characters in production")
    if settings.email_enabled and (not settings.smtp_host or not settings.smtp_from_email):
        raise RuntimeError("SMTP_HOST and SMTP_FROM_EMAIL are required when EMAIL_ENABLED is true")
    if settings.razorpay_enabled and (not settings.razorpay_key_id.startswith("rzp_live_") or not settings.razorpay_key_secret or not settings.razorpay_webhook_secret):
        raise RuntimeError("Live Razorpay keys and RAZORPAY_WEBHOOK_SECRET are required when RAZORPAY_ENABLED is true")
