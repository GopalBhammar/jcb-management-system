"""Payment service — business logic for payment operations with bill auto-update."""

import uuid
from typing import Optional
from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.models import Bill, Payment
from app.repositories.payment import payment_repo
from app.repositories.bill import bill_repo
from app.schemas.payment import PaymentCreate, PaymentUpdate


class PaymentService:

    def _update_bill_on_payment(self, db: Session, bill_id: uuid.UUID):
        if not bill_id:
            return
        bill = bill_repo.get_by_id(db, bill_id)
        if not bill:
            return
        payments = payment_repo.get_payments_for_bill(db, bill_id)
        total_paid = sum(float(p.amount) for p in payments)
        bill.paid_amount = round(total_paid, 2)
        bill.remaining_amount = round(float(bill.total_amount) - total_paid, 2)
        if bill.remaining_amount <= 0:
            bill.status = "paid"
            bill.remaining_amount = 0.0
        elif total_paid > 0:
            bill.status = "partial"
        else:
            bill.status = "pending"
        db.commit()
        db.refresh(bill)

    def _to_str(self, val):
        if val is None:
            return ""
        return str(val)

    def list_payments(
        self, db: Session, page: int = 1, page_size: int = 20,
        customer_id: Optional[uuid.UUID] = None,
        bill_id: Optional[uuid.UUID] = None,
        payment_method: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        sort_by: Optional[str] = None, sort_order: str = "desc",
        owner_id: Optional[uuid.UUID] = None,
    ):
        payments, total, total_pages = payment_repo.search_payments(
            db, page=page, page_size=page_size,
            customer_id=customer_id, bill_id=bill_id,
            payment_method=payment_method,
            date_from=date_from, date_to=date_to,
            sort_by=sort_by, sort_order=sort_order,
            owner_id=owner_id,
        )
        items = []
        for p in payments:
            items.append({
                "id": p.id,
                "bill_number": p.bill.bill_number if p.bill else "",
                "customer_name": p.customer.name if p.customer else "",
                "amount": float(p.amount),
                "date": self._to_str(p.date),
                "payment_method": p.payment_method,
                "reference_number": p.reference_number,
                "created_at": self._to_str(p.created_at),
            })
        return items, total, total_pages

    def get_payment(self, db: Session, payment_id: uuid.UUID):
        payment = payment_repo.get_with_relations(db, payment_id)
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        return {
            "id": payment.id,
            "bill_id": payment.bill_id,
            "bill_number": payment.bill.bill_number if payment.bill else "",
            "customer_id": payment.customer_id,
            "customer_name": payment.customer.name if payment.customer else "",
            "amount": float(payment.amount),
            "date": self._to_str(payment.date),
            "payment_method": payment.payment_method,
            "reference_number": payment.reference_number,
            "remark": payment.remark,
            "received_by": payment.received_by,
            "receiver_name": payment.receiver.full_name if payment.receiver else "",
            "created_at": self._to_str(payment.created_at),
        }

    def create_payment(self, db: Session, data: PaymentCreate, user_id: uuid.UUID):
        obj_data = data.model_dump()
        obj_data["id"] = uuid.uuid4()
        obj_data["received_by"] = user_id
        obj_data["owner_id"] = user_id
        if obj_data.get("date"):
            obj_data["date"] = date.fromisoformat(obj_data["date"])
        else:
            obj_data["date"] = date.today()
        payment = payment_repo.create(db, obj_data)
        if payment.bill_id:
            self._update_bill_on_payment(db, payment.bill_id)
        return payment

    def update_payment(self, db: Session, payment_id: uuid.UUID, data: PaymentUpdate):
        existing = payment_repo.get_by_id(db, payment_id)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        old_bill_id = existing.bill_id
        update_data = data.model_dump(exclude_unset=True)
        if "date" in update_data and update_data["date"]:
            update_data["date"] = date.fromisoformat(update_data["date"])
        updated = payment_repo.update(db, payment_id, update_data)
        if old_bill_id:
            self._update_bill_on_payment(db, old_bill_id)
        new_bill_id = update_data.get("bill_id", old_bill_id)
        if new_bill_id and new_bill_id != old_bill_id:
            self._update_bill_on_payment(db, new_bill_id)
        return updated

    def delete_payment(self, db: Session, payment_id: uuid.UUID):
        existing = payment_repo.get_by_id(db, payment_id)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        bill_id = existing.bill_id
        payment_repo.delete(db, payment_id)
        if bill_id:
            self._update_bill_on_payment(db, bill_id)
        return True


payment_service = PaymentService()
