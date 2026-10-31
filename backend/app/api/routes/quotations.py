from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.db.base import get_db
from app.models.quotation import Quotation, QuotationStatus
from app.models.quotation_line import QuotationLine
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.tax import Tax
from app.models.discount import Discount
from app.models.recurring_plan import RecurringPlan, BillingPeriod
from app.models.quotation_template import QuotationTemplate
from app.models.template_line import TemplateLine
from app.models.subscription import Subscription, SubscriptionStatus
from app.schemas import quotation

router = APIRouter()

def generate_quotation_number(db: Session) -> str:
    """Generate auto-incremented quotation number: QT/YYYY/NNNN"""
    current_year = datetime.now().year
    prefix = f"QT/{current_year}/"
    
    # Get the last quotation number for this year
    last_quotation = db.query(Quotation).filter(
        Quotation.number.like(f"{prefix}%")
    ).order_by(Quotation.number.desc()).first()
    
    if last_quotation:
        # Extract the number part and increment
        last_number = int(last_quotation.number.split('/')[-1])
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

def calculate_quotation_totals(db: Session, quotation_id: int):
    """
    Calculate and update quotation totals
    - Subtotal: Sum of all line subtotals (after discount)
    - Tax Amount: Sum of taxes applied to each line
    - Total Amount: Subtotal + Tax Amount
    """
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        return
    
    subtotal = 0.0
    tax_amount = 0.0
    
    for line in quotation.quotation_lines:
        # Line subtotal (already calculated with discount)
        subtotal += line.price_subtotal
        
        # Calculate tax on the discounted subtotal
        if line.tax_id:
            tax = db.query(Tax).filter(Tax.id == line.tax_id).first()
            if tax:
                if tax.type == "percentage":
                    line_tax = line.price_subtotal * (tax.value / 100)
                else:  # fixed
                    line_tax = tax.value
                tax_amount += line_tax
    
    # Update quotation totals
    quotation.subtotal = subtotal
    quotation.tax_amount = tax_amount
    quotation.total_amount = subtotal + tax_amount
    db.commit()

@router.get("/quotations", response_model=List[quotation.Quotation])
def get_quotations(db: Session = Depends(get_db)):
    return db.query(Quotation).order_by(Quotation.id.desc()).all()

@router.get("/quotations/{quotation_id}", response_model=quotation.QuotationDetail)
def get_quotation(quotation_id: int, db: Session = Depends(get_db)):
    db_quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not db_quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    # Get recurring plan name
    recurring_plan_name = None
    if db_quotation.recurring_plan_id:
        plan = db.query(RecurringPlan).filter(RecurringPlan.id == db_quotation.recurring_plan_id).first()
        if plan:
            recurring_plan_name = plan.name
    
    # Build line details
    line_details = []
    for line in db_quotation.quotation_lines:
        product = db.query(Product).filter(Product.id == line.product_id).first()
        variant = None
        variant_name = None
        if line.variant_id:
            variant = db.query(ProductVariant).filter(ProductVariant.id == line.variant_id).first()
            if variant and variant.attribute_value:
                variant_name = f"{variant.attribute_value.attribute.name}: {variant.attribute_value.value}"
        
        tax_name = None
        tax_value = None
        if line.tax_id:
            tax = db.query(Tax).filter(Tax.id == line.tax_id).first()
            if tax:
                tax_name = tax.name
                tax_value = tax.value
        
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
            "tax_name": tax_name,
            "tax_value": tax_value,
            "discount_id": line.discount_id,
            "discount_name": discount_name,
            "discount_value": discount_value,
            "price_subtotal": line.price_subtotal
        })
    
    return {
        **db_quotation.__dict__,
        "recurring_plan_name": recurring_plan_name,
        "quotation_lines": line_details
    }

@router.post("/quotations", response_model=quotation.Quotation)
def create_quotation(quot: quotation.QuotationCreate, db: Session = Depends(get_db)):
    # Generate quotation number
    quotation_number = generate_quotation_number(db)
    
    # Verify recurring plan if provided
    if quot.recurring_plan_id:
        plan = db.query(RecurringPlan).filter(RecurringPlan.id == quot.recurring_plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Recurring plan not found")
    
    # Create quotation
    db_quotation = Quotation(
        number=quotation_number,
        customer_name=quot.customer_name,
        customer_email=quot.customer_email,
        validity_date=quot.validity_date,
        recurring_plan_id=quot.recurring_plan_id,
        status=QuotationStatus.draft
    )
    db.add(db_quotation)
    db.flush()  # Get the quotation ID
    
    # Handle template auto-fill
    lines_to_create = quot.quotation_lines
    if quot.template_id:
        template = db.query(QuotationTemplate).filter(QuotationTemplate.id == quot.template_id).first()
        if template:
            # Auto-fill from template
            lines_to_create = []
            for template_line in template.template_lines:
                product = db.query(Product).filter(Product.id == template_line.product_id).first()
                if product:
                    lines_to_create.append(quotation.QuotationLineCreate(
                        product_id=template_line.product_id,
                        quantity=template_line.quantity,
                        unit_price=product.base_price,
                        tax_id=None,
                        discount_id=None
                    ))
    
    # Create quotation lines with calculations
    for line_data in lines_to_create:
        # Verify product exists
        product = db.query(Product).filter(Product.id == line_data.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {line_data.product_id} not found")
        
        # Get variant extra price if variant selected
        variant_extra_price = 0.0
        if line_data.variant_id:
            variant = db.query(ProductVariant).filter(ProductVariant.id == line_data.variant_id).first()
            if variant:
                variant_extra_price = variant.extra_price
        
        # Get discount if selected
        discount = None
        if line_data.discount_id:
            discount = db.query(Discount).filter(Discount.id == line_data.discount_id).first()
        
        # Calculate line subtotal
        price_subtotal = calculate_line_subtotal(
            line_data.unit_price,
            variant_extra_price,
            line_data.quantity,
            discount
        )
        
        # Create line
        db_line = QuotationLine(
            quotation_id=db_quotation.id,
            product_id=line_data.product_id,
            variant_id=line_data.variant_id,
            quantity=line_data.quantity,
            unit_price=line_data.unit_price,
            tax_id=line_data.tax_id,
            discount_id=line_data.discount_id,
            price_subtotal=price_subtotal
        )
        db.add(db_line)
    
    db.commit()
    
    # Calculate quotation totals
    calculate_quotation_totals(db, db_quotation.id)
    
    db.refresh(db_quotation)
    return db_quotation

@router.put("/quotations/{quotation_id}", response_model=quotation.Quotation)
def update_quotation(quotation_id: int, quot: quotation.QuotationUpdate, db: Session = Depends(get_db)):
    db_quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not db_quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    for key, value in quot.model_dump(exclude_unset=True).items():
        setattr(db_quotation, key, value)
    
    db.commit()
    db.refresh(db_quotation)
    return db_quotation

@router.patch("/quotations/{quotation_id}/status", response_model=quotation.Quotation)
def update_quotation_status(
    quotation_id: int,
    status_update: quotation.QuotationStatusUpdate,
    db: Session = Depends(get_db)
):
    db_quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not db_quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    db_quotation.status = status_update.status
    db.commit()
    db.refresh(db_quotation)
    return db_quotation

@router.delete("/quotations/{quotation_id}")
def delete_quotation(quotation_id: int, db: Session = Depends(get_db)):
    db_quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not db_quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    db.delete(db_quotation)
    db.commit()
    return {"message": "Quotation deleted successfully"}


def calculate_next_billing_date(start_date, billing_period: BillingPeriod):
    """Calculate next billing date based on billing period"""
    if billing_period == BillingPeriod.weeks:
        return start_date + timedelta(weeks=1)
    elif billing_period == BillingPeriod.month:
        # Add one month
        month = start_date.month
        year = start_date.year
        if month == 12:
            month = 1
            year += 1
        else:
            month += 1
        return start_date.replace(year=year, month=month)
    elif billing_period == BillingPeriod.year:
        return start_date.replace(year=start_date.year + 1)
    return start_date

@router.post("/quotations/{quotation_id}/sign", response_model=quotation.Quotation)
def sign_quotation(
    quotation_id: int,
    signature: quotation.QuotationSignature,
    db: Session = Depends(get_db)
):
    """
    Sign a quotation and automatically create a subscription
    - Saves signature data and signer information
    - Changes status from 'sent' to 'confirmed'
    - Creates a new subscription record
    """
    db_quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not db_quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    # Verify quotation is in 'sent' status
    if db_quotation.status != QuotationStatus.sent:
        raise HTTPException(
            status_code=400,
            detail=f"Quotation must be in 'sent' status to sign. Current status: {db_quotation.status}"
        )
    
    # Save signature data
    db_quotation.signature_data = signature.signature_data
    db_quotation.signed_by = signature.signed_by
    db_quotation.signed_at = datetime.now()
    db_quotation.status = QuotationStatus.confirmed
    
    # Create subscription automatically
    start_date = datetime.now().date()
    next_billing_date = None
    
    # Calculate next billing date if recurring plan exists
    if db_quotation.recurring_plan_id:
        plan = db.query(RecurringPlan).filter(RecurringPlan.id == db_quotation.recurring_plan_id).first()
        if plan:
            next_billing_date = calculate_next_billing_date(start_date, plan.billing_period)
    
    # Check if subscription already exists
    existing_subscription = db.query(Subscription).filter(
        Subscription.quotation_id == quotation_id
    ).first()
    
    if not existing_subscription:
        db_subscription = Subscription(
            quotation_id=quotation_id,
            start_date=start_date,
            status=SubscriptionStatus.active,
            next_billing_date=next_billing_date
        )
        db.add(db_subscription)
    
    db.commit()
    db.refresh(db_quotation)
    
    return db_quotation

@router.get("/public/quotations/{quotation_id}", response_model=quotation.QuotationDetail)
def get_public_quotation(quotation_id: int, db: Session = Depends(get_db)):
    """
    Public endpoint for customer portal - no authentication required
    Returns quotation details for customer review and signing
    """
    return get_quotation(quotation_id, db)
