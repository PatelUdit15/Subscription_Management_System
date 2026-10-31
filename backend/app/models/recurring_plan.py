from sqlalchemy import Column, Integer, String, Boolean, Enum, Float, Date
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base

class BillingPeriod(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"
    # Legacy compatibility
    weeks = "weeks"
    month = "month"
    year = "year"

class RecurringPlan(Base):
    __tablename__ = "recurring_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=False, default=0.0)
    billing_period = Column(Enum(BillingPeriod), nullable=False, default=BillingPeriod.monthly)
    min_quantity = Column(Integer, nullable=False, default=1)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    auto_close = Column(Boolean, default=False)
    auto_close_days = Column(Integer, nullable=False, default=0)
    is_closable = Column(Boolean, default=True)
    is_pausable = Column(Boolean, default=True)
    can_renew = Column(Boolean, default=True)

    # Relationship
    quotation_templates = relationship("QuotationTemplate", back_populates="recurring_plan")
