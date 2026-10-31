from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    attribute_value_id = Column(Integer, ForeignKey("attribute_values.id", ondelete="CASCADE"), nullable=False)
    extra_price = Column(Float, nullable=False, default=0.0)

    # Relationships
    product = relationship("Product", back_populates="variants")
    attribute_value = relationship("AttributeValue", back_populates="product_variants")
