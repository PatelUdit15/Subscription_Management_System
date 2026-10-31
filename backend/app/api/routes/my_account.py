from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.base import get_db
from app.api.routes.auth import get_current_user
from app.models.user import User
from app.models.order import Order
from app.models.subscription import Subscription
from app.models.invoice import Invoice
from app.models.product import Product
from app.models.recurring_plan import RecurringPlan
from app.core.security import get_password_hash

router = APIRouter()

# Schemas
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

@router.get("/my/profile")
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get logged-in user's profile details"""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }

@router.put("/my/profile")
def update_my_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update logged-in user's profile"""
    
    # Update name if provided
    if profile_data.name:
        current_user.name = profile_data.name
    
    # Update email if provided
    if profile_data.email:
        # Check if email is already taken by another user
        existing_user = db.query(User).filter(
            User.email == profile_data.email,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = profile_data.email
    
    # Update password if provided
    if profile_data.new_password:
        if not profile_data.current_password:
            raise HTTPException(status_code=400, detail="Current password required to change password")
        
        # Verify current password
        from app.core.security import verify_password
        if not verify_password(profile_data.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Set new password
        current_user.hashed_password = get_password_hash(profile_data.new_password)
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "success": True,
        "message": "Profile updated successfully",
        "profile": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role
        }
    }

@router.get("/my/orders")
def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all orders for logged-in user"""
    orders = db.query(Order).filter(
        Order.user_id == current_user.id
    ).order_by(Order.created_at.desc()).all()
    
    result = []
    for order in orders:
        result.append({
            "id": order.id,
            "number": order.number,
            "total_amount": order.total_amount,
            "status": order.status,
            "created_at": order.created_at.isoformat(),
            "items_count": len(order.order_lines),
            "shipping_address": order.shipping_address
        })
    
    return result

@router.get("/my/orders/{order_id}")
def get_my_order_detail(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed order information for logged-in user"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Build order lines with product details
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
        "created_at": order.created_at.isoformat(),
        "shipping_address": order.shipping_address,
        "billing_address": order.billing_address,
        "order_lines": order_lines
    }

@router.get("/my/subscriptions")
def get_my_subscriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all subscriptions for logged-in user"""
    # Get subscriptions through orders
    subscriptions = db.query(Subscription).join(
        Order, Subscription.order_id == Order.id
    ).filter(
        Order.user_id == current_user.id
    ).order_by(Subscription.start_date.desc()).all()
    
    result = []
    for sub in subscriptions:
        product = db.query(Product).filter(Product.id == sub.product_id).first()
        plan = db.query(RecurringPlan).filter(RecurringPlan.id == sub.recurring_plan_id).first()
        
        result.append({
            "id": sub.id,
            "product_name": product.name if product else "Unknown",
            "plan_name": plan.name if plan else "Unknown",
            "billing_period": plan.billing_period if plan else None,
            "status": sub.status,
            "start_date": sub.start_date.isoformat(),
            "next_billing_date": sub.next_billing_date.isoformat() if sub.next_billing_date else None,
            "end_date": sub.end_date.isoformat() if sub.end_date else None
        })
    
    return result

@router.get("/my/invoices")
def get_my_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all invoices for logged-in user"""
    # Get invoices through subscriptions and orders
    invoices = db.query(Invoice).join(
        Subscription, Invoice.subscription_id == Subscription.id
    ).join(
        Order, Subscription.order_id == Order.id
    ).filter(
        Order.user_id == current_user.id
    ).order_by(Invoice.date_issued.desc()).all()
    
    result = []
    for invoice in invoices:
        result.append({
            "id": invoice.id,
            "number": invoice.number,
            "customer_name": invoice.customer_name,
            "date_issued": invoice.date_issued.isoformat(),
            "due_date": invoice.due_date.isoformat(),
            "total_amount": invoice.total_amount,
            "status": invoice.status
        })
    
    return result

@router.get("/my/invoices/{invoice_id}")
def get_my_invoice_detail(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed invoice information for logged-in user"""
    # Verify invoice belongs to current user
    invoice = db.query(Invoice).join(
        Subscription, Invoice.subscription_id == Subscription.id
    ).join(
        Order, Subscription.order_id == Order.id
    ).filter(
        Invoice.id == invoice_id,
        Order.user_id == current_user.id
    ).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Build invoice lines
    invoice_lines = []
    for line in invoice.invoice_lines:
        product = db.query(Product).filter(Product.id == line.product_id).first()
        
        invoice_lines.append({
            "id": line.id,
            "product_name": product.name if product else "Unknown",
            "quantity": line.quantity,
            "unit_price": line.unit_price,
            "price_subtotal": line.price_subtotal
        })
    
    return {
        "id": invoice.id,
        "number": invoice.number,
        "customer_name": invoice.customer_name,
        "date_issued": invoice.date_issued.isoformat(),
        "due_date": invoice.due_date.isoformat(),
        "total_amount": invoice.total_amount,
        "status": invoice.status,
        "invoice_lines": invoice_lines
    }

@router.post("/my/subscriptions/{subscription_id}/cancel")
def cancel_my_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a subscription for logged-in user"""
    # Verify subscription belongs to current user
    subscription = db.query(Subscription).join(
        Order, Subscription.order_id == Order.id
    ).filter(
        Subscription.id == subscription_id,
        Order.user_id == current_user.id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if subscription.status == "cancelled":
        raise HTTPException(status_code=400, detail="Subscription is already cancelled")
    
    # Update subscription status
    from app.models.subscription import SubscriptionStatus
    subscription.status = SubscriptionStatus.cancelled
    
    from datetime import date
    subscription.end_date = date.today()
    
    db.commit()
    
    return {
        "success": True,
        "message": "Subscription cancelled successfully"
    }
