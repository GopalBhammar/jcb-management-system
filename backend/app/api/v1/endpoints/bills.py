"""Bill API endpoints — full CRUD with filtering, auto-calculation, and duplication."""

import uuid
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.models.models import User
from app.schemas.common import PaginatedResponse, MessageResponse
from app.schemas.bill import BillCreate, BillUpdate, BillResponse, BillListResponse
from app.services.bill import bill_service

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
def list_bills(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=10000),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    customer_id: Optional[uuid.UUID] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("desc"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    items, total, total_pages = bill_service.list_bills(
        db, page=page, page_size=page_size,
        search=search, status_filter=status,
        customer_id=customer_id, date_from=date_from, date_to=date_to,
        sort_by=sort_by, sort_order=sort_order,
        owner_id=current_user.id,
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}


@router.post("", response_model=BillResponse, status_code=201)
def create_bill(
    data: BillCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    bill = bill_service.create_bill(db, data, current_user.id)
    return bill_service.get_bill(db, bill.id)


@router.get("/{bill_id}", response_model=BillResponse)
def get_bill(
    bill_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return bill_service.get_bill(db, bill_id)


@router.put("/{bill_id}", response_model=BillResponse)
def update_bill(
    bill_id: uuid.UUID,
    data: BillUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    bill_service.update_bill(db, bill_id, data)
    return bill_service.get_bill(db, bill_id)


@router.delete("/{bill_id}", response_model=MessageResponse)
def delete_bill(
    bill_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    bill_service.delete_bill(db, bill_id)
    return {"message": "Bill deleted successfully", "success": True}


@router.post("/{bill_id}/duplicate", response_model=BillResponse, status_code=201)
def duplicate_bill(
    bill_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    new_bill = bill_service.duplicate_bill(db, bill_id, current_user.id)
    return bill_service.get_bill(db, new_bill.id)
