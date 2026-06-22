from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class SavedPlace(Base):
    __tablename__ = "saved_places"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(100), nullable=False)           # "Home", "Work", "Gym"
    place_id = Column(String(255), nullable=True)         # Google Places ID
    address = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_favorite = Column(Boolean, default=False)
    icon = Column(String(50), nullable=True)              # icon type: home, work, star
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="saved_places")
