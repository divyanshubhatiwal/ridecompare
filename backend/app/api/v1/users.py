from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, EmailStr

from app.db.database import get_db
from app.db.repositories.user_repository import UserRepository
from app.core.dependencies import get_current_active_user
from app.db.models.user import User
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    fcm_token: Optional[str] = None


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone_number=current_user.phone_number,
        avatar_url=current_user.avatar_url,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at.isoformat(),
    )


@router.patch("/me", response_model=UserResponse)
def update_me(
    body: UpdateUserRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    updated = repo.update(current_user, **body.model_dump(exclude_none=True))
    return UserResponse(
        id=updated.id,
        email=updated.email,
        full_name=updated.full_name,
        phone_number=updated.phone_number,
        avatar_url=updated.avatar_url,
        is_verified=updated.is_verified,
        created_at=updated.created_at.isoformat(),
    )
