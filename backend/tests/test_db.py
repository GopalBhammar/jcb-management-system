import os
import sys

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.models import User, Settings

def test_database_connection():
    db = SessionLocal()
    try:
        # Check settings
        settings_rec = db.query(Settings).first()
        assert settings_rec is not None
        assert settings_rec.company_name == "JCB Rental Services Ltd"

        # Check users
        admin_user = db.query(User).filter(User.email == "admin@jcb.com").first()
        assert admin_user is not None
        assert admin_user.role == "admin"
        assert admin_user.is_active is True
        print("Integration test passed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    test_database_connection()
