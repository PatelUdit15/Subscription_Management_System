from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
import uuid

from app.db.base import get_db
from app.models.payment import Payment, PaymentMethod
from app.models.invoice import Invoice, InvoiceStatus
from app.models.subscription import Subscription, SubscriptionStatus
from app.api.routes.auth import get_current_user
from app.models.user import User
from app.services.stripe_service import stripe_service

router = APIRouter()

# Schemas
class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float
    payment_method: PaymentMethod
    transaction_reference: Optional[str] = None
    payment_date: date
    notes: Optional[str] = None

class StripeSettleRequest(BaseModel):
    invoice_id: int
    amount: float
    payment_date: Optional[date] = None
    notes: Optional[str] = None
    cardholder_name: Optional[str] = None
    card_last4: Optional[str] = "4242"
    card_brand: Optional[str] = "Visa"
    payment_intent_id: Optional[str] = None

@router.get("/payment-gateway/stripe/config")
def get_stripe_gateway_config():
    """Returns Stripe gateway public configuration"""
    return stripe_service.get_public_config()

@router.get("/payments/summary")
def get_payments_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get aggregated financial settlement summary:
    - Total Settled (Total Collected)
    - Total Outstanding (Pending Invoices Balance)
    - Fully Paid Invoices Count
    - Outstanding Invoices Count
    - Payments by method breakdown
    """
    all_payments = db.query(Payment).all()
    all_invoices = db.query(Invoice).all()

    total_settled = sum(p.amount for p in all_payments)
    
    # Calculate payments per invoice
    invoice_payments_map = {}
    for p in all_payments:
        invoice_payments_map[p.invoice_id] = invoice_payments_map.get(p.invoice_id, 0.0) + p.amount

    total_outstanding = 0.0
    paid_count = 0
    outstanding_count = 0

    for inv in all_invoices:
        paid_for_inv = invoice_payments_map.get(inv.id, 0.0)
        balance = max(0.0, inv.total_amount - paid_for_inv)
        if inv.status == InvoiceStatus.paid or balance <= 0.01:
            paid_count += 1
        else:
            outstanding_count += 1
            total_outstanding += balance

    # Breakdown by payment method
    by_method = {}
    for p in all_payments:
        m = p.payment_method.value if hasattr(p.payment_method, "value") else str(p.payment_method)
        if m not in by_method:
            by_method[m] = {"count": 0, "total": 0.0}
        by_method[m]["count"] += 1
        by_method[m]["total"] += p.amount

    return {
        "total_settled": round(total_settled, 2),
        "total_outstanding": round(total_outstanding, 2),
        "total_invoices_count": len(all_invoices),
        "paid_invoices_count": paid_count,
        "outstanding_invoices_count": outstanding_count,
        "total_payments_count": len(all_payments),
        "settled_by_method": by_method
    }

@router.get("/payments/invoices/outstanding")
def get_outstanding_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all outstanding (unpaid or partially paid) invoices with remaining balance
    """
    all_invoices = db.query(Invoice).order_by(Invoice.due_date.asc()).all()
    all_payments = db.query(Payment).all()

    invoice_payments_map = {}
    for p in all_payments:
        invoice_payments_map[p.invoice_id] = invoice_payments_map.get(p.invoice_id, 0.0) + p.amount

    outstanding = []
    for inv in all_invoices:
        paid_for_inv = invoice_payments_map.get(inv.id, 0.0)
        balance = max(0.0, inv.total_amount - paid_for_inv)
        if inv.status != InvoiceStatus.paid and balance > 0.01:
            outstanding.append({
                "id": inv.id,
                "number": inv.number or f"INV-{inv.id}",
                "customer_name": inv.customer_name,
                "date_issued": inv.date_issued.isoformat() if inv.date_issued else None,
                "due_date": inv.due_date.isoformat() if inv.due_date else None,
                "total_amount": round(inv.total_amount, 2),
                "amount_paid": round(paid_for_inv, 2),
                "balance_outstanding": round(balance, 2),
                "status": inv.status.value if hasattr(inv.status, "value") else str(inv.status),
                "subscription_id": inv.subscription_id
            })

    return outstanding

@router.get("/payments/invoices/paid")
def get_paid_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all fully settled/paid invoices with settlement details
    """
    invoices = db.query(Invoice).filter(Invoice.status == InvoiceStatus.paid).order_by(Invoice.id.desc()).all()
    
    result = []
    for inv in invoices:
        payments = db.query(Payment).filter(Payment.invoice_id == inv.id).order_by(Payment.payment_date.desc()).all()
        last_payment = payments[0] if payments else None
        
        result.append({
            "id": inv.id,
            "number": inv.number or f"INV-{inv.id}",
            "customer_name": inv.customer_name,
            "date_issued": inv.date_issued.isoformat() if inv.date_issued else None,
            "due_date": inv.due_date.isoformat() if inv.due_date else None,
            "total_amount": round(inv.total_amount, 2),
            "status": "paid",
            "settled_date": last_payment.payment_date.isoformat() if last_payment else (inv.date_issued.isoformat() if inv.date_issued else None),
            "payment_method": last_payment.payment_method.value if (last_payment and hasattr(last_payment.payment_method, "value")) else ("stripe" if last_payment else "settled"),
            "transaction_reference": last_payment.transaction_reference if last_payment else "-",
            "payments_count": len(payments)
        })

    return result

@router.post("/payments/stripe-settle")
def settle_invoice_with_stripe(
    payload: StripeSettleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Hassle-free direct settlement via Stripe Payment Gateway.
    No verification/KYC roadblock - directly executes card settlement and records invoice settlement.
    """
    try:
        result = stripe_service.settle_invoice(
            db=db,
            invoice_id=payload.invoice_id,
            amount=payload.amount,
            payment_date=payload.payment_date or date.today(),
            notes=payload.notes or "Direct settlement via Stripe Gateway",
            cardholder_name=payload.cardholder_name,
            card_last4=payload.card_last4 or "4242",
            card_brand=payload.card_brand or "Visa",
            transaction_reference=payload.payment_intent_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stripe settlement failed: {str(e)}")

@router.get("/payments")
def get_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all payments history"""
    payments = db.query(Payment).order_by(Payment.created_at.desc()).all()
    
    result = []
    for payment in payments:
        invoice = db.query(Invoice).filter(Invoice.id == payment.invoice_id).first()
        
        result.append({
            "id": payment.id,
            "invoice_id": payment.invoice_id,
            "invoice_number": invoice.number if invoice else "Unknown",
            "customer_name": invoice.customer_name if invoice else "Unknown",
            "amount": payment.amount,
            "payment_method": payment.payment_method.value if hasattr(payment.payment_method, "value") else str(payment.payment_method),
            "transaction_reference": payment.transaction_reference,
            "payment_date": payment.payment_date.isoformat(),
            "notes": payment.notes,
            "created_at": payment.created_at.isoformat()
        })
    
    return result

@router.get("/payments/{payment_id}")
def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment by ID"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    invoice = db.query(Invoice).filter(Invoice.id == payment.invoice_id).first()
    
    return {
        "id": payment.id,
        "invoice_id": payment.invoice_id,
        "invoice_number": invoice.number if invoice else "Unknown",
        "customer_name": invoice.customer_name if invoice else "Unknown",
        "amount": payment.amount,
        "payment_method": payment.payment_method.value if hasattr(payment.payment_method, "value") else str(payment.payment_method),
        "transaction_reference": payment.transaction_reference,
        "payment_date": payment.payment_date.isoformat(),
        "notes": payment.notes,
        "created_at": payment.created_at.isoformat()
    }

@router.post("/payments")
def create_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Register a manual payment (Cash, Bank Transfer, Stripe, Credit Card, PayPal, UPI)
    Records invoice settlement and updates invoice & subscription status.
    """
    # Verify invoice exists
    invoice = db.query(Invoice).filter(Invoice.id == payment_data.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    ref = payment_data.transaction_reference or f"TXN-{uuid.uuid4().hex[:10].upper()}"

    payment = Payment(
        invoice_id=payment_data.invoice_id,
        amount=payment_data.amount,
        payment_method=payment_data.payment_method,
        transaction_reference=ref,
        payment_date=payment_data.payment_date,
        notes=payment_data.notes
    )
    db.add(payment)
    
    # Calculate total payments for this invoice
    total_payments = db.query(Payment).filter(
        Payment.invoice_id == payment_data.invoice_id
    ).all()
    total_paid = sum(p.amount for p in total_payments) + payment_data.amount
    
    # Update invoice status if fully paid
    if total_paid >= (invoice.total_amount - 0.01):
        invoice.status = InvoiceStatus.paid
        
        # Also update linked subscription if present
        if invoice.subscription_id:
            sub = db.query(Subscription).filter(Subscription.id == invoice.subscription_id).first()
            if sub:
                sub.payment_done = True
                if sub.status in [SubscriptionStatus.draft, SubscriptionStatus.sent, SubscriptionStatus.confirmed]:
                    sub.status = SubscriptionStatus.active
    
    db.commit()
    db.refresh(payment)
    
    return {
        "id": payment.id,
        "invoice_id": payment.invoice_id,
        "invoice_number": invoice.number,
        "customer_name": invoice.customer_name,
        "amount": payment.amount,
        "payment_method": payment.payment_method.value if hasattr(payment.payment_method, "value") else str(payment.payment_method),
        "transaction_reference": payment.transaction_reference,
        "payment_date": payment.payment_date.isoformat(),
        "notes": payment.notes,
        "created_at": payment.created_at.isoformat(),
        "invoice_status": invoice.status.value if hasattr(invoice.status, "value") else str(invoice.status),
        "total_paid": round(total_paid, 2),
        "balance": round(max(0.0, invoice.total_amount - total_paid), 2)
    }

@router.delete("/payments/{payment_id}")
def delete_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete payment and recalculate invoice settlement status"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    invoice_id = payment.invoice_id
    db.delete(payment)
    
    # Recalculate invoice status
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if invoice:
        remaining_payments = db.query(Payment).filter(
            Payment.invoice_id == invoice_id
        ).all()
        total_paid = sum(p.amount for p in remaining_payments)
        
        if total_paid < (invoice.total_amount - 0.01):
            invoice.status = InvoiceStatus.posted
            if invoice.subscription_id:
                sub = db.query(Subscription).filter(Subscription.id == invoice.subscription_id).first()
                if sub:
                    sub.payment_done = False
    
    db.commit()
    return {"success": True, "message": "Payment deleted successfully"}

@router.get("/invoices/{invoice_id}/payments")
def get_invoice_payments(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all payments for a specific invoice"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    payments = db.query(Payment).filter(
        Payment.invoice_id == invoice_id
    ).order_by(Payment.payment_date.desc()).all()
    
    total_paid = sum(p.amount for p in payments)
    
    return {
        "invoice_id": invoice_id,
        "invoice_number": invoice.number,
        "invoice_total": invoice.total_amount,
        "total_paid": total_paid,
        "balance": max(0.0, invoice.total_amount - total_paid),
        "status": invoice.status.value if hasattr(invoice.status, "value") else str(invoice.status),
        "payments": [{
            "id": payment.id,
            "amount": payment.amount,
            "payment_method": payment.payment_method.value if hasattr(payment.payment_method, "value") else str(payment.payment_method),
            "transaction_reference": payment.transaction_reference,
            "payment_date": payment.payment_date.isoformat(),
            "notes": payment.notes
        } for payment in payments]
    }
