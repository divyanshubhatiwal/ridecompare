from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import verify_access_token
from app.db.repositories.user_repository import UserRepository
from app.db.models.user import User
import os
import redis
from app.core.config import settings

security = HTTPBearer()

# Shared fakeredis instance for dev mode (DEV_SQLITE=1)
_fakeredis_instance = None


def get_redis_client() -> redis.Redis:
    global _fakeredis_instance
    # Use in-memory fakeredis when no real Redis is configured
    redis_url = os.getenv("REDIS_URL") or os.getenv("UPSTASH_REDIS_REST_URL")
    if os.getenv("DEV_SQLITE", "0") == "1" or not redis_url and settings.REDIS_HOST == "localhost":
        if _fakeredis_instance is None:
            import fakeredis
            _fakeredis_instance = fakeredis.FakeRedis(decode_responses=True)
        return _fakeredis_instance
    if redis_url:
        return redis.from_url(redis_url, decode_responses=True)
    return redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        password=settings.REDIS_PASSWORD,
        decode_responses=True,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    user_id = verify_access_token(token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    repo = UserRepository(db)
    user = repo.get_by_id(int(user_id))

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
