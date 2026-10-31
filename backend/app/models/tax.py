from sqlalchemy import Column, Integer, String, Float, Boolean, Enum as SQLEnum
from app.db.base import Base
import enum

class TaxType(str, enum.Enum):
    percentage = "percentage"
    fixed = "fixed"

class Tax(Base):
    __tablename__ = "taxes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(SQLEnum(TaxType), nullable=False)
    value = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
