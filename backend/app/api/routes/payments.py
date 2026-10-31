from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.db.base import get_db
from app.models.payment import Payment, PaymentMethod
from app.models.invoice import Invoice, InvoiceStatus
from app.api.routes.auth import get_current_user
from app.models.user import User

router = APIRouter()

class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float
    payment_method: PaymentMethod
    transaction_reference: Optional[str] = None
    payment_date: date
    notes: Optional[str] = None

@router.get("/payments")
def get_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all payments"""
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
            "payment_method": payment.payment_method,
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
        "payment_method": payment.payment_method,
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
    """Register a new payment"""
    # Verify invoice exists
    invoice = db.query(Invoice).filter(Invoice.id == payment_data.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Create payment
    payment = Payment(
        invoice_id=payment_data.invoice_id,
        amount=payment_data.amount,
        payment_method=payment_data.payment_method,
        transaction_reference=payment_data.transaction_reference,
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
    if total_paid >= invoice.total_amount:
        invoice.status = InvoiceStatus.paid
    
    db.commit()
    db.refresh(payment)
    
    return {
        "id": payment.id,
        "invoice_id": payment.invoice_id,
        "invoice_number": invoice.number,
        "customer_name": invoice.customer_name,
        "amount": payment.amount,
        "payment_method": payment.payment_method,
        "transaction_reference": payment.transaction_reference,
        "payment_date": payment.payment_date.isoformat(),
        "notes": payment.notes,
        "created_at": payment.created_at.isoformat()
    }

@router.delete("/payments/{payment_id}")
def delete_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete payment"""
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
        
        if total_paid < invoice.total_amount:
            invoice.status = InvoiceStatus.posted
    
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
        "balance": invoice.total_amount - total_paid,
        "payments": [{
            "id": payment.id,
            "amount": payment.amount,
            "payment_method": payment.payment_method,
            "transaction_reference": payment.transaction_reference,
            "payment_date": payment.payment_date.isoformat(),
            "notes": payment.notes
        } for payment in payments]
    }
