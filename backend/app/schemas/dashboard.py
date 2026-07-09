"""Pydantic schemas for Dashboard aggregated data."""

from typing import List, Optional
from pydantic import BaseModel


class DashboardStats(BaseModel):
    """Top-level stat cards for the dashboard."""
    today_income: float = 0.0
    today_expense: float = 0.0
    monthly_income: float = 0.0
    monthly_expense: float = 0.0
    pending_amount: float = 0.0
    total_profit: float = 0.0


class RecentBill(BaseModel):
    bill_number: str
    customer_name: str
    total_amount: float
    status: str
    date: str


class RecentPayment(BaseModel):
    customer_name: str
    amount: float
    payment_method: str
    date: str


class MonthlyRevenue(BaseModel):
    """Monthly revenue data point for bar chart."""
    month: str
    income: float
    expense: float


class ExpenseBreakdown(BaseModel):
    """Expense breakdown by category for pie chart."""
    category: str
    amount: float


class ProfitTrend(BaseModel):
    """Monthly profit trend for line chart."""
    month: str
    profit: float


class DashboardResponse(BaseModel):
    stats: DashboardStats
    recent_bills: List[RecentBill]
    recent_payments: List[RecentPayment]
    monthly_revenue: List[MonthlyRevenue]
    expense_breakdown: List[ExpenseBreakdown]
    profit_trend: List[ProfitTrend]
