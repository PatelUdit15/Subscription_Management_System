from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.schemas.discount import DiscountResponse, DiscountCreate, DiscountUpdate
from app.models.discount import Discount
from app.models.user import User, UserRole
from app.api.routes.auth import get_current_user

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the user has an admin role"""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required. Only admins can manage discounts."
        )
    return current_user

def enrich_discount(d: Discount) -> dict:
    data = {
        "id": d.id,
        "name": d.name,
        "type": d.type,
        "value": d.value,
        "min_purchase_amount": d.min_purchase_amount,
        "min_quantity": getattr(d, 'min_quantity', 0),
        "start_date": d.start_date,
        "end_date": d.end_date,
        "usage_limit": getattr(d, 'usage_limit', 0),
        "times_used": getattr(d, 'times_used', 0),
        "apply_to": getattr(d, 'apply_to', 'all'),
        "product_id": getattr(d, 'product_id', None),
        "product_name": d.product.name if getattr(d, 'product', None) else None,
        "is_active": d.is_active
    }
    return data

@router.get("/discounts", response_model=List[DiscountResponse])
def get_discounts(db: Session = Depends(get_db)):
    """Get all discounts"""
    discounts = db.query(Discount).all()
    return [enrich_discount(d) for d in discounts]

@router.get("/discounts/{discount_id}", response_model=DiscountResponse)
def get_discount(discount_id: int, db: Session = Depends(get_db)):
    """Get a specific discount by ID"""
    discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not discount:
        raise HTTPException(status_code=404, detail="Discount not found")
    return enrich_discount(discount)

@router.post("/discounts", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
def create_discount(
    discount: DiscountCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new discount rule (Admin only)"""
    db_discount = Discount(**discount.model_dump())
    db.add(db_discount)
    db.commit()
    db.refresh(db_discount)
    return enrich_discount(db_discount)

@router.put("/discounts/{discount_id}", response_model=DiscountResponse)
def update_discount(
    discount_id: int,
    discount_update: DiscountUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update a discount rule (Admin only)"""
    db_discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not db_discount:
        raise HTTPException(status_code=404, detail="Discount not found")
    
    update_data = discount_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_discount, key, value)
    
    db.commit()
    db.refresh(db_discount)
    return enrich_discount(db_discount)

@router.delete("/discounts/{discount_id}")
def delete_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a discount rule (Admin only)"""
    db_discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not db_discount:
        raise HTTPException(status_code=404, detail="Discount not found")
    
    db.delete(db_discount)
    db.commit()
    return {"message": "Discount deleted successfully", "id": discount_id}
