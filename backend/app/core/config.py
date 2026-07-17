from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, Field, field_validator
from typing import List, Optional
import secrets


class Settings(BaseSettings):
    APP_NAME: str = "RideCompare API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Database
    POSTGRES_USER: str = "ridecompare"
    POSTGRES_PASSWORD: str = "ridecompare_secret"
    POSTGRES_DB: str = "ridecompare"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    DATABASE_URL_OVERRIDE: Optional[str] = Field(default=None, alias="DATABASE_URL")

    @property
    def DATABASE_URL(self) -> str:
        if self.DATABASE_URL_OVERRIDE:
            url = self.DATABASE_URL_OVERRIDE
            # Render/Supabase give postgres:// — psycopg2 needs postgresql://
            return url.replace("postgres://", "postgresql+psycopg2://", 1) \
                       .replace("postgresql://", "postgresql+psycopg2://", 1) \
                       if "+psycopg2" not in url else url
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None

    @property
    def REDIS_URL(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # Google APIs
    GOOGLE_MAPS_API_KEY: str = ""
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # Firebase (push notifications)
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None

    # Provider API keys (mock-ready, swap for real keys)
    UBER_SERVER_TOKEN: Optional[str] = None
    UBER_CLIENT_ID: Optional[str] = None
    OLA_API_KEY: Optional[str] = None
    RAPIDO_API_KEY: Optional[str] = None
    NAMMA_YATRI_API_KEY: Optional[str] = None

    # UltraMsg — free WhatsApp for any number (ultramsg.com)
    ULTRAMSG_INSTANCE_ID: Optional[str] = None
    ULTRAMSG_TOKEN: Optional[str] = None

    # Bland AI — free AI voice calls for any number (bland.ai, 10 min/month free)
    BLAND_AI_API_KEY: Optional[str] = None

    # Email / SMTP
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_TLS:  bool = True
    EMAIL_FROM_NAME: str = "RideCompare"

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    COMPARE_RATE_LIMIT_PER_MINUTE: int = 20

    # Cache TTLs (seconds)
    PROVIDER_CACHE_TTL: int = 30
    PLACES_CACHE_TTL: int = 3600
    ROUTE_CACHE_TTL: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = True
        populate_by_name = True


settings = Settings()
