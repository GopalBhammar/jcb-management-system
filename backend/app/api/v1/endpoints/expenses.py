"""Expense and ExpenseCategory API endpoints."""

import uuid
from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.models.models import User
from app.schemas.common import PaginatedResponse, MessageResponse
from app.schemas.expense import (
    ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseListResponse,
    ExpenseCategoryCreate, ExpenseCategoryResponse, ExpenseSummary,
)
from app.services.expense import expense_service
from app.repositories.expense import expense_category_repo, expense_repo

router = APIRouter()


# --- Expense Category endpoints ---

@router.get("/categories", response_model=List[ExpenseCategoryResponse])
def list_categories(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return expense_category_repo.get_all_with_totals(db, owner_id=current_user.id)


@router.post("/categories", response_model=ExpenseCategoryResponse, status_code=201)
def create_category(
    data: ExpenseCategoryCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    existing = expense_category_repo.get_by_name(db, data.name)
    if existing:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category already exists")
    obj = expense_category_repo.create(db, {"id": uuid.uuid4(), "owner_id": current_user.id, "name": data.name})
    return {"id": obj.id, "name": obj.name, "total_expenses": 0.0, "created_at": obj.created_at}


# --- Expense endpoints ---

@router.get("", response_model=PaginatedResponse)
def list_expenses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=10000),
    category_id: Optional[uuid.UUID] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("desc"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    items, total, total_pages = expense_service.list_expenses(
        db, page=page, page_size=page_size,
        category_id=category_id, date_from=date_from, date_to=date_to,
        sort_by=sort_by, sort_order=sort_order,
        owner_id=current_user.id,
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}


@router.post("", response_model=ExpenseResponse, status_code=201)
def create_expense(
    data: ExpenseCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    expense = expense_service.create_expense(db, data, current_user.id)
    return expense_service.get_expense(db, expense.id)


@router.get("/summary", response_model=List[ExpenseSummary])
def get_expense_summary(
    year: int = Query(default=None),
    month: int = Query(default=None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    from datetime import date as d
    today = d.today()
    y = year or today.year
    m = month or today.month
    return expense_repo.get_breakdown_by_category(db, y, m, owner_id=current_user.id)


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return expense_service.get_expense(db, expense_id)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: uuid.UUID,
    data: ExpenseUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    expense_service.update_expense(db, expense_id, data)
    return expense_service.get_expense(db, expense_id)


@router.delete("/{expense_id}", response_model=MessageResponse)
def delete_expense(
    expense_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    expense_service.delete_expense(db, expense_id)
    return {"message": "Expense deleted successfully", "success": True}
