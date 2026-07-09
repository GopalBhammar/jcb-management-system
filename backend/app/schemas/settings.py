"""Pydantic schemas for application Settings."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SettingsUpdate(BaseModel):
    company_name: Optional[str] = Field(None, max_length=255)
    gst_number: Optional[str] = Field(None, max_length=50)
    invoice_prefix: Optional[str] = Field(None, max_length=20)
    default_hourly_rate: Optional[float] = Field(None, gt=0)


class SettingsResponse(BaseModel):
    id: uuid.UUID
    company_name: str
    company_logo_url: Optional[str]
    gst_number: Optional[str]
    invoice_prefix: str
    default_hourly_rate: float
    updated_at: datetime

    class Config:
        from_attributes = True
