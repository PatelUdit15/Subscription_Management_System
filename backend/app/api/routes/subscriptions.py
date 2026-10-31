from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, timedelta
from dateutil.relativedelta import relativedelta
from pydantic import BaseModel
import secrets

from app.db.base import get_db
from app.api.routes.auth import get_current_user
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.subscription_line import SubscriptionLine
from app.models.customer import Customer
from app.models.product import Product
from app.models.recurring_plan import RecurringPlan
from app.models.invoice import Invoice, InvoiceStatus
from app.models.invoice_line import InvoiceLine
from app.models.tax import Tax
from app.models.discount import Discount

router = APIRouter()

# Schemas
class SubscriptionLineCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    description: Optional[str] = None
    quantity: float = 1.0
    unit_price: float
    discount: float = 0.0
    tax_rate: float = 0.0

class SubscriptionCreate(BaseModel):
    customer_id: int
    product_id: int
    recurring_plan_id: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    lines: List[SubscriptionLineCreate] = []

class SubscriptionUpdate(BaseModel):
    customer_id: Optional[int] = None
    status: Optional[SubscriptionStatus] = None
    start_date: Optional[date] = None
    next_billing_date: Optional[date] = None
    end_date: Optional[date] = None
    recurring_amount: Optional[float] = None
    payment_done: Optional[bool] = None

class BillingDayRequest(BaseModel):
    target_date: Optional[date] = None

def generate_subscription_number(db: Session) -> str:
    """Generate subscription number: S0001, S0002, etc."""
    last_sub = db.query(Subscription).filter(
        Subscription.number.isnot(None)
    ).order_by(Subscription.id.desc()).first()
    
    if last_sub and last_sub.number and last_sub.number.startswith('S'):
        try:
            last_num = int(last_sub.number.replace('S', ''))
            return f"S{last_num + 1:04d}"
        except Exception:
            pass
    count = db.query(Subscription).count() + 1
    return f"S{count:04d}"

def generate_invoice_number_helper(db: Session) -> str:
    """Generate sequential invoice number: INV/YYYY/NNNN"""
    year = datetime.now().year
    prefix = f"INV/{year}/"
    last_inv = db.query(Invoice).filter(
        Invoice.number.like(f"{prefix}%")
    ).order_by(Invoice.id.desc()).first()
    
    if last_inv and last_inv.number:
        try:
            num = int(last_inv.number.split('/')[-1])
            return f"{prefix}{num + 1:04d}"
        except Exception:
            pass
    count = db.query(Invoice).count() + 1
    return f"{prefix}{count:04d}"

def advance_billing_date(start_date: date, billing_period: str) -> date:
    period = str(billing_period).lower().replace('billingperiod.', '')
    if period in ('daily', 'day', 'days'):
        return start_date + timedelta(days=1)
    elif period in ('weekly', 'weeks', 'week'):
        return start_date + timedelta(weeks=1)
    elif period in ('monthly', 'month', 'months'):
        return start_date + relativedelta(months=1)
    elif period in ('yearly', 'year', 'years'):
        return start_date + relativedelta(years=1)
    return start_date + relativedelta(months=1)

@router.get("/subscriptions")
def get_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all subscriptions"""
    subscriptions = db.query(Subscription).order_by(Subscription.id.desc()).all()
    
    result = []
    for sub in subscriptions:
        customer = db.query(Customer).filter(Customer.id == sub.customer_id).first()
        plan = db.query(RecurringPlan).filter(RecurringPlan.id == sub.recurring_plan_id).first()
        
        result.append({
            "id": sub.id,
            "number": sub.number,
            "customer_id": sub.customer_id,
            "customer_name": customer.name if customer else "N/A",
            "product_id": sub.product_id,
            "recurring_plan_id": sub.recurring_plan_id,
            "plan_name": plan.name if plan else "N/A",
            "start_date": sub.start_date.isoformat() if sub.start_date else None,
            "next_billing_date": sub.next_billing_date.isoformat() if sub.next_billing_date else None,
            "end_date": sub.end_date.isoformat() if sub.end_date else None,
            "status": sub.status.value,
            "recurring_amount": sub.recurring_amount,
            "payment_done": sub.payment_done,
            "created_at": sub.created_at.isoformat() if sub.created_at else None
        })
    
    return result

@router.get("/subscriptions/{subscription_id}")
def get_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get subscription by ID"""
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    customer = db.query(Customer).filter(Customer.id == subscription.customer_id).first()
    product = db.query(Product).filter(Product.id == subscription.product_id).first()
    plan = db.query(RecurringPlan).filter(RecurringPlan.id == subscription.recurring_plan_id).first()
    lines = db.query(SubscriptionLine).filter(SubscriptionLine.subscription_id == subscription.id).all()
    
    return {
        "id": subscription.id,
        "number": subscription.number,
        "customer_id": subscription.customer_id,
        "customer_name": customer.name if customer else "N/A",
        "product_id": subscription.product_id,
        "product_name": product.name if product else "N/A",
        "recurring_plan_id": subscription.recurring_plan_id,
        "plan_name": plan.name if plan else "N/A",
        "plan_details": {
            "billing_period": plan.billing_period.value if plan else None,
            "is_closable": getattr(plan, 'is_closable', True) if plan else True,
            "is_pausable": getattr(plan, 'is_pausable', True) if plan else True,
            "can_renew": getattr(plan, 'can_renew', True) if plan else True
        } if plan else None,
        "start_date": subscription.start_date.isoformat() if subscription.start_date else None,
        "next_billing_date": subscription.next_billing_date.isoformat() if subscription.next_billing_date else None,
        "end_date": subscription.end_date.isoformat() if subscription.end_date else None,
        "status": subscription.status.value,
        "recurring_amount": subscription.recurring_amount,
        "payment_done": subscription.payment_done,
        "created_at": subscription.created_at.isoformat() if subscription.created_at else None,
        "lines": [
            {
                "id": line.id,
                "product_id": line.product_id,
                "variant_id": line.variant_id,
                "description": line.description,
                "quantity": line.quantity,
                "unit_price": line.unit_price,
                "discount": line.discount,
                "tax_rate": line.tax_rate,
                "subtotal": line.subtotal
            }
            for line in lines
        ]
    }

@router.post("/subscriptions")
def create_subscription(
    subscription_data: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new subscription"""
    start_d = subscription_data.start_date or date.today()
    plan = db.query(RecurringPlan).filter(RecurringPlan.id == subscription_data.recurring_plan_id).first()
    period = plan.billing_period.value if plan else "monthly"
    next_billing = advance_billing_date(start_d, period)
    
    subscription = Subscription(
        customer_id=subscription_data.customer_id,
        product_id=subscription_data.product_id,
        recurring_plan_id=subscription_data.recurring_plan_id,
        start_date=start_d,
        next_billing_date=next_billing,
        end_date=subscription_data.end_date,
        status=SubscriptionStatus.draft,
        created_at=datetime.utcnow()
    )
    
    db.add(subscription)
    db.flush()
    
    total_amount = 0.0
    for line_data in subscription_data.lines:
        line_base = (line_data.quantity * line_data.unit_price) - line_data.discount
        subtotal = max(0.0, line_base + (line_base * (line_data.tax_rate / 100)))
        
        line = SubscriptionLine(
            subscription_id=subscription.id,
            product_id=line_data.product_id,
            variant_id=line_data.variant_id,
            description=line_data.description,
            quantity=line_data.quantity,
            unit_price=line_data.unit_price,
            discount=line_data.discount,
            tax_rate=line_data.tax_rate,
            subtotal=subtotal
        )
        db.add(line)
        total_amount += subtotal
    
    subscription.recurring_amount = total_amount
    db.commit()
    db.refresh(subscription)
    
    return {"id": subscription.id, "status": subscription.status.value, "recurring_amount": subscription.recurring_amount}

@router.put("/subscriptions/{subscription_id}")
def update_subscription(
    subscription_id: int,
    subscription_data: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update subscription attributes"""
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if subscription_data.customer_id is not None:
        subscription.customer_id = subscription_data.customer_id
    if subscription_data.status is not None:
        subscription.status = subscription_data.status
    if subscription_data.start_date is not None:
        subscription.start_date = subscription_data.start_date
    if subscription_data.next_billing_date is not None:
        subscription.next_billing_date = subscription_data.next_billing_date
    if subscription_data.end_date is not None:
        subscription.end_date = subscription_data.end_date
    if subscription_data.recurring_amount is not None:
        subscription.recurring_amount = subscription_data.recurring_amount
    if subscription_data.payment_done is not None:
        subscription.payment_done = subscription_data.payment_done
    
    db.commit()
    db.refresh(subscription)
    return {"id": subscription.id, "status": subscription.status.value}

@router.post("/subscriptions/{subscription_id}/confirm")
def confirm_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Confirm subscription and generate official sequence number"""
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if not subscription.number:
        subscription.number = generate_subscription_number(db)
    
    if not subscription.start_date:
        subscription.start_date = date.today()
        
    if not subscription.next_billing_date:
        plan = db.query(RecurringPlan).filter(RecurringPlan.id == subscription.recurring_plan_id).first()
        period = plan.billing_period.value if plan else "monthly"
        subscription.next_billing_date = advance_billing_date(subscription.start_date, period)
    
    subscription.status = SubscriptionStatus.active
    
    db.commit()
    db.refresh(subscription)
    
    return {
        "id": subscription.id,
        "number": subscription.number,
        "status": subscription.status.value,
        "start_date": subscription.start_date.isoformat(),
        "next_billing_date": subscription.next_billing_date.isoformat() if subscription.next_billing_date else None,
        "share_token": subscription.share_token
    }

@router.post("/subscriptions/{subscription_id}/pause")
def pause_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Pause an active subscription if plan permits"""
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    plan = db.query(RecurringPlan).filter(RecurringPlan.id == subscription.recurring_plan_id).first()
    if plan and not getattr(plan, 'is_pausable', True):
        raise HTTPException(status_code=400, detail="This recurring plan does not permit pausing")
    
    subscription.status = SubscriptionStatus.paused
    db.commit()
    db.refresh(subscription)
    return {"id": subscription.id, "status": subscription.status.value, "message": "Subscription paused successfully"}

@router.post("/subscriptions/{subscription_id}/resume")
def resume_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Resume a paused subscription"""
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    subscription.status = SubscriptionStatus.active
    db.commit()
    db.refresh(subscription)
    return {"id": subscription.id, "status": subscription.status.value, "message": "Subscription resumed successfully"}

@router.post("/subscriptions/{subscription_id}/close")
def close_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Close / cancel a subscription early if plan permits"""
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    plan = db.query(RecurringPlan).filter(RecurringPlan.id == subscription.recurring_plan_id).first()
    if plan and not getattr(plan, 'is_closable', True):
        raise HTTPException(status_code=400, detail="This recurring plan cannot be closed early")
    
    subscription.status = SubscriptionStatus.closed
    subscription.end_date = date.today()
    db.commit()
    db.refresh(subscription)
    return {"id": subscription.id, "status": subscription.status.value, "message": "Subscription closed successfully"}

@router.post("/subscriptions/{subscription_id}/create-invoice")
def create_invoice_from_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create an invoice from a subscription (active or confirmed)"""
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    customer = db.query(Customer).filter(Customer.id == subscription.customer_id).first()
    customer_name = customer.name if customer else "Subscription Customer"
    
    invoice_number = generate_invoice_number_helper(db)
    today = date.today()
    
    invoice = Invoice(
        number=invoice_number,
        subscription_id=subscription.id,
        customer_name=customer_name,
        date_issued=today,
        due_date=today + timedelta(days=30),
        total_amount=0.0,
        status=InvoiceStatus.posted,
        notes=f"Invoice for subscription {subscription.number or subscription.id}"
    )
    db.add(invoice)
    db.flush()
    
    subscription_lines = db.query(SubscriptionLine).filter(
        SubscriptionLine.subscription_id == subscription.id
    ).all()
    
    default_tax = db.query(Tax).filter(Tax.is_active == True).first()
    default_rate = default_tax.value if default_tax else 18.0
    default_tax_id = default_tax.id if default_tax else None

    total_amount = 0.0
    if not subscription_lines:
        unit_price = subscription.recurring_amount or 0.0
        tax_amount = round(unit_price * (default_rate / 100.0), 2)
        line = InvoiceLine(
            invoice_id=invoice.id,
            product_id=subscription.product_id,
            variant_id=None,
            quantity=1.0,
            unit_price=unit_price,
            tax_rate=default_rate,
            tax_id=default_tax_id,
            price_subtotal=unit_price
        )
        db.add(line)
        total_amount = unit_price + tax_amount
    else:
        for sub_line in subscription_lines:
            rate = getattr(sub_line, 'tax_rate', 0.0) or default_rate
            line_subtotal = sub_line.subtotal or (sub_line.quantity * sub_line.unit_price)
            tax_amount = round(line_subtotal * (rate / 100.0), 2)
            line = InvoiceLine(
                invoice_id=invoice.id,
                product_id=sub_line.product_id,
                variant_id=getattr(sub_line, 'variant_id', None),
                description=getattr(sub_line, 'description', None),
                quantity=sub_line.quantity,
                unit_price=sub_line.unit_price,
                tax_rate=rate,
                tax_id=default_tax_id,
                price_subtotal=line_subtotal
            )
            db.add(line)
            total_amount += (line_subtotal + tax_amount)
    
    invoice.total_amount = round(total_amount, 2)
    
    # Advance billing date if present
    plan = db.query(RecurringPlan).filter(RecurringPlan.id == subscription.recurring_plan_id).first()
    period = plan.billing_period.value if plan else "monthly"
    subscription.next_billing_date = advance_billing_date(subscription.next_billing_date or today, period)
    subscription.status = SubscriptionStatus.active
    
    db.commit()
    db.refresh(invoice)
    
    return {
        "id": invoice.id,
        "invoice_number": invoice.number,
        "amount": invoice.total_amount,
        "status": invoice.status.value,
        "date_issued": invoice.date_issued.isoformat(),
        "due_date": invoice.due_date.isoformat(),
        "next_billing_date": subscription.next_billing_date.isoformat()
    }

@router.post("/subscriptions/run-billing-day")
def run_billing_day(
    req: BillingDayRequest = BillingDayRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Billing Day Engine (Scene 4):
    Automatically creates invoices for all subscriptions due on or before target_date.
    Ensures:
    - No double-billing (idempotent per billing day).
    - Prepopulates customer, product lines, taxes, and amounts.
    - Automatically advances next_billing_date.
    - Automatically auto-closes subscriptions if plan.auto_close is set and end_date reached.
    """
    billing_day = req.target_date or date.today()
    
    # Query subscriptions that are active or confirmed
    subscriptions = db.query(Subscription).filter(
        Subscription.status.in_([SubscriptionStatus.active, SubscriptionStatus.confirmed])
    ).all()
    
    invoices_created = []
    skipped_count = 0
    closed_count = 0
    
    for sub in subscriptions:
        sub_due_date = sub.next_billing_date or sub.start_date or billing_day
        if sub_due_date > billing_day:
            continue
        
        # Check idempotency: avoid duplicate invoice on the same day for this subscription
        existing_invoice = db.query(Invoice).filter(
            Invoice.subscription_id == sub.id,
            Invoice.date_issued == billing_day
        ).first()
        
        if existing_invoice:
            skipped_count += 1
            continue
        
        customer = db.query(Customer).filter(Customer.id == sub.customer_id).first()
        customer_name = customer.name if customer else "Subscription Customer"
        
        invoice_number = generate_invoice_number_helper(db)
        invoice = Invoice(
            number=invoice_number,
            subscription_id=sub.id,
            customer_name=customer_name,
            date_issued=billing_day,
            due_date=billing_day + timedelta(days=30),
            total_amount=0.0,
            status=InvoiceStatus.posted,
            notes=f"Automated Billing Day Invoice for {sub.number or ('Sub #' + str(sub.id))}"
        )
        db.add(invoice)
        db.flush()
        
        sub_lines = db.query(SubscriptionLine).filter(SubscriptionLine.subscription_id == sub.id).all()
        default_tax = db.query(Tax).filter(Tax.is_active == True).first()
        default_rate = default_tax.value if default_tax else 18.0
        default_tax_id = default_tax.id if default_tax else None
        total_amount = 0.0
        
        if not sub_lines:
            price = sub.recurring_amount or 0.0
            tax_amount = round(price * (default_rate / 100.0), 2)
            line = InvoiceLine(
                invoice_id=invoice.id,
                product_id=sub.product_id,
                quantity=1.0,
                unit_price=price,
                tax_rate=default_rate,
                tax_id=default_tax_id,
                price_subtotal=price
            )
            db.add(line)
            total_amount = price + tax_amount
        else:
            for sline in sub_lines:
                rate = getattr(sline, 'tax_rate', 0.0) or default_rate
                line_sub = sline.subtotal or (sline.quantity * sline.unit_price)
                tax_amount = round(line_sub * (rate / 100.0), 2)
                line = InvoiceLine(
                    invoice_id=invoice.id,
                    product_id=sline.product_id,
                    variant_id=getattr(sline, 'variant_id', None),
                    description=getattr(sline, 'description', None),
                    quantity=sline.quantity,
                    unit_price=sline.unit_price,
                    tax_rate=rate,
                    tax_id=default_tax_id,
                    price_subtotal=line_sub
                )
                db.add(line)
                total_amount += (line_sub + tax_amount)
        
        invoice.total_amount = round(total_amount, 2)
        
        # Advance next billing date
        plan = db.query(RecurringPlan).filter(RecurringPlan.id == sub.recurring_plan_id).first()
        period = plan.billing_period.value if plan else "monthly"
        sub.next_billing_date = advance_billing_date(sub_due_date, period)
        sub.status = SubscriptionStatus.active
        
        # Handle auto-close
        if plan and getattr(plan, 'auto_close', False) and sub.end_date and sub.end_date <= billing_day:
            sub.status = SubscriptionStatus.closed
            closed_count += 1
            
        invoices_created.append({
            "invoice_id": invoice.id,
            "invoice_number": invoice.number,
            "subscription_id": sub.id,
            "subscription_number": sub.number,
            "customer_name": customer_name,
            "amount": invoice.total_amount
        })
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Billing day run complete. {len(invoices_created)} invoices generated.",
        "billing_date": billing_day.isoformat(),
        "invoices_count": len(invoices_created),
        "invoices_created": len(invoices_created),
        "subscriptions_closed": closed_count,
        "skipped_count": skipped_count,
        "auto_closed_count": closed_count,
        "invoices": invoices_created
    }

@router.post("/subscriptions/{subscription_id}/renew")
def renew_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Renew subscription for the next billing cycle"""
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    plan = db.query(RecurringPlan).filter(RecurringPlan.id == subscription.recurring_plan_id).first()
    if plan and not getattr(plan, 'can_renew', True):
        raise HTTPException(status_code=400, detail="This recurring plan does not permit renewal")
    
    period = plan.billing_period.value if plan else "monthly"
    base_date = subscription.next_billing_date or date.today()
    new_billing_date = advance_billing_date(base_date, period)
    
    subscription.next_billing_date = new_billing_date
    if subscription.end_date:
        subscription.end_date = advance_billing_date(subscription.end_date, period)
    subscription.status = SubscriptionStatus.active
    
    db.commit()
    db.refresh(subscription)
    
    return {
        "id": subscription.id,
        "status": subscription.status.value,
        "next_billing_date": subscription.next_billing_date.isoformat(),
        "message": "Subscription renewed successfully"
    }

@router.post("/subscriptions/{subscription_id}/upsell")
def upsell_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create draft upsell order based on an existing subscription"""
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    upsell_sub = Subscription(
        customer_id=subscription.customer_id,
        product_id=subscription.product_id,
        recurring_plan_id=subscription.recurring_plan_id,
        start_date=date.today(),
        next_billing_date=subscription.next_billing_date,
        end_date=subscription.end_date,
        status=SubscriptionStatus.draft,
        recurring_amount=subscription.recurring_amount,
        created_at=datetime.utcnow()
    )
    db.add(upsell_sub)
    db.flush()
    
    original_lines = db.query(SubscriptionLine).filter(
        SubscriptionLine.subscription_id == subscription_id
    ).all()
    
    for orig_line in original_lines:
        new_line = SubscriptionLine(
            subscription_id=upsell_sub.id,
            product_id=orig_line.product_id,
            variant_id=getattr(orig_line, 'variant_id', None),
            description=getattr(orig_line, 'description', None),
            quantity=orig_line.quantity,
            unit_price=orig_line.unit_price,
            discount=getattr(orig_line, 'discount', 0.0),
            tax_rate=getattr(orig_line, 'tax_rate', 0.0),
            subtotal=orig_line.subtotal
        )
        db.add(new_line)
    
    db.commit()
    db.refresh(upsell_sub)
    
    return {
        "id": upsell_sub.id,
        "original_subscription_id": subscription.id,
        "status": upsell_sub.status.value,
        "message": "Upsell draft created successfully. Modify products or plans as needed."
    }

@router.delete("/subscriptions/{subscription_id}")
def delete_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete subscription"""
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    db.delete(subscription)
    db.commit()
    return {"message": "Subscription deleted successfully"}
