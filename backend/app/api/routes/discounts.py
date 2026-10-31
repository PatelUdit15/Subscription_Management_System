from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.schemas.discount import DiscountResponse, DiscountCreate, DiscountUpdate
from app.models.discount import Discount

router = APIRouter()

@router.get("/discounts", response_model=List[DiscountResponse])
def get_discounts(db: Session = Depends(get_db)):
    """Get all discounts"""
    discounts = db.query(Discount).all()
    return discounts

@router.get("/discounts/{discount_id}", response_model=DiscountResponse)
def get_discount(discount_id: int, db: Session = Depends(get_db)):
    """Get a specific discount by ID"""
    discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not discount:
        raise HTTPException(status_code=404, detail="Discount not found")
    return discount

@router.post("/discounts", response_model=DiscountResponse)
def create_discount(discount: DiscountCreate, db: Session = Depends(get_db)):
    """Create a new discount (Admin only)"""
    # TODO: Add role-based access control check for admin
    db_discount = Discount(**discount.model_dump())
    db.add(db_discount)
    db.commit()
    db.refresh(db_discount)
    return db_discount

@router.put("/discounts/{discount_id}", response_model=DiscountResponse)
def update_discount(discount_id: int, discount_update: DiscountUpdate, db: Session = Depends(get_db)):
    """Update a discount (Admin only)"""
    # TODO: Add role-based access control check for admin
    db_discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not db_discount:
        raise HTTPException(status_code=404, detail="Discount not found")
    
    update_data = discount_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_discount, key, value)
    
    db.commit()
    db.refresh(db_discount)
    return db_discount

@router.delete("/discounts/{discount_id}")
def delete_discount(discount_id: int, db: Session = Depends(get_db)):
    """Delete a discount (Admin only)"""
    # TODO: Add role-based access control check for admin
    db_discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not db_discount:
        raise HTTPException(status_code=404, detail="Discount not found")
    
    db.delete(db_discount)
    db.commit()
    return {"message": "Discount deleted successfully"}
