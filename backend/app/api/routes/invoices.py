from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.db.base import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.invoice_line import InvoiceLine
from app.models.subscription import Subscription
from app.models.quotation import Quotation
from app.models.quotation_line import QuotationLine
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.tax import Tax
from app.models.discount import Discount
from app.schemas import invoice

router = APIRouter()

def generate_invoice_number(db: Session) -> str:
    """Generate auto-incremented invoice number: INV/YYYY/NNNN"""
    current_year = datetime.now().year
    prefix = f"INV/{current_year}/"
    
    # Get the last invoice number for this year
    last_invoice = db.query(Invoice).filter(
        Invoice.number.like(f"{prefix}%")
    ).order_by(Invoice.number.desc()).first()
    
    if last_invoice:
        # Extract the number part and increment
        last_number = int(last_invoice.number.split('/')[-1])
        new_number = last_number + 1
    else:
        new_number = 1
    
    return f"{prefix}{new_number:04d}"

def calculate_line_subtotal(
    unit_price: float,
    variant_extra_price: float,
    quantity: float,
    discount: Discount = None
) -> float:
    """
    Calculate line subtotal with discount applied
    Formula: (Unit Price + Variant Extra) × Qty - Discount
    """
    # Base price including variant
    base_price = (unit_price + variant_extra_price) * quantity
    
    # Apply discount if exists
    if discount:
        if discount.type == "percentage":
            discount_amount = base_price * (discount.value / 100)
        else:  # fixed
            discount_amount = discount.value
        
        return max(0, base_price - discount_amount)
    
    return base_price

def calculate_invoice_total(db: Session, invoice_id: int):
    """
    Calculate and update invoice total
    - Total: Sum of all line subtotals + taxes
    """
    invoice_obj = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice_obj:
        return
    
    total_amount = 0.0
    default_tax = db.query(Tax).filter(Tax.is_active == True).first()
    
    for line in invoice_obj.invoice_lines:
        line_subtotal = float(line.price_subtotal or 0.0)
        line_tax = 0.0
        
        # Calculate tax on the subtotal
        if line.tax_id:
            tax = db.query(Tax).filter(Tax.id == line.tax_id).first()
            if tax:
                if tax.type == "percentage":
                    line_tax = line_subtotal * (tax.value / 100.0)
                else:  # fixed
                    line_tax = tax.value
                line.tax_rate = tax.value
        elif getattr(line, 'tax_rate', None) and float(line.tax_rate) > 0:
            line_tax = line_subtotal * (float(line.tax_rate) / 100.0)
        elif default_tax:
            line.tax_id = default_tax.id
            line.tax_rate = default_tax.value
            if default_tax.type == "percentage":
                line_tax = line_subtotal * (default_tax.value / 100.0)
            else:
                line_tax = default_tax.value
        
        total_amount += (line_subtotal + line_tax)
    
    # Update invoice total
    invoice_obj.total_amount = round(total_amount, 2)
    db.commit()

@router.get("/invoices", response_model=List[invoice.Invoice])
def get_invoices(db: Session = Depends(get_db)):
    """Get all invoices"""
    return db.query(Invoice).order_by(Invoice.id.desc()).all()

@router.get("/invoices/{invoice_id}")
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Get invoice details with line items including calculated taxes"""
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Build line details
    line_details = []
    total_tax_amount = 0.0
    subtotal_amount = 0.0
    default_tax = db.query(Tax).filter(Tax.is_active == True).first()

    for line in db_invoice.invoice_lines:
        product = db.query(Product).filter(Product.id == line.product_id).first()
        variant = None
        variant_name = None
        if line.variant_id:
            variant = db.query(ProductVariant).filter(ProductVariant.id == line.variant_id).first()
            if variant and variant.attribute_value:
                variant_name = f"{variant.attribute_value.attribute.name}: {variant.attribute_value.value}"
        
        tax_name = None
        tax_value = 0.0
        if line.tax_id:
            tax = db.query(Tax).filter(Tax.id == line.tax_id).first()
            if tax:
                tax_name = tax.name
                tax_value = tax.value
        elif getattr(line, 'tax_rate', None) and float(line.tax_rate) > 0:
            tax_value = float(line.tax_rate)
            tax_name = f"Tax ({tax_value}%)"
        elif default_tax:
            tax_name = default_tax.name
            tax_value = default_tax.value

        line_sub = float(line.price_subtotal or 0.0)
        line_tax = line_sub * (tax_value / 100.0)
        total_tax_amount += line_tax
        subtotal_amount += line_sub
        
        discount_name = None
        discount_value = None
        if line.discount_id:
            discount = db.query(Discount).filter(Discount.id == line.discount_id).first()
            if discount:
                discount_name = discount.name
                discount_value = discount.value
        
        line_details.append({
            "id": line.id,
            "product_id": line.product_id,
            "product_name": product.name if product else "Unknown",
            "variant_id": line.variant_id,
            "variant_name": variant_name,
            "quantity": line.quantity,
            "unit_price": line.unit_price,
            "tax_id": line.tax_id,
            "tax_rate": tax_value,
            "tax_name": tax_name,
            "tax_value": tax_value,
            "tax_amount": round(line_tax, 2),
            "discount_id": line.discount_id,
            "discount_name": discount_name,
            "discount_value": discount_value,
            "price_subtotal": line.price_subtotal,
            "total_with_tax": round(line_sub + line_tax, 2)
        })
    
    return {
        "id": db_invoice.id,
        "number": db_invoice.number,
        "customer_name": db_invoice.customer_name,
        "date_issued": db_invoice.date_issued.isoformat() if db_invoice.date_issued else None,
        "due_date": db_invoice.due_date.isoformat() if db_invoice.due_date else None,
        "subscription_id": db_invoice.subscription_id,
        "status": db_invoice.status.value if hasattr(db_invoice.status, 'value') else db_invoice.status,
        "notes": db_invoice.notes,
        "subtotal": round(subtotal_amount, 2),
        "tax_amount": round(total_tax_amount, 2),
        "total_amount": round(subtotal_amount + total_tax_amount, 2),
        "invoice_lines": line_details
    }

@router.post("/subscriptions/{subscription_id}/generate-invoice", response_model=invoice.Invoice)
def generate_invoice_from_subscription(subscription_id: int, db: Session = Depends(get_db)):
    """
    Auto-generate invoice from subscription
    - Copies items, prices, taxes, and discounts from the subscription's quotation
    - Creates invoice with 'posted' status
    - Sets due date to 30 days from issue date
    """
    # Get subscription
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Get quotation
    quotation = db.query(Quotation).filter(Quotation.id == subscription.quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found for subscription")
    
    # Generate invoice number
    invoice_number = generate_invoice_number(db)
    
    # Create invoice
    date_issued = datetime.now().date()
    due_date = date_issued + timedelta(days=30)
    
    db_invoice = Invoice(
        number=invoice_number,
        subscription_id=subscription_id,
        customer_name=quotation.customer_name,
        date_issued=date_issued,
        due_date=due_date,
        total_amount=0.0,
        status=InvoiceStatus.posted
    )
    db.add(db_invoice)
    db.flush()  # Get the invoice ID
    
    # Copy quotation lines to invoice lines
    for quot_line in quotation.quotation_lines:
        # Get variant extra price if variant selected
        variant_extra_price = 0.0
        if quot_line.variant_id:
            variant = db.query(ProductVariant).filter(ProductVariant.id == quot_line.variant_id).first()
            if variant:
                variant_extra_price = variant.extra_price
        
        # Get discount if selected
        discount = None
        if quot_line.discount_id:
            discount = db.query(Discount).filter(Discount.id == quot_line.discount_id).first()
        
        # Calculate line subtotal
        price_subtotal = calculate_line_subtotal(
            quot_line.unit_price,
            variant_extra_price,
            quot_line.quantity,
            discount
        )
        
        # Create invoice line
        db_line = InvoiceLine(
            invoice_id=db_invoice.id,
            product_id=quot_line.product_id,
            variant_id=quot_line.variant_id,
            quantity=quot_line.quantity,
            unit_price=quot_line.unit_price,
            tax_id=quot_line.tax_id,
            discount_id=quot_line.discount_id,
            price_subtotal=price_subtotal
        )
        db.add(db_line)
    
    db.commit()
    
    # Calculate invoice total
    calculate_invoice_total(db, db_invoice.id)
    
    db.refresh(db_invoice)
    return db_invoice

@router.post("/invoices/{invoice_id}/confirm")
def confirm_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """
    Confirm invoice - generates invoice number and changes status to confirmed
    """
    try:
        db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not db_invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Check if already confirmed
        if db_invoice.status != InvoiceStatus.draft:
            raise HTTPException(
                status_code=400, 
                detail=f"Invoice is already {db_invoice.status.value}. Only draft invoices can be confirmed."
            )
        
        # Generate invoice number if not already set
        if not db_invoice.number:
            db_invoice.number = generate_invoice_number(db)
        
        # Update status to posted (confirmed)
        db_invoice.status = InvoiceStatus.posted
        
        db.commit()
        db.refresh(db_invoice)
        
        return {
            "id": db_invoice.id,
            "number": db_invoice.number,
            "status": db_invoice.status.value,
            "message": "Invoice confirmed successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error confirming invoice: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to confirm invoice: {str(e)}")

@router.post("/invoices/{invoice_id}/send")
def send_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Send invoice to customer via email"""
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # TODO: Implement email sending logic
    # For now, just return success
    return {
        "message": "Invoice sent successfully",
        "invoice_number": db_invoice.number,
        "customer": db_invoice.customer_name
    }

@router.post("/invoices")
def create_invoice(invoice_data: invoice.InvoiceCreate, db: Session = Depends(get_db)):
    """Create a new invoice"""
    # Create invoice
    db_invoice = Invoice(
        customer_name=invoice_data.customer_name,
        date_issued=invoice_data.date_issued,
        due_date=invoice_data.due_date,
        total_amount=invoice_data.total_amount,
        status=InvoiceStatus.draft,
        notes=invoice_data.notes if invoice_data.notes else None
    )
    db.add(db_invoice)
    db.flush()
    
    # Create invoice lines
    for line_data in invoice_data.lines:
        subtotal = line_data.quantity * line_data.unit_price
        tax_amount = subtotal * (line_data.tax_rate / 100) if line_data.tax_rate else 0
        
        db_line = InvoiceLine(
            invoice_id=db_invoice.id,
            product_id=line_data.product_id,
            description=line_data.description,
            quantity=line_data.quantity,
            unit_price=line_data.unit_price,
            tax_rate=line_data.tax_rate if line_data.tax_rate else 0,
            price_subtotal=subtotal + tax_amount
        )
        db.add(db_line)
    
    db.commit()
    db.refresh(db_invoice)
    
    return {"id": db_invoice.id, "status": db_invoice.status.value}

@router.put("/invoices/{invoice_id}")
def update_invoice(invoice_id: int, invoice_data: invoice.InvoiceCreate, db: Session = Depends(get_db)):
    """Update an existing invoice"""
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Update invoice fields
    db_invoice.customer_name = invoice_data.customer_name
    db_invoice.date_issued = invoice_data.date_issued
    db_invoice.due_date = invoice_data.due_date
    db_invoice.total_amount = invoice_data.total_amount
    if hasattr(invoice_data, 'notes'):
        db_invoice.notes = invoice_data.notes
    
    # Delete existing lines
    db.query(InvoiceLine).filter(InvoiceLine.invoice_id == invoice_id).delete()
    
    # Create new lines
    for line_data in invoice_data.lines:
        db_line = InvoiceLine(
            invoice_id=db_invoice.id,
            product_id=line_data.product_id,
            description=line_data.description,
            quantity=line_data.quantity,
            unit_price=line_data.unit_price,
            tax_rate=line_data.tax_rate if hasattr(line_data, 'tax_rate') else 0,
            subtotal=line_data.quantity * line_data.unit_price * (1 + (line_data.tax_rate if hasattr(line_data, 'tax_rate') else 0) / 100)
        )
        db.add(db_line)
    
    db.commit()
    db.refresh(db_invoice)
    
    return {"id": db_invoice.id, "status": db_invoice.status.value}

@router.patch("/invoices/{invoice_id}/status", response_model=invoice.Invoice)
def update_invoice_status(
    invoice_id: int,
    status_update: invoice.InvoiceStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update invoice status (e.g., mark as paid)"""
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    db_invoice.status = status_update.status
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@router.delete("/invoices/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Delete an invoice"""
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    db.delete(db_invoice)
    db.commit()
    return {"message": "Invoice deleted successfully"}
