from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class RideSearch(Base):
    __tablename__ = "ride_searches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    pickup_address = Column(Text, nullable=False)
    pickup_lat = Column(Float, nullable=False)
    pickup_lng = Column(Float, nullable=False)
    destination_address = Column(Text, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lng = Column(Float, nullable=False)
    distance_km = Column(Float, nullable=True)
    duration_minutes = Column(Float, nullable=True)
    searched_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="ride_searches")
    results = relationship("RideResult", back_populates="search", cascade="all, delete-orphan")


class RideResult(Base):
    __tablename__ = "ride_results"

    id = Column(Integer, primary_key=True, index=True)
    search_id = Column(Integer, ForeignKey("ride_searches.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_name = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)
    eta_minutes = Column(Integer, nullable=True)
    fare_min = Column(Float, nullable=True)
    fare_max = Column(Float, nullable=True)
    currency = Column(String(10), default="INR")
    surge_multiplier = Column(Float, default=1.0)
    is_available = Column(Boolean, default=True)
    deeplink_url = Column(Text, nullable=True)
    raw_response = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    search = relationship("RideSearch", back_populates="results")


class ProviderCache(Base):
    __tablename__ = "provider_cache"

    id = Column(Integer, primary_key=True, index=True)
    cache_key = Column(String(512), unique=True, nullable=False, index=True)
    provider_name = Column(String(50), nullable=False)
    response_data = Column(JSON, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
