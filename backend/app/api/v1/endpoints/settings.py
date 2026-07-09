"""Settings API endpoints — read and update application settings."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.models import User
from app.schemas.settings import SettingsUpdate, SettingsResponse
from app.repositories.settings import settings_repo

router = APIRouter()


@router.get("", response_model=SettingsResponse)
def get_settings(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    settings = settings_repo.get_settings(db)
    if not settings:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Settings not found. Run seed script.")
    return settings


@router.put("", response_model=SettingsResponse)
def update_settings(
    data: SettingsUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    settings = settings_repo.get_settings(db)
    if not settings:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Settings not found. Run seed script.")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return settings
