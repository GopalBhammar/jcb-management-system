"""Pydantic schemas for Bill management with auto-calculation support."""

import uuid
from datetime import date as DateType, datetime
from typing import Optional
from pydantic import BaseModel, Field


class BillCreate(BaseModel):
    customer_id: uuid.UUID = Field(..., description="Customer UUID")
    date: Optional[str] = Field(None, description="Bill date YYYY-MM-DD")
    machine_id: uuid.UUID = Field(..., description="Machine UUID")
    site_name: Optional[str] = Field(None, description="Site or Project Name")
    working_hours: float = Field(..., gt=0, description="Working hours")
    hourly_rate: float = Field(..., gt=0, description="Rate per hour")
    diesel_charge: float = Field(0.0, ge=0, description="Diesel charge")
    transport_charge: float = Field(0.0, ge=0, description="Transport charge")
    other_charges: float = Field(0.0, ge=0, description="Other charges")
    discount: float = Field(0.0, ge=0, description="Discount amount")
    gst_percent: float = Field(0.0, ge=0, le=100, description="GST percentage")
    paid_amount: Optional[float] = Field(None, ge=0, description="Amount already paid (set to total for paid bills)")


class BillUpdate(BaseModel):
    customer_id: Optional[uuid.UUID] = None
    date: Optional[str] = None
    machine_id: Optional[uuid.UUID] = None
    site_name: Optional[str] = None
    working_hours: Optional[float] = Field(None, gt=0)
    hourly_rate: Optional[float] = Field(None, gt=0)
    diesel_charge: Optional[float] = Field(None, ge=0)
    transport_charge: Optional[float] = Field(None, ge=0)
    other_charges: Optional[float] = Field(None, ge=0)
    discount: Optional[float] = Field(None, ge=0)
    gst_percent: Optional[float] = Field(None, ge=0, le=100)


class BillResponse(BaseModel):
    id: uuid.UUID
    bill_number: str
    customer_id: uuid.UUID
    customer_name: str = ""
    date: str = ""
    machine_id: uuid.UUID
    machine_name: str = ""
    site_name: Optional[str] = None
    working_hours: float
    hourly_rate: float
    diesel_charge: float
    transport_charge: float
    other_charges: float
    discount: float
    gst_percent: float
    total_amount: float
    paid_amount: float
    remaining_amount: float
    status: str
    created_by: uuid.UUID
    created_at: str = ""

    class Config:
        from_attributes = True


class BillListResponse(BaseModel):
    id: uuid.UUID
    bill_number: str
    customer_name: str = ""
    date: str = ""
    machine_name: str = ""
    site_name: Optional[str] = None
    total_amount: float
    paid_amount: float
    remaining_amount: float
    status: str
    created_at: str = ""

    class Config:
        from_attributes = True
