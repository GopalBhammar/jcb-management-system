"""Bill service — business logic for bill operations including auto-calculations."""

import uuid
from typing import Optional
from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.models import Bill
from app.repositories.bill import bill_repo
from app.schemas.bill import BillCreate, BillUpdate


class BillService:

    def _calculate_bill(self, data: dict) -> dict:
        """Auto-calculate total, GST, and remaining amounts."""
        base = float(data["working_hours"]) * float(data["hourly_rate"])
        subtotal = (
            base
            + float(data.get("diesel_charge", 0))
            + float(data.get("transport_charge", 0))
            + float(data.get("other_charges", 0))
            - float(data.get("discount", 0))
        )
        gst_amount = subtotal * float(data.get("gst_percent", 0)) / 100
        total_amount = subtotal + gst_amount
        paid_amount = float(data.get("paid_amount", 0))
        remaining_amount = total_amount - paid_amount

        data["total_amount"] = round(total_amount, 2)
        data["remaining_amount"] = round(remaining_amount, 2)
        data["paid_amount"] = round(paid_amount, 2)

        if remaining_amount <= 0:
            data["status"] = "paid"
        elif paid_amount > 0:
            data["status"] = "partial"
        else:
            data["status"] = "pending"

        return data

    def _to_str(self, val):
        """Convert date/datetime to string safely."""
        if val is None:
            return ""
        return str(val)

    def list_bills(
        self, db: Session, page: int = 1, page_size: int = 20,
        search: Optional[str] = None, status_filter: Optional[str] = None,
        customer_id: Optional[uuid.UUID] = None,
        date_from: Optional[date] = None, date_to: Optional[date] = None,
        sort_by: Optional[str] = None, sort_order: str = "desc",
        owner_id: Optional[uuid.UUID] = None,
    ):
        bills, total, total_pages = bill_repo.search_bills(
            db, page=page, page_size=page_size, search=search,
            status=status_filter, customer_id=customer_id,
            date_from=date_from, date_to=date_to,
            sort_by=sort_by, sort_order=sort_order,
            owner_id=owner_id,
        )
        items = []
        for b in bills:
            items.append({
                "id": b.id,
                "bill_number": b.bill_number,
                "customer_name": b.customer.name if b.customer else "",
                "date": self._to_str(b.date),
                "machine_name": b.machine.name if b.machine else "",
                "site_name": b.site_name,
                "total_amount": float(b.total_amount),
                "paid_amount": float(b.paid_amount),
                "remaining_amount": float(b.remaining_amount),
                "status": b.status,
                "created_at": self._to_str(b.created_at),
            })
        return items, total, total_pages

    def get_bill(self, db: Session, bill_id: uuid.UUID):
        bill = bill_repo.get_with_relations(db, bill_id)
        if not bill:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")
        return {
            "id": bill.id,
            "bill_number": bill.bill_number,
            "customer_id": bill.customer_id,
            "customer_name": bill.customer.name if bill.customer else "",
            "date": self._to_str(bill.date),
            "machine_id": bill.machine_id,
            "machine_name": bill.machine.name if bill.machine else "",
            "site_name": bill.site_name,
            "working_hours": float(bill.working_hours),
            "hourly_rate": float(bill.hourly_rate),
            "diesel_charge": float(bill.diesel_charge),
            "transport_charge": float(bill.transport_charge),
            "other_charges": float(bill.other_charges),
            "discount": float(bill.discount),
            "gst_percent": float(bill.gst_percent),
            "total_amount": float(bill.total_amount),
            "paid_amount": float(bill.paid_amount),
            "remaining_amount": float(bill.remaining_amount),
            "status": bill.status,
            "created_by": bill.created_by,
            "created_at": self._to_str(bill.created_at),
        }

    def create_bill(self, db: Session, data: BillCreate, user_id: uuid.UUID):
        bill_number = bill_repo.get_next_bill_number(db, owner_id=user_id)
        obj_data = data.model_dump()
        obj_data["id"] = uuid.uuid4()
        obj_data["bill_number"] = bill_number
        obj_data["created_by"] = user_id
        obj_data["owner_id"] = user_id

        # Support paid_amount at creation (for marking as paid immediately)
        if "paid_amount" not in obj_data or obj_data["paid_amount"] is None:
            obj_data["paid_amount"] = 0.0

        # Handle date
        if obj_data.get("date"):
            obj_data["date"] = date.fromisoformat(obj_data["date"])
        else:
            obj_data["date"] = date.today()
        obj_data = self._calculate_bill(obj_data)
        return bill_repo.create(db, obj_data)

    def update_bill(self, db: Session, bill_id: uuid.UUID, data: BillUpdate):
        existing = bill_repo.get_by_id(db, bill_id)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")

        update_data = data.model_dump(exclude_unset=True)
        if "date" in update_data and update_data["date"]:
            update_data["date"] = date.fromisoformat(update_data["date"])

        calc_data = {
            "working_hours": float(update_data.get("working_hours", existing.working_hours)),
            "hourly_rate": float(update_data.get("hourly_rate", existing.hourly_rate)),
            "diesel_charge": float(update_data.get("diesel_charge", existing.diesel_charge)),
            "transport_charge": float(update_data.get("transport_charge", existing.transport_charge)),
            "other_charges": float(update_data.get("other_charges", existing.other_charges)),
            "discount": float(update_data.get("discount", existing.discount)),
            "gst_percent": float(update_data.get("gst_percent", existing.gst_percent)),
            "paid_amount": float(existing.paid_amount),
        }
        calc_data = self._calculate_bill(calc_data)
        update_data.update(calc_data)

        return bill_repo.update(db, bill_id, update_data)

    def delete_bill(self, db: Session, bill_id: uuid.UUID):
        deleted = bill_repo.delete(db, bill_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")
        return True

    def duplicate_bill(self, db: Session, bill_id: uuid.UUID, user_id: uuid.UUID):
        original = bill_repo.get_by_id(db, bill_id)
        if not original:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")

        bill_number = bill_repo.get_next_bill_number(db, owner_id=user_id)
        obj_data = {
            "id": uuid.uuid4(),
            "bill_number": bill_number,
            "customer_id": original.customer_id,
            "date": date.today(),
            "machine_id": original.machine_id,
            "site_name": original.site_name,
            "working_hours": float(original.working_hours),
            "hourly_rate": float(original.hourly_rate),
            "diesel_charge": float(original.diesel_charge),
            "transport_charge": float(original.transport_charge),
            "other_charges": float(original.other_charges),
            "discount": float(original.discount),
            "gst_percent": float(original.gst_percent),
            "created_by": user_id,
            "owner_id": user_id,
            "paid_amount": 0.0,
        }
        obj_data = self._calculate_bill(obj_data)
        return bill_repo.create(db, obj_data)


bill_service = BillService()
