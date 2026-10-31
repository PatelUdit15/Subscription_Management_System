from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from pydantic import BaseModel
from app.db.base import get_db
from app.api.routes.auth import get_current_user
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.subscription_line import SubscriptionLine
from app.models.customer import Customer
from app.models.product import Product
from app.models.recurring_plan import RecurringPlan

router = APIRouter()

# Schemas
class SubscriptionLineCreate(BaseModel):
    product_id: int
    variant_id: int = None
    description: str = None
    quantity: float
    unit_price: float
    discount: float = 0.0
    tax_rate: float = 0.0

class SubscriptionCreate(BaseModel):
    customer_id: int
    product_id: int
    recurring_plan_id: int
    start_date: date = None
    lines: List[SubscriptionLineCreate] = []

class SubscriptionUpdate(BaseModel):
    customer_id: int = None
    status: SubscriptionStatus = None
    start_date: date = None
    next_billing_date: date = None
    recurring_amount: float = None
    payment_done: bool = None

def generate_subscription_number(db: Session) -> str:
    """Generate subscription number: S0001, S0002, etc."""
    last_subscription = db.query(Subscription).filter(
        Subscription.number.isnot(None)
    ).order_by(Subscription.number.desc()).first()
    
    if last_subscription and last_subscription.number:
        try:
            last_number = int(last_subscription.number[1:])  # Remove 'S' prefix
            new_number = last_number + 1
        except:
            new_number = 1
    else:
        new_number = 1
    
    return f"S{new_number:04d}"

@router.get("/subscriptions")
def get_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all subscriptions"""
    subscriptions = db.query(Subscription).all()
    
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
            "status": sub.status.value,
            "recurring_amount": sub.recurring_amount,
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
    
    # Get related data
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
        "start_date": subscription.start_date.isoformat() if subscription.start_date else None,
        "next_billing_date": subscription.next_billing_date.isoformat() if subscription.next_billing_date else None,
        "status": subscription.status.value,
        "recurring_amount": subscription.recurring_amount,
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
    # Create subscription
    subscription = Subscription(
        customer_id=subscription_data.customer_id,
        product_id=subscription_data.product_id,
        recurring_plan_id=subscription_data.recurring_plan_id,
        start_date=subscription_data.start_date,
        status=SubscriptionStatus.draft,
        created_at=datetime.utcnow()
    )
    
    db.add(subscription)
    db.flush()
    
    # Create subscription lines
    total_amount = 0.0
    for line_data in subscription_data.lines:
        subtotal = (line_data.quantity * line_data.unit_price) - line_data.discount
        subtotal += subtotal * (line_data.tax_rate / 100)
        
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
    
    return {"id": subscription.id, "status": subscription.status.value}

@router.put("/subscriptions/{subscription_id}")
def update_subscription(
    subscription_id: int,
    subscription_data: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update subscription"""
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
    """Confirm subscription and generate number"""
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Generate subscription number
    if not subscription.number:
        subscription.number = generate_subscription_number(db)
    
    # Set start date to today if not set
    if not subscription.start_date:
        subscription.start_date = date.today()
    
    # Update status
    subscription.status = SubscriptionStatus.confirmed
    
    db.commit()
    db.refresh(subscription)
    
    return {
        "id": subscription.id,
        "number": subscription.number,
        "status": subscription.status.value,
        "start_date": subscription.start_date.isoformat(),
        "share_token": subscription.share_token
    }

@router.post("/subscriptions/{subscription_id}/generate-share-link")
def generate_share_link(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a unique share link for the subscription"""
    import secrets
    
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Generate unique token if not exists
    if not subscription.share_token:
        subscription.share_token = secrets.token_urlsafe(32)
        db.commit()
        db.refresh(subscription)
    
    return {
        "share_token": subscription.share_token,
        "share_url": f"/share/subscription/{subscription.share_token}"
    }

@router.get("/share/subscription/{share_token}")
def get_shared_subscription(
    share_token: str,
    db: Session = Depends(get_db)
):
    """Get subscription by share token (public access)"""
    subscription = db.query(Subscription).filter(Subscription.share_token == share_token).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Get related data
    customer = db.query(Customer).filter(Customer.id == subscription.customer_id).first()
    product = db.query(Product).filter(Product.id == subscription.product_id).first()
    plan = db.query(RecurringPlan).filter(RecurringPlan.id == subscription.recurring_plan_id).first()
    lines = db.query(SubscriptionLine).filter(SubscriptionLine.subscription_id == subscription.id).all()
    
    return {
        "id": subscription.id,
        "number": subscription.number,
        "customer_name": customer.name if customer else "N/A",
        "product_name": product.name if product else "N/A",
        "plan_name": plan.name if plan else "N/A",
        "start_date": subscription.start_date.isoformat() if subscription.start_date else None,
        "status": subscription.status.value,
        "recurring_amount": subscription.recurring_amount,
        "signature_data": subscription.signature_data,
        "signed_by": subscription.signed_by,
        "signed_at": subscription.signed_at.isoformat() if subscription.signed_at else None,
        "lines": [
            {
                "product_id": line.product_id,
                "quantity": line.quantity,
                "unit_price": line.unit_price,
                "subtotal": line.subtotal
            }
            for line in lines
        ]
    }

@router.post("/subscriptions/{subscription_id}/sign")
def sign_subscription(
    subscription_id: int,
    signature_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add digital signature to subscription"""
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if subscription.status != SubscriptionStatus.sent:
        raise HTTPException(status_code=400, detail="Only sent subscriptions can be signed")
    
    # Save signature data
    subscription.signature_data = signature_data.get("signature_data")
    subscription.signed_by = signature_data.get("signed_by")
    subscription.signed_at = datetime.utcnow()
    subscription.status = SubscriptionStatus.confirmed
    
    # Generate subscription number if not exists
    if not subscription.number:
        subscription.number = generate_subscription_number(db)
    
    # Set start date to today if not set
    if not subscription.start_date:
        subscription.start_date = date.today()
    
    db.commit()
    db.refresh(subscription)
    
    return {
        "id": subscription.id,
        "number": subscription.number,
        "status": subscription.status.value,
        "signed_by": subscription.signed_by,
        "signed_at": subscription.signed_at.isoformat()
    }

@router.post("/subscriptions/{subscription_id}/create-invoice")
def create_invoice_from_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create an invoice from a confirmed subscription"""
    from app.models.invoice import Invoice, InvoiceStatus
    from app.models.invoice_line import InvoiceLine
    from datetime import timedelta
    
    try:
        # Validate subscription exists
        subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        # Validate subscription is confirmed
        if subscription.status != SubscriptionStatus.confirmed:
            raise HTTPException(status_code=400, detail="Subscription must be confirmed before creating invoice")
        
        # Get customer info
        customer = db.query(Customer).filter(Customer.id == subscription.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Generate invoice number
        last_invoice = db.query(Invoice).filter(
            Invoice.number.isnot(None)
        ).order_by(Invoice.number.desc()).first()
        
        if last_invoice and last_invoice.number:
            try:
                last_number = int(last_invoice.number[3:])  # Remove 'INV' prefix
                new_number = last_number + 1
            except:
                new_number = 1
        else:
            new_number = 1
        
        invoice_number = f"INV{new_number:04d}"
        
        # Create invoice
        invoice = Invoice(
            number=invoice_number,
            subscription_id=subscription.id,
            customer_name=customer.name,
            date_issued=date.today(),
            due_date=date.today() + timedelta(days=30),  # Default 30 days
            total_amount=subscription.recurring_amount or 0.0,
            status=InvoiceStatus.draft
        )
        
        db.add(invoice)
        db.flush()
        
        # Copy subscription lines to invoice lines
        subscription_lines = db.query(SubscriptionLine).filter(
            SubscriptionLine.subscription_id == subscription.id
        ).all()
        
        if not subscription_lines:
            # If no subscription lines, create one from subscription data
            invoice_line = InvoiceLine(
                invoice_id=invoice.id,
                product_id=subscription.product_id,
                variant_id=None,
                quantity=1.0,
                unit_price=subscription.recurring_amount or 0.0,
                tax_id=None,
                discount_id=None,
                price_subtotal=subscription.recurring_amount or 0.0
            )
            db.add(invoice_line)
        else:
            for sub_line in subscription_lines:
                invoice_line = InvoiceLine(
                    invoice_id=invoice.id,
                    product_id=sub_line.product_id,
                    variant_id=sub_line.variant_id if hasattr(sub_line, 'variant_id') else None,
                    quantity=sub_line.quantity,
                    unit_price=sub_line.unit_price,
                    tax_id=None,
                    discount_id=None,
                    price_subtotal=sub_line.subtotal
                )
                db.add(invoice_line)
        
        db.commit()
        db.refresh(invoice)
        
        return {
            "id": invoice.id,
            "invoice_number": invoice.number,
            "amount": invoice.total_amount,
            "status": invoice.status.value,
            "date_issued": invoice.date_issued.isoformat(),
            "due_date": invoice.due_date.isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating invoice from subscription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create invoice: {str(e)}")

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

@router.post("/subscriptions/{subscription_id}/renew")
def renew_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Renew subscription - Creates new subscription order with same order lines
    Updates credit date and next invoice date
    """
    from datetime import timedelta
    from dateutil.relativedelta import relativedelta
    
    try:
        subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        if subscription.status != SubscriptionStatus.confirmed:
            raise HTTPException(status_code=400, detail="Only confirmed subscriptions can be renewed")
        
        # Get recurring plan to determine renewal period
        plan = db.query(RecurringPlan).filter(RecurringPlan.id == subscription.recurring_plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Recurring plan not found")
        
        # Calculate new dates based on plan
        current_next_billing = subscription.next_billing_date or date.today()
        current_end_date = subscription.end_date or current_next_billing
        
        if plan.billing_cycle == 'daily':
            new_next_billing = current_next_billing + timedelta(days=plan.billing_interval)
            new_end_date = current_end_date + timedelta(days=plan.billing_interval)
        elif plan.billing_cycle == 'weekly':
            new_next_billing = current_next_billing + timedelta(weeks=plan.billing_interval)
            new_end_date = current_end_date + timedelta(weeks=plan.billing_interval)
        elif plan.billing_cycle == 'monthly':
            new_next_billing = current_next_billing + relativedelta(months=plan.billing_interval)
            new_end_date = current_end_date + relativedelta(months=plan.billing_interval)
        elif plan.billing_cycle == 'yearly':
            new_next_billing = current_next_billing + relativedelta(years=plan.billing_interval)
            new_end_date = current_end_date + relativedelta(years=plan.billing_interval)
        else:
            new_next_billing = current_next_billing + relativedelta(months=1)
            new_end_date = current_end_date + relativedelta(months=1)
        
        # Create new subscription (renewal) with same order lines
        new_subscription = Subscription(
            customer_id=subscription.customer_id,
            product_id=subscription.product_id,
            recurring_plan_id=subscription.recurring_plan_id,
            start_date=current_next_billing,
            next_billing_date=new_next_billing,
            end_date=new_end_date,
            status=SubscriptionStatus.confirmed,
            recurring_amount=subscription.recurring_amount,
            created_at=datetime.utcnow()
        )
        
        db.add(new_subscription)
        db.flush()
        
        # Generate subscription number for new subscription
        new_subscription.number = generate_subscription_number(db)
        
        # Copy subscription lines from original subscription
        original_lines = db.query(SubscriptionLine).filter(
            SubscriptionLine.subscription_id == subscription_id
        ).all()
        
        for orig_line in original_lines:
            new_line = SubscriptionLine(
                subscription_id=new_subscription.id,
                product_id=orig_line.product_id,
                variant_id=orig_line.variant_id if hasattr(orig_line, 'variant_id') else None,
                description=orig_line.description if hasattr(orig_line, 'description') else None,
                quantity=orig_line.quantity,
                unit_price=orig_line.unit_price,
                discount=orig_line.discount if hasattr(orig_line, 'discount') else 0,
                tax_rate=orig_line.tax_rate if hasattr(orig_line, 'tax_rate') else 0,
                subtotal=orig_line.subtotal
            )
            db.add(new_line)
        
        # Update original subscription dates
        subscription.next_billing_date = new_next_billing
        subscription.end_date = new_end_date
        
        db.commit()
        db.refresh(new_subscription)
        
        return {
            "id": subscription.id,
            "status": subscription.status.value,
            "next_billing_date": subscription.next_billing_date.isoformat(),
            "new_end_date": subscription.end_date.isoformat(),
            "new_subscription_id": new_subscription.id,
            "new_subscription_number": new_subscription.number,
            "message": "Subscription renewed successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error renewing subscription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to renew subscription: {str(e)}")

@router.post("/subscriptions/{subscription_id}/upsell")
def upsell_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upsell subscription - Creates new order to change or upgrade subscription
    Allows adding different products or upgrading to higher tier
    """
    try:
        subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        if subscription.status != SubscriptionStatus.confirmed:
            raise HTTPException(status_code=400, detail="Only confirmed subscriptions can be upgraded")
        
        # Get customer info
        customer = db.query(Customer).filter(Customer.id == subscription.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Create new subscription for upsell (starts as draft for customization)
        upsell_subscription = Subscription(
            customer_id=subscription.customer_id,
            product_id=subscription.product_id,  # Can be changed in the form
            recurring_plan_id=subscription.recurring_plan_id,  # Can be upgraded
            start_date=date.today(),
            next_billing_date=subscription.next_billing_date,
            end_date=subscription.end_date,
            status=SubscriptionStatus.draft,  # Draft so user can modify
            recurring_amount=subscription.recurring_amount,
            created_at=datetime.utcnow()
        )
        
        db.add(upsell_subscription)
        db.flush()
        
        # Copy existing subscription lines as starting point
        original_lines = db.query(SubscriptionLine).filter(
            SubscriptionLine.subscription_id == subscription_id
        ).all()
        
        for orig_line in original_lines:
            new_line = SubscriptionLine(
                subscription_id=upsell_subscription.id,
                product_id=orig_line.product_id,
                variant_id=orig_line.variant_id if hasattr(orig_line, 'variant_id') else None,
                description=orig_line.description if hasattr(orig_line, 'description') else None,
                quantity=orig_line.quantity,
                unit_price=orig_line.unit_price,
                discount=orig_line.discount if hasattr(orig_line, 'discount') else 0,
                tax_rate=orig_line.tax_rate if hasattr(orig_line, 'tax_rate') else 0,
                subtotal=orig_line.subtotal
            )
            db.add(new_line)
        
        db.commit()
        db.refresh(upsell_subscription)
        
        return {
            "id": upsell_subscription.id,
            "new_subscription_id": upsell_subscription.id,
            "order_number": f"UPSELL-{subscription.number or subscription_id}",
            "status": upsell_subscription.status.value,
            "original_subscription_id": subscription.id,
            "message": "Upsell order created successfully. You can now modify products and pricing."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating upsell: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create upsell: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to renew subscription: {str(e)}")
    
    # Get recurring plan to determine renewal period
    plan = db.query(RecurringPlan).filter(RecurringPlan.id == subscription.recurring_plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Recurring plan not found")
    
    # Calculate new dates based on plan
    current_next_billing = subscription.next_billing_date or date.today()
    
    if plan.billing_cycle == 'daily':
        new_next_billing = current_next_billing + timedelta(days=plan.billing_interval)
    elif plan.billing_cycle == 'weekly':
        new_next_billing = current_next_billing + timedelta(weeks=plan.billing_interval)
    elif plan.billing_cycle == 'monthly':
        new_next_billing = current_next_billing + relativedelta(months=plan.billing_interval)
    elif plan.billing_cycle == 'yearly':
        new_next_billing = current_next_billing + relativedelta(years=plan.billing_interval)
    else:
        new_next_billing = current_next_billing + relativedelta(months=1)  # Default to 1 month
    
    # Update subscription
    subscription.next_billing_date = new_next_billing
    
    db.commit()
    db.refresh(subscription)
    
    return {
        "id": subscription.id,
        "status": subscription.status.value,
        "next_billing_date": subscription.next_billing_date.isoformat(),
        "new_end_date": new_next_billing.isoformat(),
        "message": "Subscription renewed successfully"
    }
