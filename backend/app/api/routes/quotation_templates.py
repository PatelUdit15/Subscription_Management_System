from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.models.quotation_template import QuotationTemplate
from app.models.template_line import TemplateLine
from app.models.recurring_plan import RecurringPlan
from app.models.product import Product
from app.schemas import quotation_template

router = APIRouter()

@router.get("/quotation-templates", response_model=List[quotation_template.QuotationTemplate])
def get_quotation_templates(db: Session = Depends(get_db)):
    return db.query(QuotationTemplate).all()

@router.get("/quotation-templates/{template_id}", response_model=quotation_template.QuotationTemplateDetail)
def get_quotation_template(template_id: int, db: Session = Depends(get_db)):
    db_template = db.query(QuotationTemplate).filter(QuotationTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Quotation template not found")
    
    # Get recurring plan name
    recurring_plan_name = None
    if db_template.recurring_plan_id:
        plan = db.query(RecurringPlan).filter(RecurringPlan.id == db_template.recurring_plan_id).first()
        if plan:
            recurring_plan_name = plan.name
    
    # Build template line details
    line_details = []
    total_amount = 0.0
    
    for line in db_template.template_lines:
        product = db.query(Product).filter(Product.id == line.product_id).first()
        if product:
            line_total = product.base_price * line.quantity
            total_amount += line_total
            
            line_details.append({
                "id": line.id,
                "product_id": line.product_id,
                "product_name": product.name,
                "quantity": line.quantity,
                "unit_price": product.base_price,
                "total_price": line_total
            })
    
    return {
        **db_template.__dict__,
        "recurring_plan_name": recurring_plan_name,
        "template_lines": line_details,
        "total_amount": total_amount
    }

@router.post("/quotation-templates", response_model=quotation_template.QuotationTemplate)
def create_quotation_template(template: quotation_template.QuotationTemplateCreate, db: Session = Depends(get_db)):
    # Verify recurring plan exists if provided
    if template.recurring_plan_id:
        plan = db.query(RecurringPlan).filter(RecurringPlan.id == template.recurring_plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Recurring plan not found")
    
    # Verify all products exist
    for line in template.template_lines:
        product = db.query(Product).filter(Product.id == line.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id {line.product_id} not found")
    
    # Create template
    template_data = template.model_dump(exclude={'template_lines'})
    db_template = QuotationTemplate(**template_data)
    db.add(db_template)
    db.flush()  # Get the template ID
    
    # Create template lines
    for line in template.template_lines:
        db_line = TemplateLine(
            template_id=db_template.id,
            product_id=line.product_id,
            quantity=line.quantity
        )
        db.add(db_line)
    
    db.commit()
    db.refresh(db_template)
    return db_template

@router.put("/quotation-templates/{template_id}", response_model=quotation_template.QuotationTemplate)
def update_quotation_template(template_id: int, template: quotation_template.QuotationTemplateUpdate, db: Session = Depends(get_db)):
    db_template = db.query(QuotationTemplate).filter(QuotationTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Quotation template not found")
    
    # Verify recurring plan exists if provided
    if template.recurring_plan_id:
        plan = db.query(RecurringPlan).filter(RecurringPlan.id == template.recurring_plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Recurring plan not found")
    
    for key, value in template.model_dump(exclude_unset=True).items():
        setattr(db_template, key, value)
    
    db.commit()
    db.refresh(db_template)
    return db_template

@router.delete("/quotation-templates/{template_id}")
def delete_quotation_template(template_id: int, db: Session = Depends(get_db)):
    db_template = db.query(QuotationTemplate).filter(QuotationTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Quotation template not found")
    
    db.delete(db_template)
    db.commit()
    return {"message": "Quotation template deleted successfully"}

# Template Line endpoints
@router.post("/quotation-templates/{template_id}/lines", response_model=quotation_template.TemplateLine)
def add_template_line(template_id: int, line: quotation_template.TemplateLineCreate, db: Session = Depends(get_db)):
    # Verify template exists
    db_template = db.query(QuotationTemplate).filter(QuotationTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Quotation template not found")
    
    # Verify product exists
    product = db.query(Product).filter(Product.id == line.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db_line = TemplateLine(
        template_id=template_id,
        product_id=line.product_id,
        quantity=line.quantity
    )
    db.add(db_line)
    db.commit()
    db.refresh(db_line)
    return db_line

@router.delete("/template-lines/{line_id}")
def delete_template_line(line_id: int, db: Session = Depends(get_db)):
    db_line = db.query(TemplateLine).filter(TemplateLine.id == line_id).first()
    if not db_line:
        raise HTTPException(status_code=404, detail="Template line not found")
    
    db.delete(db_line)
    db.commit()
    return {"message": "Template line deleted successfully"}
