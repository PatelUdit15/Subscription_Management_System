from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, date
from app.db.base import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.quotation import Quotation, QuotationStatus
from app.models.payment import Payment
from app.models.customer import Customer
from app.models.recurring_plan import RecurringPlan

router = APIRouter()

@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get executive dashboard statistics for Brightloop finance lead
    - Total Revenue: Sum of all payments (actual cash received)
    - Active Subscriptions: Count of all 'active' subscriptions
    - Total Customers: Count of all customers
    - Monthly Growth: Count of new confirmed quotations this month
    - Total Outstanding: Sum of unpaid posted invoice balances
    - Overdue Amount & Count: Invoices past due_date that are unpaid
    - Overdue Invoices List: Details for fast chasing
    - MRR (Monthly Recurring Revenue): Active subscriptions recurring value normalized to monthly
    - Revenue by Month: Last 6 months cash received
    """
    today = date.today()

    # Total Revenue: Sum of all payments (actual cash received)
    total_revenue = db.query(func.sum(Payment.amount)).scalar() or 0.0

    # Active Subscriptions: Count of active subscriptions
    active_subscriptions = db.query(func.count(Subscription.id)).filter(
        Subscription.status == SubscriptionStatus.active
    ).scalar() or 0

    # Total Customers: Count of all customers
    total_customers = db.query(func.count(Customer.id)).scalar() or 0

    # Monthly Growth: Count of confirmed quotations this month
    current_month = datetime.now().month
    current_year = datetime.now().year

    monthly_growth = db.query(func.count(Quotation.id)).filter(
        Quotation.status == QuotationStatus.confirmed,
        extract('month', Quotation.signed_at) == current_month,
        extract('year', Quotation.signed_at) == current_year
    ).scalar() or 0

    # Calculate MRR for active subscriptions
    active_subs = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.active
    ).all()
    mrr = 0.0
    for sub in active_subs:
        amt = float(sub.recurring_amount or 0.0)
        period = "monthly"
        if sub.recurring_plan and sub.recurring_plan.billing_period:
            period = sub.recurring_plan.billing_period.lower()
        
        if period in ("yearly", "year"):
            mrr += amt / 12.0
        elif period in ("weekly", "week"):
            mrr += amt * 4.333
        elif period in ("daily", "day"):
            mrr += amt * 30.0
        else:
            mrr += amt

    # Outstanding & Overdue Invoices
    # An invoice is unpaid/outstanding if its status is posted or draft, and balance > 0
    invoices = db.query(Invoice).filter(
        Invoice.status.in_([InvoiceStatus.posted, InvoiceStatus.draft])
    ).all()

    total_outstanding = 0.0
    overdue_count = 0
    overdue_amount = 0.0
    overdue_invoices = []

    for inv in invoices:
        paid_for_inv = sum(p.amount for p in inv.payments) if inv.payments else 0.0
        balance = max(0.0, float(inv.total_amount or 0.0) - paid_for_inv)
        if balance > 0.001:
            total_outstanding += balance
            if inv.due_date and inv.due_date < today:
                overdue_count += 1
                overdue_amount += balance
                days_overdue = (today - inv.due_date).days
                overdue_invoices.append({
                    "id": inv.id,
                    "number": inv.number or f"INV-Draft-{inv.id}",
                    "customer_name": inv.customer_name,
                    "due_date": inv.due_date.isoformat(),
                    "total_amount": float(inv.total_amount or 0.0),
                    "paid_amount": float(paid_for_inv),
                    "balance": round(balance, 2),
                    "days_overdue": days_overdue,
                    "status": inv.status.value if hasattr(inv.status, "value") else str(inv.status)
                })

    # Sort overdue invoices descending by days overdue
    overdue_invoices.sort(key=lambda x: x["days_overdue"], reverse=True)

    # Revenue by Month (last 6 months) - based on actual payments
    revenue_by_month = []
    for i in range(5, -1, -1):
        target_date = datetime.now()
        target_month = target_date.month - i
        target_year = target_date.year

        while target_month <= 0:
            target_month += 12
            target_year -= 1

        month_revenue = db.query(func.sum(Payment.amount)).filter(
            extract('month', Payment.payment_date) == target_month,
            extract('year', Payment.payment_date) == target_year
        ).scalar() or 0.0

        month_name = datetime(target_year, target_month, 1).strftime('%b %Y')
        revenue_by_month.append({
            "month": month_name,
            "revenue": float(month_revenue)
        })

    return {
        "total_revenue": round(float(total_revenue), 2),
        "total_outstanding": round(total_outstanding, 2),
        "overdue_count": overdue_count,
        "overdue_amount": round(overdue_amount, 2),
        "overdue_invoices": overdue_invoices[:10],
        "mrr": round(mrr, 2),
        "active_subscriptions": active_subscriptions,
        "total_customers": total_customers,
        "monthly_growth": monthly_growth,
        "revenue_by_month": revenue_by_month
    }
