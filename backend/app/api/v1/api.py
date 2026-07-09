"""API v1 router — registers all module endpoints."""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, customers, bills, payments, expenses, machines, settings, dashboard

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(bills.router, prefix="/bills", tags=["Bills"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["Expenses"])
api_router.include_router(machines.router, prefix="/machines", tags=["Machines"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
