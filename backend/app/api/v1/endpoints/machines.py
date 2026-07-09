"""Machine API endpoints — CRUD with operational stats."""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.models import User
from app.schemas.common import MessageResponse
from app.schemas.machine import MachineCreate, MachineUpdate, MachineResponse
from app.repositories.machine import machine_repo

router = APIRouter()


@router.get("", response_model=List[MachineResponse])
def list_machines(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return machine_repo.get_all_with_stats(db)


@router.post("", response_model=MachineResponse, status_code=201)
def create_machine(
    data: MachineCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    existing = machine_repo.get_by_name(db, data.name)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Machine with this name already exists")
    obj = machine_repo.create(db, {"id": uuid.uuid4(), **data.model_dump()})
    return {
        "id": obj.id, "name": obj.name, "plate_number": obj.plate_number,
        "is_active": obj.is_active, "created_at": obj.created_at,
        "total_bills": 0, "total_revenue": 0.0, "total_hours": 0.0,
    }


@router.put("/{machine_id}", response_model=MachineResponse)
def update_machine(
    machine_id: uuid.UUID,
    data: MachineUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    update_data = data.model_dump(exclude_unset=True)
    updated = machine_repo.update(db, machine_id, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Machine not found")
    # Get fresh data with stats
    all_machines = machine_repo.get_all_with_stats(db)
    for m in all_machines:
        if m["id"] == machine_id:
            return m
    return updated


@router.delete("/{machine_id}", response_model=MessageResponse)
def delete_machine(
    machine_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    deleted = machine_repo.delete(db, machine_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Machine not found")
    return {"message": "Machine deleted successfully", "success": True}
