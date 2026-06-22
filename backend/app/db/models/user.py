from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=True)  # nullable for OAuth users
    phone_number = Column(String(20), nullable=True)
    avatar_url = Column(Text, nullable=True)
    google_id = Column(String(255), unique=True, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    fcm_token = Column(String(512), nullable=True)  # Firebase push token
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    saved_places = relationship("SavedPlace", back_populates="user", cascade="all, delete-orphan")
    ride_searches = relationship("RideSearch", back_populates="user")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False)
    price_alerts = relationship("PriceAlert", back_populates="user")
