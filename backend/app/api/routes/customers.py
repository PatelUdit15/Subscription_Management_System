from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.db.base import get_db
from app.models.customer import Customer
from app.api.routes.auth import get_current_user
from app.models.user import User

router = APIRouter()

print("=" * 50)
print("CUSTOMERS ROUTER LOADED!")
print("=" * 50)

@router.get("/test-customers")
def test_route():
    return {"message": "Customers router is working!"}

class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company_name: Optional[str] = None
    address: Optional[str] = None
    gst_number: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    address: Optional[str] = None
    gst_number: Optional[str] = None

@router.get("/customers")
def get_customers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all customers"""
    customers = db.query(Customer).order_by(Customer.created_at.desc()).all()
    
    return [{
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "company_name": customer.company_name,
        "address": customer.address,
        "gst_number": customer.gst_number,
        "created_at": customer.created_at.isoformat()
    } for customer in customers]

@router.get("/customers/{customer_id}")
def get_customer(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get customer by ID"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "company_name": customer.company_name,
        "address": customer.address,
        "gst_number": customer.gst_number,
        "created_at": customer.created_at.isoformat()
    }

@router.post("/customers")
def create_customer(
    customer_data: CustomerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new customer"""
    # Check if email already exists
    existing = db.query(Customer).filter(Customer.email == customer_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    customer = Customer(
        name=customer_data.name,
        email=customer_data.email,
        phone=customer_data.phone,
        company_name=customer_data.company_name,
        address=customer_data.address,
        gst_number=customer_data.gst_number
    )
    
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "company_name": customer.company_name,
        "address": customer.address,
        "gst_number": customer.gst_number,
        "created_at": customer.created_at.isoformat()
    }

@router.put("/customers/{customer_id}")
def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update customer"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check email uniqueness if email is being updated
    if customer_data.email and customer_data.email != customer.email:
        existing = db.query(Customer).filter(
            Customer.email == customer_data.email,
            Customer.id != customer_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
    
    # Update fields
    if customer_data.name is not None:
        customer.name = customer_data.name
    if customer_data.email is not None:
        customer.email = customer_data.email
    if customer_data.phone is not None:
        customer.phone = customer_data.phone
    if customer_data.company_name is not None:
        customer.company_name = customer_data.company_name
    if customer_data.address is not None:
        customer.address = customer_data.address
    if customer_data.gst_number is not None:
        customer.gst_number = customer_data.gst_number
    
    db.commit()
    db.refresh(customer)
    
    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "company_name": customer.company_name,
        "address": customer.address,
        "gst_number": customer.gst_number,
        "created_at": customer.created_at.isoformat()
    }

@router.delete("/customers/{customer_id}")
def delete_customer(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete customer"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(customer)
    db.commit()
    
    return {"success": True, "message": "Customer deleted successfully"}
