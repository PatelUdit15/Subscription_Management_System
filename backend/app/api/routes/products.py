from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.attribute_value import AttributeValue
from app.models.attribute import Attribute
from app.schemas import product

router = APIRouter()

@router.get("/products", response_model=List[product.Product])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

@router.get("/products/{product_id}", response_model=product.ProductDetail)
def get_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Build variant details with attribute information
    variant_details = []
    for variant in db_product.variants:
        attr_value = db.query(AttributeValue).filter(AttributeValue.id == variant.attribute_value_id).first()
        if attr_value:
            attr = db.query(Attribute).filter(Attribute.id == attr_value.attribute_id).first()
            variant_details.append({
                "id": variant.id,
                "attribute_value_id": variant.attribute_value_id,
                "attribute_name": attr.name if attr else "Unknown",
                "attribute_value": attr_value.value,
                "extra_price": variant.extra_price,
                "total_price": db_product.base_price + variant.extra_price
            })
    
    return {
        **db_product.__dict__,
        "variants": variant_details
    }

@router.post("/products", response_model=product.Product)
def create_product(prod: product.ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**prod.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/products/{product_id}", response_model=product.Product)
def update_product(product_id: int, prod: product.ProductUpdate, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in prod.model_dump(exclude_unset=True).items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}

# Product Variant endpoints
@router.post("/products/{product_id}/variants", response_model=product.ProductVariant)
def create_product_variant(product_id: int, variant: product.ProductVariantCreate, db: Session = Depends(get_db)):
    # Verify product exists
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Verify attribute value exists
    db_attr_value = db.query(AttributeValue).filter(AttributeValue.id == variant.attribute_value_id).first()
    if not db_attr_value:
        raise HTTPException(status_code=404, detail="Attribute value not found")
    
    # Check if variant already exists
    existing = db.query(ProductVariant).filter(
        ProductVariant.product_id == product_id,
        ProductVariant.attribute_value_id == variant.attribute_value_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Variant with this attribute value already exists")
    
    db_variant = ProductVariant(**variant.model_dump())
    db.add(db_variant)
    db.commit()
    db.refresh(db_variant)
    return db_variant

@router.put("/variants/{variant_id}", response_model=product.ProductVariant)
def update_product_variant(variant_id: int, variant: product.ProductVariantUpdate, db: Session = Depends(get_db)):
    db_variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not db_variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    for key, value in variant.model_dump(exclude_unset=True).items():
        setattr(db_variant, key, value)
    
    db.commit()
    db.refresh(db_variant)
    return db_variant

@router.delete("/variants/{variant_id}")
def delete_product_variant(variant_id: int, db: Session = Depends(get_db)):
    db_variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not db_variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    db.delete(db_variant)
    db.commit()
    return {"message": "Variant deleted successfully"}

@router.get("/products/{product_id}/options")
def get_product_options(product_id: int, db: Session = Depends(get_db)):
    """
    Get product details with all configuration options:
    - Base product details
    - Available variants with extra prices
    - Active recurring plans
    """
    # Get product
    product_obj = db.query(Product).filter(Product.id == product_id).first()
    if not product_obj:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get variants with attribute details
    variants = []
    for variant in product_obj.variants:
        if variant.attribute_value:
            variants.append({
                "id": variant.id,
                "attribute_id": variant.attribute_value.attribute_id,
                "attribute_name": variant.attribute_value.attribute.name,
                "value_id": variant.attribute_value.id,
                "value_name": variant.attribute_value.value,
                "extra_price": variant.extra_price
            })
    
    # Get active recurring plans
    from app.models.recurring_plan import RecurringPlan
    plans = db.query(RecurringPlan).all()
    recurring_plans = []
    for plan in plans:
        # Calculate duration in months
        duration_months = 1
        if plan.billing_period == "month":
            duration_months = 1
        elif plan.billing_period == "year":
            duration_months = 12
        elif plan.billing_period == "weeks":
            duration_months = 0.25
        
        recurring_plans.append({
            "id": plan.id,
            "name": plan.name,
            "billing_period": plan.billing_period,
            "duration_months": duration_months
        })
    
    return {
        "product": {
            "id": product_obj.id,
            "name": product_obj.name,
            "description": product_obj.description,
            "type": product_obj.type,
            "base_price": product_obj.base_price
        },
        "variants": variants,
        "recurring_plans": recurring_plans
    }
