"""Dashboard service — aggregates data from all modules for the dashboard view."""

import uuid
from typing import Optional
from datetime import date, datetime, timedelta
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.models.models import Bill, Payment, Expense, ExpenseCategory
from app.repositories.bill import bill_repo
from app.repositories.payment import payment_repo
from app.repositories.expense import expense_repo


class DashboardService:

    def get_dashboard_data(self, db: Session, owner_id: Optional[uuid.UUID] = None) -> dict:
        today = date.today()
        year = today.year
        month = today.month

        # --- Stats ---
        today_income = payment_repo.get_total_for_date(db, today, owner_id=owner_id)
        today_expense = expense_repo.get_total_for_date(db, today, owner_id=owner_id)
        monthly_income = payment_repo.get_monthly_total(db, year, month, owner_id=owner_id)
        monthly_expense = expense_repo.get_monthly_total(db, year, month, owner_id=owner_id)
        pending_amount = bill_repo.get_pending_amount(db, owner_id=owner_id)
        total_profit = monthly_income - monthly_expense

        stats = {
            "today_income": today_income,
            "today_expense": today_expense,
            "monthly_income": monthly_income,
            "monthly_expense": monthly_expense,
            "pending_amount": pending_amount,
            "total_profit": total_profit,
        }

        # --- Recent Bills (last 5) ---
        bills_query = db.query(Bill).order_by(Bill.created_at.desc())
        if owner_id:
            bills_query = bills_query.filter(Bill.owner_id == owner_id)
        recent_bills_raw = bills_query.limit(5).all()
        recent_bills = [
            {
                "bill_number": b.bill_number,
                "customer_name": b.customer.name if b.customer else "",
                "total_amount": float(b.total_amount),
                "status": b.status,
                "date": b.date.isoformat() if b.date else "",
                "site_name": b.site_name,
            }
            for b in recent_bills_raw
        ]

        # --- Recent Payments (last 5) ---
        payments_query = db.query(Payment).order_by(Payment.created_at.desc())
        if owner_id:
            payments_query = payments_query.filter(Payment.owner_id == owner_id)
        recent_payments_raw = payments_query.limit(5).all()
        recent_payments = [
            {
                "customer_name": p.customer.name if p.customer else "",
                "amount": float(p.amount),
                "payment_method": p.payment_method,
                "date": p.date.isoformat() if p.date else "",
            }
            for p in recent_payments_raw
        ]

        # --- Monthly Revenue (last 6 months) ---
        monthly_revenue = []
        for i in range(5, -1, -1):
            d = today.replace(day=1) - timedelta(days=i * 30)
            m, y = d.month, d.year
            inc = payment_repo.get_monthly_total(db, y, m, owner_id=owner_id)
            exp = expense_repo.get_monthly_total(db, y, m, owner_id=owner_id)
            month_name = d.strftime("%b %Y")
            monthly_revenue.append({"month": month_name, "income": inc, "expense": exp})

        # --- Expense Breakdown (current month) ---
        breakdown_raw = expense_repo.get_breakdown_by_category(db, year, month, owner_id=owner_id)
        expense_breakdown = [
            {"category": item["category"], "amount": item["total"]}
            for item in breakdown_raw
        ]

        # --- Profit Trend (last 6 months) ---
        profit_trend = []
        for item in monthly_revenue:
            profit_trend.append({
                "month": item["month"],
                "profit": item["income"] - item["expense"],
            })

        return {
            "stats": stats,
            "recent_bills": recent_bills,
            "recent_payments": recent_payments,
            "monthly_revenue": monthly_revenue,
            "expense_breakdown": expense_breakdown,
            "profit_trend": profit_trend,
        }


dashboard_service = DashboardService()
