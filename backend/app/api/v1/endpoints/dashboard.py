"""Dashboard API endpoint — aggregated stats and chart data."""

import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.models.models import User
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard import dashboard_service

router = APIRouter()


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return dashboard_service.get_dashboard_data(db, owner_id=current_user.id)
