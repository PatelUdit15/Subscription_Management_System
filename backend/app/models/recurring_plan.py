from sqlalchemy import Column, Integer, String, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base

class BillingPeriod(str, enum.Enum):
    weeks = "weeks"
    month = "month"
    year = "year"

class RecurringPlan(Base):
    __tablename__ = "recurring_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    billing_period = Column(Enum(BillingPeriod), nullable=False, default=BillingPeriod.month)
    auto_close_days = Column(Integer, nullable=False, default=0)
    is_closable = Column(Boolean, default=True)
    is_pausable = Column(Boolean, default=True)
    can_renew = Column(Boolean, default=True)

    # Relationship
    quotation_templates = relationship("QuotationTemplate", back_populates="recurring_plan")
