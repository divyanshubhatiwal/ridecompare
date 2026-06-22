"""
Dev server — runs RideCompare API with SQLite + fakeredis.
No Docker, no PostgreSQL, no Redis required.

Usage:  python dev_run.py
"""
import os, sys

os.environ["DEV_SQLITE"] = "1"
os.environ.setdefault("SECRET_KEY", "dev_secret_key_not_for_production")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("ENVIRONMENT", "development")
# Suppress psycopg2 import errors — not needed for SQLite mode
os.environ.setdefault("POSTGRES_USER", "dev")
os.environ.setdefault("POSTGRES_PASSWORD", "dev")
os.environ.setdefault("POSTGRES_DB", "dev")

sys.path.insert(0, os.path.dirname(__file__))

# Create all SQLite tables
from app.db.database import Base, engine
from app.db.models import *  # noqa

Base.metadata.create_all(bind=engine)

print()
print("━" * 60)
print("  🚀 RideCompare API  —  Dev Mode (SQLite + fakeredis)")
print("  http://127.0.0.1:8000")
print("  Interactive docs: http://127.0.0.1:8000/docs")
print("  Health check:     http://127.0.0.1:8000/health")
print("━" * 60)
print()

import uvicorn
uvicorn.run(
    "app.main:app",
    host="127.0.0.1",
    port=8000,
    reload=False,
    log_level="info",
)
