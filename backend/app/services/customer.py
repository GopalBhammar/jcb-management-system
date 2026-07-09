"""Customer service — business logic for customer operations."""

import uuid
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.customer import customer_repo
from app.schemas.customer import CustomerCreate, CustomerUpdate


class CustomerService:

    def list_customers(
        self, db: Session, page: int = 1, page_size: int = 20,
        search: Optional[str] = None, sort_by: Optional[str] = None, sort_order: str = "desc"
    ):
        customers, total, total_pages = customer_repo.search_customers(
            db, page=page, page_size=page_size, search=search,
            sort_by=sort_by, sort_order=sort_order,
        )
        # Enrich each customer with outstanding amounts
        items = []
        for c in customers:
            fin = customer_repo.get_outstanding(db, c.id)
            items.append({
                "id": c.id,
                "customer_id": c.customer_id,
                "name": c.name,
                "mobile_number": c.mobile_number,
                "village": c.village,
                "outstanding": fin["outstanding"],
                "created_at": c.created_at,
            })
        return items, total, total_pages

    def get_customer(self, db: Session, customer_id: uuid.UUID):
        customer = customer_repo.get_by_id(db, customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        fin = customer_repo.get_outstanding(db, customer.id)
        return {
            **{c.key: getattr(customer, c.key) for c in customer.__table__.columns},
            "total_billed": fin["total_billed"],
            "total_paid": fin["total_paid"],
            "outstanding": fin["outstanding"],
        }

    def create_customer(self, db: Session, data: CustomerCreate):
        customer_id = customer_repo.get_next_customer_id(db)
        obj_data = data.model_dump()
        obj_data["customer_id"] = customer_id
        obj_data["id"] = uuid.uuid4()
        return customer_repo.create(db, obj_data)

    def update_customer(self, db: Session, customer_id: uuid.UUID, data: CustomerUpdate):
        update_data = data.model_dump(exclude_unset=True)
        updated = customer_repo.update(db, customer_id, update_data)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        return updated

    def delete_customer(self, db: Session, customer_id: uuid.UUID):
        deleted = customer_repo.delete(db, customer_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        return True

    def get_ledger(self, db: Session, customer_id: uuid.UUID):
        """Build a customer ledger combining bills and payments in chronological order."""
        from app.models.models import Bill, Payment

        customer = customer_repo.get_by_id(db, customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

        bills = db.query(Bill).filter(Bill.customer_id == customer_id).all()
        payments = db.query(Payment).filter(Payment.customer_id == customer_id).all()

        entries = []
        for b in bills:
            entries.append({
                "date": b.created_at,
                "type": "bill",
                "reference": b.bill_number,
                "description": f"Bill {b.bill_number}" + (f" - {b.site_name}" if b.site_name else ""),
                "debit": float(b.total_amount),
                "credit": 0.0,
            })
        for p in payments:
            entries.append({
                "date": p.created_at,
                "type": "payment",
                "reference": str(p.id)[:8],
                "description": f"Payment ({p.payment_method})",
                "debit": 0.0,
                "credit": float(p.amount),
            })

        # Sort by date ascending
        entries.sort(key=lambda x: x["date"])

        # Calculate running balance
        balance = 0.0
        for entry in entries:
            balance += entry["debit"] - entry["credit"]
            entry["balance"] = balance

        return entries


customer_service = CustomerService()
