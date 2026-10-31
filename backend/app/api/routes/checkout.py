from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta, date
from app.db.base import get_db
from app.models.order import Order, OrderStatus
from app.models.order_line import OrderLine
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.product import Product, ProductType
from app.models.product_variant import ProductVariant
from app.models.recurring_plan import RecurringPlan, BillingPeriod
from app.models.invoice import Invoice, InvoiceStatus
from app.models.invoice_line import InvoiceLine
from app.models.payment import Payment, PaymentMethod
from app.models.tax import Tax
from app.api.routes.auth import get_current_user
from app.models.user import User
import uuid

router = APIRouter()

class CartItem(BaseModel):
    productId: int
    variantIds: List[int] = []
    planId: int
    quantity: int
    finalPrice: float

class CheckoutRequest(BaseModel):
    cart: List[CartItem]
    shipping_address: str
    billing_address: str
    payment_method: str = "stripe"
    payment_reference: str = None
    notes: str = None

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
            # Handle edge case for months with different days
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

def generate_order_number(db: Session) -> str:
    """Generate auto-incremented order number: ORD/YYYY/NNNN"""
    current_year = datetime.now().year
    prefix = f"ORD/{current_year}/"
    
    last_order = db.query(Order).filter(
        Order.number.like(f"{prefix}%")
    ).order_by(Order.number.desc()).first()
    
    if last_order:
        last_number = int(last_order.number.split('/')[-1])
        new_number = last_number + 1
    else:
        new_number = 1
    
    return f"{prefix}{new_number:04d}"

@router.post("/checkout")
def process_checkout(
    checkout_data: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Process checkout and create order, subscriptions, and invoices
    
    Transaction flow:
    1. Create Order
    2. Create OrderLines
    3. Create Subscriptions (for service products)
    4. Generate Invoices
    5. Return order details
    """
    
    try:
        # Start transaction
        total_amount = 0.0
        
        # Create Order with generated number
        order = Order(
            number=generate_order_number(db),
            user_id=current_user.id,
            total_amount=0.0,  # Will be calculated
            status=OrderStatus.pending,
            shipping_address=checkout_data.shipping_address,
            billing_address=checkout_data.billing_address
        )
        db.add(order)
        db.flush()  # Get order ID
        
        # Process each cart item
        subscriptions_created = []
        
        for item in checkout_data.cart:
            # Verify product exists
            product = db.query(Product).filter(Product.id == item.productId).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.productId} not found")
            
            # Verify recurring plan
            plan = db.query(RecurringPlan).filter(RecurringPlan.id == item.planId).first()
            if not plan:
                raise HTTPException(status_code=404, detail=f"Recurring plan {item.planId} not found")
            
            # Calculate unit price (base + variant extras)
            unit_price = product.base_price
            variant_id = None
            
            if item.variantIds:
                for vid in item.variantIds:
                    variant = db.query(ProductVariant).filter(ProductVariant.id == vid).first()
                    if variant:
                        unit_price += variant.extra_price
                        variant_id = vid  # Store last variant for reference
            
            # Line subtotal before tax
            line_subtotal = round(unit_price * item.quantity, 2)
            
            # Calculate active tax (e.g. GST 18%)
            active_tax = db.query(Tax).filter(Tax.is_active == True).first()
            tax_rate = active_tax.value if active_tax else 18.0
            tax_id = active_tax.id if active_tax else None
            tax_amount = round(line_subtotal * (tax_rate / 100.0), 2)
            line_total = round(line_subtotal + tax_amount, 2)
            
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
                db.flush()  # Get subscription ID
                subscriptions_created.append(subscription)
                
                # Generate first invoice for subscription with taxes included
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
                    status=InvoiceStatus.paid  # Mark as paid since checkout is complete
                )
                db.add(invoice)
                db.flush()
                
                # Create invoice line with tax rate and subtotal
                invoice_line = InvoiceLine(
                    invoice_id=invoice.id,
                    product_id=product.id,
                    variant_id=variant_id,
                    quantity=item.quantity,
                    unit_price=unit_price,
                    tax_rate=tax_rate,
                    tax_id=tax_id,
                    price_subtotal=line_subtotal
                )
                db.add(invoice_line)

                # Record invoice payment settlement
                sub_method = PaymentMethod.stripe
                if checkout_data.payment_method in ["cash", "bank_transfer", "credit_card", "stripe", "paypal", "upi"]:
                    sub_method = PaymentMethod(checkout_data.payment_method)
                
                payment_ref = checkout_data.payment_reference or f"ch_stripe_{uuid.uuid4().hex[:14]}"
                payment_record = Payment(
                    invoice_id=invoice.id,
                    amount=line_total,
                    payment_method=sub_method,
                    transaction_reference=payment_ref,
                    payment_date=date_issued,
                    notes=checkout_data.notes or f"Order {order.number} settlement via Stripe Gateway"
                )
                db.add(payment_record)

                # Mark subscription as paid
                subscription.payment_done = True
        
        # Update order total and mark as completed
        order.total_amount = total_amount
        order.status = OrderStatus.completed
        
        # Commit transaction
        db.commit()
        db.refresh(order)
        
        return {
            "success": True,
            "order_id": order.id,
            "total_amount": total_amount,
            "subscriptions_created": len(subscriptions_created),
            "message": "Order placed successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Checkout failed: {str(e)}")

@router.get("/orders/{order_id}")
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get order details"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Build order details
    order_lines = []
    for line in order.order_lines:
        product = db.query(Product).filter(Product.id == line.product_id).first()
        plan = db.query(RecurringPlan).filter(RecurringPlan.id == line.recurring_plan_id).first()
        
        order_lines.append({
            "id": line.id,
            "product_name": product.name if product else "Unknown",
            "quantity": line.quantity,
            "unit_price": line.unit_price,
            "total_price": line.total_price,
            "plan_name": plan.name if plan else "Unknown"
        })
    
    return {
        "id": order.id,
        "total_amount": order.total_amount,
        "status": order.status,
        "created_at": order.created_at,
        "shipping_address": order.shipping_address,
        "billing_address": order.billing_address,
        "order_lines": order_lines
    }

@router.get("/my-orders")
def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all orders for current user"""
    orders = db.query(Order).filter(
        Order.user_id == current_user.id
    ).order_by(Order.created_at.desc()).all()
    
    return [{
        "id": order.id,
        "total_amount": order.total_amount,
        "status": order.status,
        "created_at": order.created_at,
        "items_count": len(order.order_lines)
    } for order in orders]
