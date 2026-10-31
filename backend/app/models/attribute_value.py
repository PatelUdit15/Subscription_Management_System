from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

class AttributeValue(Base):
    __tablename__ = "attribute_values"

    id = Column(Integer, primary_key=True, index=True)
    attribute_id = Column(Integer, ForeignKey("attributes.id", ondelete="CASCADE"), nullable=False)
    value = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    # Relationship
    attribute = relationship("Attribute", back_populates="values")
    product_variants = relationship("ProductVariant", back_populates="attribute_value")
