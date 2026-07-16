"""Machine repository — data access for machine operations."""

import uuid
from typing import Optional, List
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import Machine, Bill
from app.repositories.base import BaseRepository


class MachineRepository(BaseRepository):
    def __init__(self):
        super().__init__(Machine)

    def get_by_name(self, db: Session, name: str) -> Optional[Machine]:
        return db.query(Machine).filter(Machine.name == name).first()

    def get_all_with_stats(self, db: Session, owner_id: uuid.UUID = None) -> List[dict]:
        """Return all machines with their operational stats."""
        query = (
            db.query(
                Machine.id,
                Machine.name,
                Machine.plate_number,
                Machine.is_active,
                Machine.created_at,
                func.count(Bill.id).label("total_bills"),
                func.coalesce(func.sum(Bill.total_amount), 0).label("total_revenue"),
                func.coalesce(func.sum(Bill.working_hours), 0).label("total_hours"),
            )
            .outerjoin(Bill, Bill.machine_id == Machine.id)
        )
        if owner_id:
            query = query.filter(Machine.owner_id == owner_id)
        results = (
            query
            .group_by(Machine.id, Machine.name, Machine.plate_number, Machine.is_active, Machine.created_at)
            .all()
        )
        return [
            {
                "id": r.id,
                "name": r.name,
                "plate_number": r.plate_number,
                "is_active": r.is_active,
                "created_at": r.created_at,
                "total_bills": r.total_bills,
                "total_revenue": float(r.total_revenue),
                "total_hours": float(r.total_hours),
            }
            for r in results
        ]


machine_repo = MachineRepository()
