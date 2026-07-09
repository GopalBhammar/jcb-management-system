"""Expense service — business logic for expense operations."""

import uuid
from typing import Optional
from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.expense import expense_repo, expense_category_repo
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


class ExpenseService:

    def _to_str(self, val):
        if val is None:
            return ""
        return str(val)

    def list_expenses(
        self, db: Session, page: int = 1, page_size: int = 20,
        category_id: Optional[uuid.UUID] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        sort_by: Optional[str] = None, sort_order: str = "desc",
    ):
        expenses, total, total_pages = expense_repo.search_expenses(
            db, page=page, page_size=page_size,
            category_id=category_id, date_from=date_from, date_to=date_to,
            sort_by=sort_by, sort_order=sort_order,
        )
        items = []
        for e in expenses:
            items.append({
                "id": e.id,
                "category_name": e.category.name if e.category else "",
                "date": self._to_str(e.date),
                "amount": float(e.amount),
                "description": e.description,
                "created_at": self._to_str(e.created_at),
            })
        return items, total, total_pages

    def get_expense(self, db: Session, expense_id: uuid.UUID):
        expense = expense_repo.get_by_id(db, expense_id)
        if not expense:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
        return {
            "id": expense.id,
            "category_id": expense.category_id,
            "category_name": expense.category.name if expense.category else "",
            "date": self._to_str(expense.date),
            "amount": float(expense.amount),
            "description": expense.description,
            "receipt_url": expense.receipt_url,
            "created_by": expense.created_by,
            "creator_name": expense.creator.full_name if expense.creator else "",
            "created_at": self._to_str(expense.created_at),
        }

    def create_expense(self, db: Session, data: ExpenseCreate, user_id: uuid.UUID):
        category = expense_category_repo.get_by_id(db, data.category_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid expense category")
        obj_data = data.model_dump()
        obj_data["id"] = uuid.uuid4()
        obj_data["created_by"] = user_id
        if obj_data.get("date"):
            obj_data["date"] = date.fromisoformat(obj_data["date"])
        else:
            obj_data["date"] = date.today()
        return expense_repo.create(db, obj_data)

    def update_expense(self, db: Session, expense_id: uuid.UUID, data: ExpenseUpdate):
        update_data = data.model_dump(exclude_unset=True)
        if "date" in update_data and update_data["date"]:
            update_data["date"] = date.fromisoformat(update_data["date"])
        updated = expense_repo.update(db, expense_id, update_data)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
        return updated

    def delete_expense(self, db: Session, expense_id: uuid.UUID):
        deleted = expense_repo.delete(db, expense_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
        return True


expense_service = ExpenseService()
