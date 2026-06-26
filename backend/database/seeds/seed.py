import os
import sys
import uuid

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal
from app.models.models import User, Settings, ExpenseCategory, Machine
from app.core.security import get_password_hash

def seed_db():
    print("Seeding database...")
    db: Session = SessionLocal()
    try:
        # 1. Create Default Admin User
        admin_email = "admin@jcb.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                id=uuid.uuid4(),
                email=admin_email,
                hashed_password=get_password_hash("admin123"),
                full_name="System Admin",
                role="admin",
                is_active=True
            )
            db.add(admin)
            print(f"Created Admin user: {admin_email} / admin123")
        else:
            print(f"Admin user already exists: {admin_email}")

        # 2. Create Default Settings
        settings_record = db.query(Settings).first()
        if not settings_record:
            settings_record = Settings(
                id=uuid.uuid4(),
                company_name="JCB Rental Services Ltd",
                gst_number="27AAAAA1111A1Z1",
                invoice_prefix="JCB",
                default_hourly_rate=1500.00
            )
            db.add(settings_record)
            print("Created Default settings")
        else:
            print("Settings already exist")

        # 3. Create Default Expense Categories
        categories = [
            "Diesel", "Repair", "Maintenance", "Oil", "Tyre", 
            "Salary", "Food", "Transport", "Electricity", "Miscellaneous"
        ]
        for name in categories:
            cat = db.query(ExpenseCategory).filter(ExpenseCategory.name == name).first()
            if not cat:
                cat = ExpenseCategory(id=uuid.uuid4(), name=name)
                db.add(cat)
                print(f"Added expense category: {name}")
        
        # 4. Create Default Machines
        machines = ["JCB-3DX-1", "JCB-4DX-1"]
        for name in machines:
            m = db.query(Machine).filter(Machine.name == name).first()
            if not m:
                m = Machine(
                    id=uuid.uuid4(),
                    name=name,
                    plate_number="MH-12-AB-1234",
                    is_active=True
                )
                db.add(m)
                print(f"Added machine: {name}")

        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
