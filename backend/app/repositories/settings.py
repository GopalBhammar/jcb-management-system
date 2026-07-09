"""Settings repository — data access for application settings."""

from typing import Optional
from sqlalchemy.orm import Session

from app.models.models import Settings
from app.repositories.base import BaseRepository


class SettingsRepository(BaseRepository):
    def __init__(self):
        super().__init__(Settings)

    def get_settings(self, db: Session) -> Optional[Settings]:
        """Get the single settings record."""
        return db.query(Settings).first()


settings_repo = SettingsRepository()
