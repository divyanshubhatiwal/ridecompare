from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class UserPreferences(Base):
    __tablename__ = "preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    preferred_sort = Column(String(20), default="cheapest")  # cheapest, fastest, balanced
    avoid_surge = Column(Boolean, default=False)
    max_surge_multiplier = Column(Float, default=1.5)
    preferred_providers = Column(JSON, default=list)
    preferred_ride_types = Column(JSON, default=list)
    airport_mode = Column(Boolean, default=False)
    notifications_enabled = Column(Boolean, default=True)
    price_alert_enabled = Column(Boolean, default=True)
    surge_alert_enabled = Column(Boolean, default=True)
    default_pickup_place_id = Column(Integer, ForeignKey("saved_places.id"), nullable=True)
    currency = Column(String(10), default="INR")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="preferences")


class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String(20), nullable=False)
    pickup_address = Column(String(512), nullable=False)
    pickup_lat = Column(Float, nullable=True)
    pickup_lng = Column(Float, nullable=True)
    destination_address = Column(String(512), nullable=False)
    destination_lat = Column(Float, nullable=True)
    destination_lng = Column(Float, nullable=True)
    provider = Column(String(50), nullable=True)
    threshold_amount = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    triggered_count = Column(Integer, default=0)
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="price_alerts")


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_id = Column(Integer, ForeignKey("price_alerts.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    body = Column(String(1024), nullable=False)
    notification_type = Column(String(50), nullable=False)
    is_sent = Column(Boolean, default=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
