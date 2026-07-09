"""Pydantic schemas for Machine management."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class MachineBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Machine name/identifier")
    plate_number: Optional[str] = Field(None, max_length=50, description="Vehicle plate number")
    is_active: bool = Field(True, description="Whether machine is active")


class MachineCreate(MachineBase):
    pass


class MachineUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    plate_number: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class MachineResponse(BaseModel):
    id: uuid.UUID
    name: str
    plate_number: Optional[str]
    is_active: bool
    total_bills: int = 0
    total_revenue: float = 0.0
    total_hours: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True
