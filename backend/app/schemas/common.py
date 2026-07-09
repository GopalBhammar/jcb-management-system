"""Common schemas used across modules — pagination, filtering, sorting."""

from typing import Any, List, Optional
from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    """Query parameters for paginated list endpoints."""
    page: int = Field(1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(20, ge=1, le=100, description="Items per page")
    search: Optional[str] = Field(None, description="Search query string")
    sort_by: Optional[str] = Field(None, description="Field name to sort by")
    sort_order: str = Field("desc", description="Sort order: asc or desc")


class PaginatedResponse(BaseModel):
    """Standard paginated response wrapper."""
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


class MessageResponse(BaseModel):
    """Simple message response for delete/action endpoints."""
    message: str
    success: bool = True
