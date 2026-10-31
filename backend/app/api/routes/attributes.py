from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.models.user import User
from app.api.routes.auth import require_roles
from app.models.attribute import Attribute
from app.models.attribute_value import AttributeValue
from app.schemas import attribute, attribute_value

router = APIRouter()

# Attribute endpoints
@router.get("/attributes", response_model=List[attribute.Attribute])
def get_attributes(db: Session = Depends(get_db)):
    return db.query(Attribute).all()

@router.post("/attributes", response_model=attribute.Attribute)
def create_attribute(attr: attribute.AttributeCreate, current_user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    db_attr = Attribute(**attr.model_dump())
    db.add(db_attr)
    db.commit()
    db.refresh(db_attr)
    return db_attr

@router.put("/attributes/{attribute_id}", response_model=attribute.Attribute)
def update_attribute(attribute_id: int, attr: attribute.AttributeUpdate, current_user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    db_attr = db.query(Attribute).filter(Attribute.id == attribute_id).first()
    if not db_attr:
        raise HTTPException(status_code=404, detail="Attribute not found")
    
    for key, value in attr.model_dump(exclude_unset=True).items():
        setattr(db_attr, key, value)
    
    db.commit()
    db.refresh(db_attr)
    return db_attr

@router.delete("/attributes/{attribute_id}")
def delete_attribute(attribute_id: int, current_user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    db_attr = db.query(Attribute).filter(Attribute.id == attribute_id).first()
    if not db_attr:
        raise HTTPException(status_code=404, detail="Attribute not found")
    
    db.delete(db_attr)
    db.commit()
    return {"message": "Attribute deleted successfully"}

# Attribute Value endpoints
@router.get("/attribute-values", response_model=List[attribute_value.AttributeValue])
def get_attribute_values(attribute_id: int = None, db: Session = Depends(get_db)):
    query = db.query(AttributeValue)
    if attribute_id:
        query = query.filter(AttributeValue.attribute_id == attribute_id)
    return query.all()

@router.post("/attribute-values", response_model=attribute_value.AttributeValue)
def create_attribute_value(value: attribute_value.AttributeValueCreate, current_user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    db_value = AttributeValue(**value.model_dump())
    db.add(db_value)
    db.commit()
    db.refresh(db_value)
    return db_value

@router.put("/attribute-values/{value_id}", response_model=attribute_value.AttributeValue)
def update_attribute_value(value_id: int, value: attribute_value.AttributeValueUpdate, current_user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    db_value = db.query(AttributeValue).filter(AttributeValue.id == value_id).first()
    if not db_value:
        raise HTTPException(status_code=404, detail="Attribute value not found")
    
    for key, val in value.model_dump(exclude_unset=True).items():
        setattr(db_value, key, val)
    
    db.commit()
    db.refresh(db_value)
    return db_value

@router.delete("/attribute-values/{value_id}")
def delete_attribute_value(value_id: int, current_user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    db_value = db.query(AttributeValue).filter(AttributeValue.id == value_id).first()
    if not db_value:
        raise HTTPException(status_code=404, detail="Attribute value not found")
    
    db.delete(db_value)
    db.commit()
    return {"message": "Attribute value deleted successfully"}
