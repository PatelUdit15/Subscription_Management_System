from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date, timedelta
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
from app.models.subscription_line import SubscriptionLine
from app.models.customer import Customer
from app.schemas import quotation
from app.api.routes.subscriptions import generate_subscription_number, advance_billing_date

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
    base_price = (unit_price + variant_extra_price) * quantity
    
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
    quotation_obj = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation_obj:
        return
    
    subtotal = 0.0
    tax_amount = 0.0
    
    for line in quotation_obj.quotation_lines:
        subtotal += line.price_subtotal
        
        if line.tax_id:
            tax = db.query(Tax).filter(Tax.id == line.tax_id).first()
            if tax:
                if tax.type == "percentage":
                    line_tax = line.price_subtotal * (tax.value / 100)
                else:
                    line_tax = tax.value
                tax_amount += line_tax
    
    quotation_obj.subtotal = subtotal
    quotation_obj.tax_amount = tax_amount
    quotation_obj.total_amount = subtotal + tax_amount
    db.commit()

def create_subscription_from_quotation(db: Session, quotation_obj: Quotation) -> Subscription:
    """Helper to convert a confirmed quotation into an active subscription"""
    existing = db.query(Subscription).filter(Subscription.quotation_id == quotation_obj.id).first()
    if existing:
        return existing

    customer = None
    if quotation_obj.customer_email:
        customer = db.query(Customer).filter(Customer.email == quotation_obj.customer_email).first()
    if not customer and quotation_obj.customer_name:
        customer = db.query(Customer).filter(Customer.name == quotation_obj.customer_name).first()
    
    if not customer and quotation_obj.customer_name:
        customer = Customer(
            name=quotation_obj.customer_name,
            email=quotation_obj.customer_email or f"customer_{quotation_obj.id}@brightloop.com",
            phone="N/A",
            address="N/A"
        )
        db.add(customer)
        db.flush()

    customer_id = customer.id if customer else None

    # First line product or fallback
    first_line = quotation_obj.quotation_lines[0] if quotation_obj.quotation_lines else None
    product_id = first_line.product_id if first_line else 1
    
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        prod = db.query(Product).first()
        product_id = prod.id if prod else 1

    plan_id = quotation_obj.recurring_plan_id
    if not plan_id:
        default_plan = db.query(RecurringPlan).first()
        plan_id = default_plan.id if default_plan else 1

    plan = db.query(RecurringPlan).filter(RecurringPlan.id == plan_id).first()
    today = date.today()
    period_str = plan.billing_period if plan else 'monthly'
    next_billing = advance_billing_date(today, period_str)

    sub_number = generate_subscription_number(db)

    new_sub = Subscription(
        number=sub_number,
        quotation_id=quotation_obj.id,
        customer_id=customer_id,
        product_id=product_id,
        recurring_plan_id=plan_id,
        start_date=today,
        next_billing_date=next_billing,
        status=SubscriptionStatus.active,
        recurring_amount=float(quotation_obj.total_amount or 0.0),
        signature_data=quotation_obj.signature_data,
        signed_by=quotation_obj.signed_by,
        signed_at=quotation_obj.signed_at or datetime.now()
    )
    db.add(new_sub)
    db.flush()

    for q_line in quotation_obj.quotation_lines:
        s_line = SubscriptionLine(
            subscription_id=new_sub.id,
            product_id=q_line.product_id,
            variant_id=q_line.variant_id,
            description=f"From Quote {quotation_obj.number}",
            quantity=q_line.quantity,
            unit_price=q_line.unit_price,
            discount=0.0,
            tax_rate=0.0,
            subtotal=q_line.price_subtotal
        )
        db.add(s_line)

    db.commit()
    db.refresh(new_sub)
    return new_sub

@router.get("/quotations", response_model=List[quotation.Quotation])
def get_quotations(db: Session = Depends(get_db)):
    return db.query(Quotation).order_by(Quotation.id.desc()).all()

@router.get("/quotations/{quotation_id}", response_model=quotation.QuotationDetail)
def get_quotation(quotation_id: int, db: Session = Depends(get_db)):
    db_quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not db_quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    recurring_plan_name = None
    if db_quotation.recurring_plan_id:
        plan = db.query(RecurringPlan).filter(RecurringPlan.id == db_quotation.recurring_plan_id).first()
        if plan:
            recurring_plan_name = plan.name
    
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
    if quot.recurring_plan_id:
        plan = db.query(RecurringPlan).filter(RecurringPlan.id == quot.recurring_plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Recurring plan not found")
    
    quotation_number = generate_quotation_number(db)
    
    quotation_data = quot.model_dump(exclude={'quotation_lines', 'template_id'})
    db_quotation = Quotation(
        **quotation_data,
        number=quotation_number,
        status=QuotationStatus.draft
    )
    db.add(db_quotation)
    db.flush()
    
    lines_to_add = []
    
    if quot.template_id:
        template = db.query(QuotationTemplate).filter(QuotationTemplate.id == quot.template_id).first()
        if template:
            for t_line in template.template_lines:
                product = db.query(Product).filter(Product.id == t_line.product_id).first()
                if product:
                    lines_to_add.append({
                        "product_id": t_line.product_id,
                        "variant_id": None,
                        "quantity": t_line.quantity,
                        "unit_price": product.base_price,
                        "tax_id": None,
                        "discount_id": None
                    })
    
    if quot.quotation_lines:
        for line_data in quot.quotation_lines:
            lines_to_add.append(line_data.model_dump())
    
    for line_data in lines_to_add:
        product = db.query(Product).filter(Product.id == line_data['product_id']).first()
        if not product:
            continue
        
        variant_extra_price = 0.0
        if line_data.get('variant_id'):
            variant = db.query(ProductVariant).filter(ProductVariant.id == line_data['variant_id']).first()
            if variant:
                variant_extra_price = variant.extra_price
        
        discount = None
        if line_data.get('discount_id'):
            discount = db.query(Discount).filter(Discount.id == line_data['discount_id']).first()
        
        price_subtotal = calculate_line_subtotal(
            unit_price=line_data['unit_price'],
            variant_extra_price=variant_extra_price,
            quantity=line_data['quantity'],
            discount=discount
        )
        
        db_line = QuotationLine(
            quotation_id=db_quotation.id,
            product_id=line_data['product_id'],
            variant_id=line_data.get('variant_id'),
            quantity=line_data['quantity'],
            unit_price=line_data['unit_price'],
            tax_id=line_data.get('tax_id'),
            discount_id=line_data.get('discount_id'),
            price_subtotal=price_subtotal
        )
        db.add(db_line)
    
    db.commit()
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
    if status_update.status == QuotationStatus.confirmed:
        create_subscription_from_quotation(db, db_quotation)
    
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

@router.post("/quotations/{quotation_id}/sign", response_model=quotation.Quotation)
def sign_quotation(
    quotation_id: int,
    signature: quotation.QuotationSignature,
    db: Session = Depends(get_db)
):
    """
    Sign a quotation and automatically create an active subscription
    """
    db_quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not db_quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    if db_quotation.status != QuotationStatus.sent:
        raise HTTPException(
            status_code=400,
            detail=f"Quotation must be in 'sent' status to sign. Current status: {db_quotation.status}"
        )
    
    db_quotation.signature_data = signature.signature_data
    db_quotation.signed_by = signature.signed_by
    db_quotation.signed_at = datetime.now()
    db_quotation.status = QuotationStatus.confirmed
    
    create_subscription_from_quotation(db, db_quotation)
    
    db.commit()
    db.refresh(db_quotation)
    return db_quotation

@router.get("/public/quotations/{quotation_id}", response_model=quotation.QuotationDetail)
def get_public_quotation(quotation_id: int, db: Session = Depends(get_db)):
    return get_quotation(quotation_id, db)
