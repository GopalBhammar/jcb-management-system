"""Bill repository — data access for bill operations."""

import uuid
from typing import Optional, Tuple, List
from sqlalchemy import func, and_
from sqlalchemy.orm import Session, joinedload
from datetime import date

from app.models.models import Bill, Customer, Machine, Settings
from app.repositories.base import BaseRepository


class BillRepository(BaseRepository):
    def __init__(self):
        super().__init__(Bill)

    def get_next_bill_number(self, db: Session, owner_id: uuid.UUID = None) -> str:
        """Generate next bill number using the invoice prefix from settings."""
        settings = db.query(Settings).first()
        prefix = settings.invoice_prefix if settings else "INV"

        query = db.query(Bill)
        if owner_id:
            query = query.filter(Bill.owner_id == owner_id)
        last = query.order_by(Bill.created_at.desc()).first()
        if last and last.bill_number:
            try:
                num = int(last.bill_number.split("-")[1]) + 1
            except (IndexError, ValueError):
                num = 1
        else:
            num = 1
        return f"{prefix}-{num:04d}"

    def get_with_relations(self, db: Session, bill_id: uuid.UUID) -> Optional[Bill]:
        """Get a bill with customer and machine data loaded."""
        return (
            db.query(Bill)
            .options(joinedload(Bill.customer), joinedload(Bill.machine))
            .filter(Bill.id == bill_id)
            .first()
        )

    def search_bills(
        self,
        db: Session,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        customer_id: Optional[uuid.UUID] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "desc",
        owner_id: Optional[uuid.UUID] = None,
    ) -> Tuple[List[Bill], int, int]:
        filters = []
        if owner_id:
            filters.append(Bill.owner_id == owner_id)
        if status:
            filters.append(Bill.status == status)
        if customer_id:
            filters.append(Bill.customer_id == customer_id)
        if date_from:
            filters.append(Bill.date >= date_from)
        if date_to:
            filters.append(Bill.date <= date_to)

        return self.paginate(
            db,
            page=page,
            page_size=page_size,
            filters=filters,
            search_columns=[Bill.bill_number],
            search_query=search,
            sort_by=sort_by or "created_at",
            sort_order=sort_order,
        )

    def get_total_income_for_date(self, db: Session, target_date: date) -> float:
        """Sum of all payments received on a specific date."""
        result = (
            db.query(func.coalesce(func.sum(Bill.paid_amount), 0))
            .filter(Bill.date == target_date)
            .scalar()
        )
        return float(result)

    def get_monthly_income(self, db: Session, year: int, month: int) -> float:
        """Sum of total_amount for bills in a given month."""
        from sqlalchemy import extract
        result = (
            db.query(func.coalesce(func.sum(Bill.total_amount), 0))
            .filter(
                extract("year", Bill.date) == year,
                extract("month", Bill.date) == month,
            )
            .scalar()
        )
        return float(result)

    def get_pending_amount(self, db: Session, owner_id: uuid.UUID = None) -> float:
        """Total remaining amount across all unpaid bills."""
        query = db.query(func.coalesce(func.sum(Bill.remaining_amount), 0))
        query = query.filter(Bill.status.in_(["pending", "partial"]))
        if owner_id:
            query = query.filter(Bill.owner_id == owner_id)
        result = query.scalar()
        return float(result)


bill_repo = BillRepository()
