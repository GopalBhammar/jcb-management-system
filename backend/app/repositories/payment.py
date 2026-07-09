"""Payment repository — data access for payment operations."""

import uuid
from typing import Optional, Tuple, List
from sqlalchemy import func, extract
from sqlalchemy.orm import Session, joinedload
from datetime import date

from app.models.models import Payment, Bill, Customer
from app.repositories.base import BaseRepository


class PaymentRepository(BaseRepository):
    def __init__(self):
        super().__init__(Payment)

    def get_with_relations(self, db: Session, payment_id: uuid.UUID) -> Optional[Payment]:
        return (
            db.query(Payment)
            .options(joinedload(Payment.bill), joinedload(Payment.customer), joinedload(Payment.receiver))
            .filter(Payment.id == payment_id)
            .first()
        )

    def search_payments(
        self,
        db: Session,
        page: int = 1,
        page_size: int = 20,
        customer_id: Optional[uuid.UUID] = None,
        bill_id: Optional[uuid.UUID] = None,
        payment_method: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "desc",
    ) -> Tuple[List[Payment], int, int]:
        filters = []
        if customer_id:
            filters.append(Payment.customer_id == customer_id)
        if bill_id:
            filters.append(Payment.bill_id == bill_id)
        if payment_method:
            filters.append(Payment.payment_method == payment_method)
        if date_from:
            filters.append(Payment.date >= date_from)
        if date_to:
            filters.append(Payment.date <= date_to)

        return self.paginate(
            db, page=page, page_size=page_size,
            filters=filters, sort_by=sort_by or "created_at", sort_order=sort_order,
        )

    def get_total_for_date(self, db: Session, target_date: date) -> float:
        result = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(Payment.date == target_date)
            .scalar()
        )
        return float(result)

    def get_monthly_total(self, db: Session, year: int, month: int) -> float:
        result = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(
                extract("year", Payment.date) == year,
                extract("month", Payment.date) == month,
            )
            .scalar()
        )
        return float(result)

    def get_payments_for_bill(self, db: Session, bill_id: uuid.UUID) -> List[Payment]:
        return db.query(Payment).filter(Payment.bill_id == bill_id).order_by(Payment.date.desc()).all()


payment_repo = PaymentRepository()
