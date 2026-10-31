from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import hmac
import hashlib
from datetime import datetime, timedelta, date
from app.db.base import get_db
from app.services.payment_service import payment_service
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
from app.core.config import settings

router = APIRouter()

class CartItem(BaseModel):
    productId: int
    variantIds: List[int] = []
    planId: int
    quantity: int
    finalPrice: float

class InitiatePaymentRequest(BaseModel):
    cart: List[CartItem]
    shipping_address: str
    billing_address: str

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    cart: List[CartItem]
    shipping_address: str
    billing_address: str

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

@router.post("/payment/initiate")
def initiate_payment(
    payment_request: InitiatePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step 1: Initiate payment and generate QR code
    """
    try:
        # Calculate total amount
        total_amount = sum(item.finalPrice for item in payment_request.cart)
        
        # Create Razorpay order
        receipt = f"user_{current_user.id}_{int(datetime.now().timestamp())}"
        razorpay_order = payment_service.create_payment_order(
            amount=total_amount,
            currency="USD",  # Change to INR for India
            receipt=receipt
        )
        
        # Generate UPI link for QR code
        upi_link = payment_service.generate_upi_qr(
            order_id=razorpay_order['id'],
            amount=total_amount
        )
        
        return {
            "success": True,
            "razorpay_order_id": razorpay_order['id'],
            "amount": total_amount,
            "currency": razorpay_order['currency'],
            "upi_link": upi_link,
            "razorpay_key": settings.RAZORPAY_KEY_ID
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment initiation failed: {str(e)}")

@router.post("/payment/verify")
def verify_payment(
    verify_request: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step 2: Verify payment and create order/invoice
    """
    try:
        # Verify payment signature
        is_valid = payment_service.verify_payment_signature(
            verify_request.razorpay_order_id,
            verify_request.razorpay_payment_id,
            verify_request.razorpay_signature
        )
        
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        # Get payment details
        payment_details = payment_service.get_payment_details(verify_request.razorpay_payment_id)
        
        if payment_details['status'] != 'captured':
            raise HTTPException(status_code=400, detail="Payment not captured")
        
        # Create order and invoice (same logic as checkout)
        total_amount = 0.0
        
        # Create Order
        order = Order(
            user_id=current_user.id,
            total_amount=0.0,
            status=OrderStatus.pending,
            shipping_address=verify_request.shipping_address,
            billing_address=verify_request.billing_address
        )
        db.add(order)
        db.flush()
        
        # Process each cart item
        subscriptions_created = []
        invoices_created = []
        
        for item in verify_request.cart:
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
            
            line_total = round(unit_price * item.quantity, 2)
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
                    transaction_reference=verify_request.razorpay_payment_id,
                    payment_date=date.today(),
                    notes=f"Razorpay UPI payment: {verify_request.razorpay_payment_id}"
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
            "message": "Payment verified and order created"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")

@router.get("/payment/status/{razorpay_order_id}")
def check_payment_status(
    razorpay_order_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Check payment status for polling
    """
    try:
        order_details = payment_service.get_order_details(razorpay_order_id)
        
        if not order_details:
            return {"status": "pending"}
        
        # Check if order is paid
        if order_details['status'] == 'paid':
            return {
                "status": "paid",
                "payment_id": order_details.get('payments', [{}])[0].get('id') if order_details.get('payments') else None
            }
        
        return {"status": "pending"}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/payment/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Webhook endpoint for Razorpay payment notifications
    """
    try:
        # Get webhook signature
        webhook_signature = request.headers.get('X-Razorpay-Signature')
        webhook_body = await request.body()
        
        # Verify webhook signature
        expected_signature = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode(),
            webhook_body,
            hashlib.sha256
        ).hexdigest()
        
        if webhook_signature != expected_signature:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
        
        # Process webhook event
        webhook_data = await request.json()
        event = webhook_data['event']
        
        if event == 'payment.captured':
            payment_entity = webhook_data['payload']['payment']['entity']
            # Additional processing can be done here
            pass
        
        return {"status": "ok"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")
