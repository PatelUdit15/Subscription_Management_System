from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum, Text, DateTime
from sqlalchemy.orm import relationship
import enum
from datetime import date
from app.db.base import Base

class QuotationStatus(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    confirmed = "confirmed"
    expired = "expired"

class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, unique=True, nullable=False, index=True)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    status = Column(Enum(QuotationStatus), nullable=False, default=QuotationStatus.draft)
    validity_date = Column(Date, nullable=False)
    recurring_plan_id = Column(Integer, ForeignKey("recurring_plans.id", ondelete="SET NULL"), nullable=True)
    subtotal = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    
    # Signature fields
    signature_data = Column(Text, nullable=True)  # Base64 encoded signature image
    signed_by = Column(String, nullable=True)  # Name of person who signed
    signed_at = Column(DateTime, nullable=True)  # Timestamp of signature

    # Relationships
    recurring_plan = relationship("RecurringPlan")
    quotation_lines = relationship("QuotationLine", back_populates="quotation", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="quotation", uselist=False)
