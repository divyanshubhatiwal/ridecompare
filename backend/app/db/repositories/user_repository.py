from typing import Optional
from sqlalchemy.orm import Session
from app.db.models.user import User
from app.core.security import get_password_hash


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email, User.deleted_at.is_(None)).first()

    def get_by_google_id(self, google_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.google_id == google_id).first()

    def create(self, email: str, full_name: str, password: Optional[str] = None,
               google_id: Optional[str] = None, avatar_url: Optional[str] = None) -> User:
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(password) if password else None,
            google_id=google_id,
            avatar_url=avatar_url,
            is_verified=bool(google_id),
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        # Create default preferences
        from app.db.models.preferences import UserPreferences
        prefs = UserPreferences(user_id=user.id)
        self.db.add(prefs)
        self.db.commit()

        return user

    def update(self, user: User, **kwargs) -> User:
        for key, value in kwargs.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_fcm_token(self, user_id: int, token: str) -> bool:
        user = self.get_by_id(user_id)
        if user:
            user.fcm_token = token
            self.db.commit()
            return True
        return False

    def soft_delete(self, user: User) -> None:
        from datetime import datetime, timezone
        user.deleted_at = datetime.now(timezone.utc)
        user.is_active = False
        self.db.commit()
