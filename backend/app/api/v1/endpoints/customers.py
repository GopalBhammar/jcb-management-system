"""Customer API endpoints — full CRUD with search, pagination, and ledger."""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.models.models import User
from app.schemas.common import PaginatedResponse, MessageResponse
from app.schemas.customer import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
    CustomerListResponse, CustomerLedgerEntry,
)
from app.services.customer import customer_service

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=10000),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("desc"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    items, total, total_pages = customer_service.list_customers(
        db, page=page, page_size=page_size,
        search=search, sort_by=sort_by, sort_order=sort_order,
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}


@router.post("", response_model=CustomerResponse, status_code=201)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    customer = customer_service.create_customer(db, data)
    return customer_service.get_customer(db, customer.id)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return customer_service.get_customer(db, customer_id)


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: uuid.UUID,
    data: CustomerUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    customer_service.update_customer(db, customer_id, data)
    return customer_service.get_customer(db, customer_id)


@router.delete("/{customer_id}", response_model=MessageResponse)
def delete_customer(
    customer_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    customer_service.delete_customer(db, customer_id)
    return {"message": "Customer deleted successfully", "success": True}


@router.get("/{customer_id}/ledger")
def get_customer_ledger(
    customer_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return customer_service.get_ledger(db, customer_id)
