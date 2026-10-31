from pydantic import BaseModel
from typing import Optional, List
from app.models.product import ProductType

class ProductBase(BaseModel):
    name: str
    type: ProductType
    base_price: float
    cost: float
    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[ProductType] = None
    base_price: Optional[float] = None
    cost: Optional[float] = None
    description: Optional[str] = None

class Product(ProductBase):
    id: int

    class Config:
        from_attributes = True

class ProductVariantBase(BaseModel):
    product_id: int
    attribute_value_id: int
    extra_price: float

class ProductVariantCreate(ProductVariantBase):
    pass

class ProductVariantUpdate(BaseModel):
    extra_price: Optional[float] = None

class ProductVariant(ProductVariantBase):
    id: int

    class Config:
        from_attributes = True

class ProductVariantDetail(BaseModel):
    id: int
    attribute_value_id: int
    attribute_name: str
    attribute_value: str
    extra_price: float
    total_price: float

class ProductDetail(Product):
    variants: List[ProductVariantDetail] = []
