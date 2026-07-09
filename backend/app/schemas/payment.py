"""Pydantic schemas for Payment operations."""

import uuid
from typing import Optional
from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    bill_id: Optional[uuid.UUID] = Field(None, description="Linked bill UUID")
    customer_id: uuid.UUID = Field(..., description="Customer UUID")
    amount: float = Field(..., gt=0, description="Payment amount")
    date: Optional[str] = Field(None, description="Payment date YYYY-MM-DD")
    payment_method: str = Field("cash", description="cash, upi, bank, cheque")
    reference_number: Optional[str] = Field(None, max_length=100)
    remark: Optional[str] = Field(None)


class PaymentUpdate(BaseModel):
    bill_id: Optional[uuid.UUID] = None
    customer_id: Optional[uuid.UUID] = None
    amount: Optional[float] = Field(None, gt=0)
    date: Optional[str] = None
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    remark: Optional[str] = None


class PaymentResponse(BaseModel):
    id: uuid.UUID
    bill_id: Optional[uuid.UUID] = None
    bill_number: str = ""
    customer_id: uuid.UUID
    customer_name: str = ""
    amount: float
    date: str = ""
    payment_method: str
    reference_number: Optional[str] = None
    remark: Optional[str] = None
    received_by: uuid.UUID
    receiver_name: str = ""
    created_at: str = ""

    class Config:
        from_attributes = True


class PaymentListResponse(BaseModel):
    id: uuid.UUID
    bill_number: str = ""
    customer_name: str = ""
    amount: float
    date: str = ""
    payment_method: str
    reference_number: Optional[str] = None
    created_at: str = ""

    class Config:
        from_attributes = True
