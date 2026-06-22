import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

# Dev mode: use SQLite when DEV_SQLITE=1 is set (no Docker required)
if os.getenv("DEV_SQLITE", "0") == "1":
    _db_url = "sqlite:///./ridecompare_dev.db"
    engine = create_engine(_db_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
