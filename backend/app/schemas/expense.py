"""Pydantic schemas for Expense and ExpenseCategory operations."""

import uuid
from typing import Optional
from pydantic import BaseModel, Field


# --- Expense Category Schemas ---

class ExpenseCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Category name")


class ExpenseCategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    total_expenses: float = 0.0
    created_at: str = ""

    class Config:
        from_attributes = True


# --- Expense Schemas ---

class ExpenseCreate(BaseModel):
    category_id: uuid.UUID = Field(..., description="Expense category UUID")
    date: Optional[str] = Field(None, description="Expense date YYYY-MM-DD")
    amount: float = Field(..., gt=0, description="Expense amount")
    description: Optional[str] = Field(None, description="Expense description")


class ExpenseUpdate(BaseModel):
    category_id: Optional[uuid.UUID] = None
    date: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID
    category_name: str = ""
    date: str = ""
    amount: float
    description: Optional[str] = None
    receipt_url: Optional[str] = None
    created_by: uuid.UUID
    creator_name: str = ""
    created_at: str = ""

    class Config:
        from_attributes = True


class ExpenseListResponse(BaseModel):
    id: uuid.UUID
    category_name: str = ""
    date: str = ""
    amount: float
    description: Optional[str] = None
    created_at: str = ""

    class Config:
        from_attributes = True


class ExpenseSummary(BaseModel):
    category: str
    total: float
    count: int
