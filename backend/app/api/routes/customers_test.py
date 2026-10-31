from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.customer import Customer

router = APIRouter()

@router.get("/customers-test")
def get_customers_test(db: Session = Depends(get_db)):
    """Test endpoint for customers"""
    customers = db.query(Customer).all()
    return {"count": len(customers), "message": "Customers test route works!"}
