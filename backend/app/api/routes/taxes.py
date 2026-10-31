from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.schemas.tax import TaxResponse, TaxCreate, TaxUpdate
from app.models.tax import Tax

router = APIRouter()

@router.get("/taxes", response_model=List[TaxResponse])
def get_taxes(db: Session = Depends(get_db)):
    """Get all taxes"""
    taxes = db.query(Tax).all()
    return taxes

@router.get("/taxes/{tax_id}", response_model=TaxResponse)
def get_tax(tax_id: int, db: Session = Depends(get_db)):
    """Get a specific tax by ID"""
    tax = db.query(Tax).filter(Tax.id == tax_id).first()
    if not tax:
        raise HTTPException(status_code=404, detail="Tax not found")
    return tax

@router.post("/taxes", response_model=TaxResponse)
def create_tax(tax: TaxCreate, db: Session = Depends(get_db)):
    """Create a new tax (Admin only)"""
    # TODO: Add role-based access control check for admin
    db_tax = Tax(**tax.model_dump())
    db.add(db_tax)
    db.commit()
    db.refresh(db_tax)
    return db_tax

@router.put("/taxes/{tax_id}", response_model=TaxResponse)
def update_tax(tax_id: int, tax_update: TaxUpdate, db: Session = Depends(get_db)):
    """Update a tax (Admin only)"""
    # TODO: Add role-based access control check for admin
    db_tax = db.query(Tax).filter(Tax.id == tax_id).first()
    if not db_tax:
        raise HTTPException(status_code=404, detail="Tax not found")
    
    update_data = tax_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tax, key, value)
    
    db.commit()
    db.refresh(db_tax)
    return db_tax

@router.delete("/taxes/{tax_id}")
def delete_tax(tax_id: int, db: Session = Depends(get_db)):
    """Delete a tax (Admin only)"""
    # TODO: Add role-based access control check for admin
    db_tax = db.query(Tax).filter(Tax.id == tax_id).first()
    if not db_tax:
        raise HTTPException(status_code=404, detail="Tax not found")
    
    db.delete(db_tax)
    db.commit()
    return {"message": "Tax deleted successfully"}
