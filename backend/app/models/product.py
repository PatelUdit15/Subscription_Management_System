from sqlalchemy import Column, Integer, String, Float, Text, Enum, Boolean
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base

class ProductType(str, enum.Enum):
    service = "service"
    storable = "storable"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    type = Column(Enum(ProductType), nullable=False, default=ProductType.storable)
    base_price = Column(Float, nullable=False, default=0.0)
    cost = Column(Float, nullable=False, default=0.0)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    # Relationship
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
