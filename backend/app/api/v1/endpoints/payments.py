"""Payment API endpoints — CRUD with bill auto-update."""

import uuid
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.models.models import User
from app.schemas.common import PaginatedResponse, MessageResponse
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse, PaymentListResponse
from app.services.payment import payment_service

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
def list_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=10000),
    customer_id: Optional[uuid.UUID] = Query(None),
    bill_id: Optional[uuid.UUID] = Query(None),
    payment_method: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("desc"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    items, total, total_pages = payment_service.list_payments(
        db, page=page, page_size=page_size,
        customer_id=customer_id, bill_id=bill_id,
        payment_method=payment_method,
        date_from=date_from, date_to=date_to,
        sort_by=sort_by, sort_order=sort_order,
        owner_id=current_user.id,
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}


@router.post("", response_model=PaymentResponse, status_code=201)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    payment = payment_service.create_payment(db, data, current_user.id)
    return payment_service.get_payment(db, payment.id)


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return payment_service.get_payment(db, payment_id)


@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: uuid.UUID,
    data: PaymentUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    payment_service.update_payment(db, payment_id, data)
    return payment_service.get_payment(db, payment_id)


@router.delete("/{payment_id}", response_model=MessageResponse)
def delete_payment(
    payment_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    payment_service.delete_payment(db, payment_id)
    return {"message": "Payment deleted successfully", "success": True}
