"""Customer repository — data access for customer operations."""

import uuid
from typing import Optional, Tuple, List
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import Customer, Bill, Payment
from app.repositories.base import BaseRepository


class CustomerRepository(BaseRepository):
    def __init__(self):
        super().__init__(Customer)

    def get_by_customer_id(self, db: Session, customer_id: str) -> Optional[Customer]:
        return db.query(Customer).filter(Customer.customer_id == customer_id).first()

    def get_next_customer_id(self, db: Session) -> str:
        """Generate the next sequential customer ID like CUST-0001."""
        last = (
            db.query(Customer)
            .order_by(Customer.created_at.desc())
            .first()
        )
        if last and last.customer_id:
            try:
                num = int(last.customer_id.split("-")[1]) + 1
            except (IndexError, ValueError):
                num = 1
        else:
            num = 1
        return f"CUST-{num:04d}"

    def search_customers(
        self,
        db: Session,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "desc",
    ) -> Tuple[List[Customer], int, int]:
        search_columns = [Customer.name, Customer.mobile_number, Customer.village, Customer.customer_id]
        return self.paginate(
            db,
            page=page,
            page_size=page_size,
            search_columns=search_columns,
            search_query=search,
            sort_by=sort_by,
            sort_order=sort_order,
        )

    def get_outstanding(self, db: Session, customer_id: uuid.UUID) -> dict:
        """Calculate total billed, paid, and outstanding for a customer."""
        total_billed = (
            db.query(func.coalesce(func.sum(Bill.total_amount), 0))
            .filter(Bill.customer_id == customer_id)
            .scalar()
        )
        total_paid = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(Payment.customer_id == customer_id)
            .scalar()
        )
        return {
            "total_billed": float(total_billed),
            "total_paid": float(total_paid),
            "outstanding": float(total_billed) - float(total_paid),
        }


customer_repo = CustomerRepository()
