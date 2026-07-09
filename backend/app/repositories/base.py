"""Base repository with reusable CRUD operations for all entities."""

import uuid
import math
from typing import Any, Dict, List, Optional, Tuple, Type, TypeVar
from sqlalchemy import asc, desc, func, or_
from sqlalchemy.orm import Session

from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository:
    """Generic repository providing pagination, sorting, search, and CRUD."""

    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get_by_id(self, db: Session, record_id: uuid.UUID) -> Optional[ModelType]:
        return db.query(self.model).filter(self.model.id == record_id).first()

    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[ModelType]:
        return db.query(self.model).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_data: Dict[str, Any]) -> ModelType:
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, record_id: uuid.UUID, obj_data: Dict[str, Any]) -> Optional[ModelType]:
        db_obj = self.get_by_id(db, record_id)
        if not db_obj:
            return None
        for field, value in obj_data.items():
            if value is not None:
                setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, record_id: uuid.UUID) -> bool:
        db_obj = self.get_by_id(db, record_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True

    def count(self, db: Session) -> int:
        return db.query(func.count(self.model.id)).scalar() or 0

    def paginate(
        self,
        db: Session,
        page: int = 1,
        page_size: int = 20,
        filters: Optional[list] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "desc",
        search_columns: Optional[list] = None,
        search_query: Optional[str] = None,
    ) -> Tuple[List[ModelType], int, int]:
        """
        Generic paginated query with optional filtering, sorting, and search.
        Returns (items, total_count, total_pages).
        """
        query = db.query(self.model)

        # Apply filters
        if filters:
            for f in filters:
                query = query.filter(f)

        # Apply search across specified columns
        if search_query and search_columns:
            search_conditions = [
                col.ilike(f"%{search_query}%") for col in search_columns
            ]
            query = query.filter(or_(*search_conditions))

        # Get total count before pagination
        total = query.count()
        total_pages = max(1, math.ceil(total / page_size))

        # Apply sorting
        if sort_by and hasattr(self.model, sort_by):
            order_func = desc if sort_order == "desc" else asc
            query = query.order_by(order_func(getattr(self.model, sort_by)))
        elif hasattr(self.model, "created_at"):
            query = query.order_by(desc(self.model.created_at))

        # Apply pagination
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()

        return items, total, total_pages
