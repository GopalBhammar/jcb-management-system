"""Expense repository — data access for expense and category operations."""

import uuid
from typing import Optional, Tuple, List
from sqlalchemy import func, extract
from sqlalchemy.orm import Session, joinedload
from datetime import date

from app.models.models import Expense, ExpenseCategory
from app.repositories.base import BaseRepository


class ExpenseCategoryRepository(BaseRepository):
    def __init__(self):
        super().__init__(ExpenseCategory)

    def get_by_name(self, db: Session, name: str) -> Optional[ExpenseCategory]:
        return db.query(ExpenseCategory).filter(ExpenseCategory.name == name).first()

    def get_all_with_totals(self, db: Session) -> List[dict]:
        """Return all categories with their total expense amounts."""
        results = (
            db.query(
                ExpenseCategory.id,
                ExpenseCategory.name,
                ExpenseCategory.created_at,
                func.coalesce(func.sum(Expense.amount), 0).label("total_expenses"),
            )
            .outerjoin(Expense, Expense.category_id == ExpenseCategory.id)
            .group_by(ExpenseCategory.id, ExpenseCategory.name, ExpenseCategory.created_at)
            .all()
        )
        return [
            {
                "id": r.id,
                "name": r.name,
                "created_at": r.created_at,
                "total_expenses": float(r.total_expenses),
            }
            for r in results
        ]


class ExpenseRepository(BaseRepository):
    def __init__(self):
        super().__init__(Expense)

    def search_expenses(
        self,
        db: Session,
        page: int = 1,
        page_size: int = 20,
        category_id: Optional[uuid.UUID] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "desc",
    ) -> Tuple[List[Expense], int, int]:
        filters = []
        if category_id:
            filters.append(Expense.category_id == category_id)
        if date_from:
            filters.append(Expense.date >= date_from)
        if date_to:
            filters.append(Expense.date <= date_to)

        return self.paginate(
            db, page=page, page_size=page_size,
            filters=filters, sort_by=sort_by or "created_at", sort_order=sort_order,
        )

    def get_total_for_date(self, db: Session, target_date: date) -> float:
        result = (
            db.query(func.coalesce(func.sum(Expense.amount), 0))
            .filter(Expense.date == target_date)
            .scalar()
        )
        return float(result)

    def get_monthly_total(self, db: Session, year: int, month: int) -> float:
        result = (
            db.query(func.coalesce(func.sum(Expense.amount), 0))
            .filter(
                extract("year", Expense.date) == year,
                extract("month", Expense.date) == month,
            )
            .scalar()
        )
        return float(result)

    def get_breakdown_by_category(self, db: Session, year: int, month: int) -> List[dict]:
        """Get expense breakdown by category for a given month."""
        results = (
            db.query(
                ExpenseCategory.name,
                func.coalesce(func.sum(Expense.amount), 0).label("total"),
                func.count(Expense.id).label("count"),
            )
            .join(ExpenseCategory, Expense.category_id == ExpenseCategory.id)
            .filter(
                extract("year", Expense.date) == year,
                extract("month", Expense.date) == month,
            )
            .group_by(ExpenseCategory.name)
            .all()
        )
        return [{"category": r.name, "total": float(r.total), "count": r.count} for r in results]


expense_category_repo = ExpenseCategoryRepository()
expense_repo = ExpenseRepository()
