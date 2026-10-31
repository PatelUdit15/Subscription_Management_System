from sqlalchemy import Column, Integer, String, Float, Boolean, Date, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

class DiscountType(str, enum.Enum):
    percentage = "percentage"
    fixed = "fixed"

class Discount(Base):
    __tablename__ = "discounts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(SQLEnum(DiscountType), nullable=False)
    value = Column(Float, nullable=False)
    min_purchase_amount = Column(Float, default=0.0, nullable=False)
    min_quantity = Column(Integer, default=0, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    usage_limit = Column(Integer, default=0, nullable=False)  # 0 = unlimited
    times_used = Column(Integer, default=0, nullable=False)
    apply_to = Column(String, default="all", nullable=False)  # "all" or "specific_products"
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationship
    product = relationship("Product")
