"""Pydantic schemas for Customer CRUD operations."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Customer full name")
    mobile_number: Optional[str] = Field(None, max_length=20, description="Mobile number")
    village: Optional[str] = Field(None, max_length=255, description="Village name")
    address: Optional[str] = Field(None, description="Full address")
    gst_number: Optional[str] = Field(None, max_length=50, description="GST number")
    notes: Optional[str] = Field(None, description="Additional notes")


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    mobile_number: Optional[str] = Field(None, max_length=20)
    village: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    gst_number: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: uuid.UUID
    customer_id: str
    created_at: datetime
    total_billed: float = 0.0
    total_paid: float = 0.0
    outstanding: float = 0.0

    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    id: uuid.UUID
    customer_id: str
    name: str
    mobile_number: Optional[str]
    village: Optional[str]
    outstanding: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerLedgerEntry(BaseModel):
    date: datetime
    type: str  # "bill" or "payment"
    reference: str  # bill number or payment id
    description: str
    debit: float = 0.0  # bill amount
    credit: float = 0.0  # payment amount
    balance: float = 0.0
