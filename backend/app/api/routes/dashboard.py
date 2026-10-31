from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from app.db.base import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.quotation import Quotation, QuotationStatus
from app.models.payment import Payment
from app.models.customer import Customer

router = APIRouter()

@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get executive dashboard statistics
    - Total Revenue: Sum of all payments (actual cash received)
    - Active Subscriptions: Count of all 'active' subscriptions
    - Total Customers: Count of all customers
    - Monthly Growth: Count of new confirmed quotations this month
    """
    
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
    
    # Revenue by Month (last 6 months) - based on actual payments
    revenue_by_month = []
    for i in range(5, -1, -1):  # Last 6 months
        target_date = datetime.now()
        target_month = target_date.month - i
        target_year = target_date.year
        
        # Handle year rollover
        while target_month <= 0:
            target_month += 12
            target_year -= 1
        
        month_revenue = db.query(func.sum(Payment.amount)).filter(
            extract('month', Payment.payment_date) == target_month,
            extract('year', Payment.payment_date) == target_year
        ).scalar() or 0.0
        
        # Month name
        month_name = datetime(target_year, target_month, 1).strftime('%b %Y')
        
        revenue_by_month.append({
            "month": month_name,
            "revenue": float(month_revenue)
        })
    
    return {
        "total_revenue": float(total_revenue),
        "active_subscriptions": active_subscriptions,
        "total_customers": total_customers,
        "monthly_growth": monthly_growth,
        "revenue_by_month": revenue_by_month
    }
