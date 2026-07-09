from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import uuid
from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.models import User
from app.schemas.token import Token
from app.schemas.user import UserLogin, UserResponse, UserCreate

router = APIRouter()

@router.post("/login", response_model=Token)
def login(
    db: Session = Depends(deps.get_db),
    login_data: UserLogin = None
) -> Any:
    """
    OAuth2 compatible token login, accepting JSON email and password.
    """
    if not login_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing request body"
        )
        
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not security.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current logged in user profile.
    """
    return current_user


@router.post("/signup", response_model=UserResponse)
def signup(
    db: Session = Depends(deps.get_db),
    user_in: UserCreate = None
) -> Any:
    """
    Register a new user.
    """
    if not user_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing request body"
        )
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    user = User(
        id=uuid.uuid4(),
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role or "operator",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
