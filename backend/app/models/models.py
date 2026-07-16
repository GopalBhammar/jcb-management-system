"""SQLAlchemy models — all database entities for the JCB Management System."""

import uuid
from datetime import datetime, date as date_type, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Date, Numeric, Text, ForeignKey, Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base


def _utcnow():
    """Helper to get current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="operator", nullable=False) # admin or operator
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    # Relationships
    bills_created = relationship("Bill", back_populates="creator", foreign_keys="[Bill.created_by]")
    payments_received = relationship("Payment", back_populates="receiver", foreign_keys="[Payment.received_by]")
    expenses_created = relationship("Expense", back_populates="creator", foreign_keys="[Expense.created_by]")
    activity_logs = relationship("ActivityLog", back_populates="user")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    customer_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. CUST-0001
    name = Column(String(255), nullable=False)
    mobile_number = Column(String(20), nullable=True)
    village = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    gst_number = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    # Relationships
    bills = relationship("Bill", back_populates="customer", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="customer", cascade="all, delete-orphan")


class Machine(Base):
    __tablename__ = "machines"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False) # e.g. JCB-3DX-1
    plate_number = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    # Relationships
    bills = relationship("Bill", back_populates="machine")


class ExpenseCategory(Base):
    __tablename__ = "expense_categories"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False) # e.g. Diesel, Maintenance
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    # Relationships
    expenses = relationship("Expense", back_populates="category")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    category_id = Column(Uuid(as_uuid=True), ForeignKey("expense_categories.id"), nullable=False)
    date = Column(Date, default=date_type.today, nullable=False)
    amount = Column(Numeric(precision=10, scale=2), nullable=False)
    description = Column(Text, nullable=True)
    receipt_url = Column(String(512), nullable=True)
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    # Relationships
    category = relationship("ExpenseCategory", back_populates="expenses")
    creator = relationship("User", back_populates="expenses_created", foreign_keys=[created_by])


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    bill_number = Column(String(50), unique=True, index=True, nullable=False) # e.g. INV-0001
    customer_id = Column(Uuid(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    date = Column(Date, default=date_type.today, nullable=False)
    machine_id = Column(Uuid(as_uuid=True), ForeignKey("machines.id"), nullable=False)
    site_name = Column(String(255), nullable=True)
    working_hours = Column(Numeric(precision=8, scale=2), nullable=False)
    hourly_rate = Column(Numeric(precision=10, scale=2), nullable=False)
    diesel_charge = Column(Numeric(precision=10, scale=2), default=0.00, nullable=False)
    transport_charge = Column(Numeric(precision=10, scale=2), default=0.00, nullable=False)
    other_charges = Column(Numeric(precision=10, scale=2), default=0.00, nullable=False)
    discount = Column(Numeric(precision=10, scale=2), default=0.00, nullable=False)
    gst_percent = Column(Numeric(precision=5, scale=2), default=0.00, nullable=False)
    total_amount = Column(Numeric(precision=12, scale=2), nullable=False)
    paid_amount = Column(Numeric(precision=12, scale=2), default=0.00, nullable=False)
    remaining_amount = Column(Numeric(precision=12, scale=2), nullable=False)
    status = Column(String(50), default="pending", nullable=False) # pending, partial, paid
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="bills")
    machine = relationship("Machine", back_populates="bills")
    creator = relationship("User", back_populates="bills_created", foreign_keys=[created_by])
    payments = relationship("Payment", back_populates="bill", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    bill_id = Column(Uuid(as_uuid=True), ForeignKey("bills.id"), nullable=True) # can be null if advance/general payment
    customer_id = Column(Uuid(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    amount = Column(Numeric(precision=12, scale=2), nullable=False)
    date = Column(Date, default=date_type.today, nullable=False)
    payment_method = Column(String(50), default="cash", nullable=False) # cash, upi, bank, cheque
    reference_number = Column(String(100), nullable=True)
    remark = Column(Text, nullable=True)
    received_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    # Relationships
    bill = relationship("Bill", back_populates="payments")
    customer = relationship("Customer", back_populates="payments")
    receiver = relationship("User", back_populates="payments_received", foreign_keys=[received_by])


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = Column(String(255), default="JCB Rental Services", nullable=False)
    company_logo_url = Column(String(512), nullable=True)
    gst_number = Column(String(50), nullable=True)
    invoice_prefix = Column(String(20), default="INV", nullable=False)
    default_hourly_rate = Column(Numeric(precision=10, scale=2), default=1500.00, nullable=False)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False) # create, update, delete, login
    table_name = Column(String(100), nullable=True)
    record_id = Column(Uuid(as_uuid=True), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="activity_logs")
