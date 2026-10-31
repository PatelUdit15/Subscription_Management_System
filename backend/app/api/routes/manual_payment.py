from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta, date
from app.db.base import get_db
from app.api.routes.auth import get_current_user
from app.models.user import User
from app.models.order import Order, OrderStatus
from app.models.order_line import OrderLine
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.product import Product, ProductType
from app.models.product_variant import ProductVariant
from app.models.recurring_plan import RecurringPlan, BillingPeriod
from app.models.invoice import Invoice, InvoiceStatus
from app.models.invoice_line import InvoiceLine
from app.models.payment import Payment, PaymentMethod

router = APIRouter()

class CartItem(BaseModel):
    productId: int
    variantIds: List[int] = []
    planId: int
    quantity: int
    finalPrice: float

class ManualPaymentConfirmRequest(BaseModel):
    cart: List[CartItem]
    shipping_address: str
    billing_address: str
    transaction_reference: str
    amount: float

def calculate_next_billing_date(start_date: date, billing_period: BillingPeriod) -> date:
    """Calculate next billing date based on billing period"""
    if billing_period == BillingPeriod.weeks:
        return start_date + timedelta(weeks=1)
    elif billing_period == BillingPeriod.month:
        month = start_date.month
        year = start_date.year
        if month == 12:
            month = 1
            year += 1
        else:
            month += 1
        try:
            return start_date.replace(year=year, month=month)
        except ValueError:
            return start_date.replace(year=year, month=month, day=1) + timedelta(days=32)
    elif billing_period == BillingPeriod.year:
        return start_date.replace(year=start_date.year + 1)
    return start_date

def generate_invoice_number(db: Session) -> str:
    """Generate auto-incremented invoice number: INV/YYYY/NNNN"""
    current_year = datetime.now().year
    prefix = f"INV/{current_year}/"
    
    last_invoice = db.query(Invoice).filter(
        Invoice.number.like(f"{prefix}%")
    ).order_by(Invoice.number.desc()).first()
    
    if last_invoice:
        last_number = int(last_invoice.number.split('/')[-1])
        new_number = last_number + 1
    else:
        new_number = 1
    
    return f"{prefix}{new_number:04d}"

@router.post("/payment/manual-confirm")
def confirm_manual_payment(
    payment_data: ManualPaymentConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Confirm manual payment and create order/invoice
    
    Flow:
    1. Create Order
    2. Create OrderLines
    3. Create Subscriptions (for service products)
    4. Generate Invoices (marked as paid)
    5. Create Payment records
    6. Return order details
    """
    
    try:
        # Validate transaction reference
        if not payment_data.transaction_reference.strip():
            raise HTTPException(status_code=400, detail="Transaction reference is required")
        
        # Start transaction
        total_amount = 0.0
        
        # Create Order
        from app.api.routes.checkout import generate_order_number
        
        order = Order(
            number=generate_order_number(db),
            user_id=current_user.id,
            total_amount=0.0,
            status=OrderStatus.pending,
            shipping_address=payment_data.shipping_address,
            billing_address=payment_data.billing_address
        )
        db.add(order)
        db.flush()
        
        # Process each cart item
        subscriptions_created = []
        invoices_created = []
        
        for item in payment_data.cart:
            product = db.query(Product).filter(Product.id == item.productId).first()
            if not product:
                continue
            
            plan = db.query(RecurringPlan).filter(RecurringPlan.id == item.planId).first()
            if not plan:
                continue
            
            # Calculate unit price
            unit_price = product.base_price
            variant_id = None
            
            if item.variantIds:
                for vid in item.variantIds:
                    variant = db.query(ProductVariant).filter(ProductVariant.id == vid).first()
                    if variant:
                        unit_price += variant.extra_price
                        variant_id = vid
            
            # Calculate duration multiplier
            duration_months = 1
            if plan.billing_period == BillingPeriod.month:
                duration_months = 1
            elif plan.billing_period == BillingPeriod.year:
                duration_months = 12
            elif plan.billing_period == BillingPeriod.weeks:
                duration_months = 0.25
            
            line_total = unit_price * duration_months * item.quantity
            total_amount += line_total
            
            # Create Order Line
            order_line = OrderLine(
                order_id=order.id,
                product_id=product.id,
                variant_id=variant_id,
                recurring_plan_id=plan.id,
                quantity=item.quantity,
                unit_price=unit_price,
                total_price=line_total
            )
            db.add(order_line)
            
            # Create Subscription for service products
            if product.type == ProductType.service:
                start_date = datetime.now().date()
                next_billing = calculate_next_billing_date(start_date, plan.billing_period)
                
                subscription = Subscription(
                    order_id=order.id,
                    product_id=product.id,
                    recurring_plan_id=plan.id,
                    start_date=start_date,
                    status=SubscriptionStatus.active,
                    next_billing_date=next_billing
                )
                db.add(subscription)
                db.flush()
                subscriptions_created.append(subscription)
                
                # Generate invoice
                invoice_number = generate_invoice_number(db)
                date_issued = datetime.now().date()
                due_date = date_issued + timedelta(days=30)
                
                invoice = Invoice(
                    number=invoice_number,
                    subscription_id=subscription.id,
                    customer_name=current_user.name,
                    date_issued=date_issued,
                    due_date=due_date,
                    total_amount=line_total,
                    status=InvoiceStatus.paid
                )
                db.add(invoice)
                db.flush()
                invoices_created.append(invoice)
                
                # Create invoice line
                invoice_line = InvoiceLine(
                    invoice_id=invoice.id,
                    product_id=product.id,
                    variant_id=variant_id,
                    quantity=item.quantity,
                    unit_price=unit_price,
                    price_subtotal=line_total
                )
                db.add(invoice_line)
                
                # Create Payment record
                payment_record = Payment(
                    invoice_id=invoice.id,
                    amount=line_total,
                    payment_method=PaymentMethod.upi,
                    transaction_reference=payment_data.transaction_reference,
                    payment_date=date.today(),
                    notes=f"Manual UPI payment confirmation. Transaction ID: {payment_data.transaction_reference}"
                )
                db.add(payment_record)
        
        # Update order total and mark as completed
        order.total_amount = total_amount
        order.status = OrderStatus.completed
        
        db.commit()
        db.refresh(order)
        
        return {
            "success": True,
            "order_id": order.id,
            "total_amount": total_amount,
            "subscriptions_created": len(subscriptions_created),
            "invoices_created": len(invoices_created),
            "invoice_numbers": [inv.number for inv in invoices_created],
            "message": "Payment confirmed and order created successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Payment confirmation failed: {str(e)}")
