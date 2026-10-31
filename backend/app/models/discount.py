from sqlalchemy import Column, Integer, String, Float, Boolean, Date, Enum as SQLEnum
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
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
