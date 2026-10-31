from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.models.product import Product
from app.schemas.product import Product as ProductSchema

router = APIRouter()

@router.get("/shop/products", response_model=List[ProductSchema])
def get_shop_products(db: Session = Depends(get_db)):
    """
    Public endpoint for customer shop
    Returns only active products
    """
    products = db.query(Product).filter(Product.is_active == True).all()
    return products
