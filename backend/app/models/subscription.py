from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, Float, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base

class SubscriptionStatus(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    confirmed = "confirmed"
    active = "active"
    paused = "paused"
    cancelled = "cancelled"
    expired = "expired"
    churned = "churned"

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, unique=True, nullable=True, index=True)  # S0001, S0002, etc.
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id", ondelete="CASCADE"), nullable=True, unique=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    recurring_plan_id = Column(Integer, ForeignKey("recurring_plans.id", ondelete="RESTRICT"), nullable=False)
    
    # Dates
    start_date = Column(Date, nullable=True)
    next_billing_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Status and workflow
    status = Column(Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.draft)
    
    # Pricing
    recurring_amount = Column(Float, nullable=True)
    
    # Payment tracking
    payment_done = Column(Boolean, nullable=False, default=False)
    
    # Digital Signature
    signature_data = Column(String, nullable=True)  # Base64 encoded signature image
    signed_by = Column(String, nullable=True)  # Name of person who signed
    signed_at = Column(DateTime, nullable=True)  # When it was signed
    share_token = Column(String, unique=True, nullable=True)  # Unique token for sharing
    
    # Relationships
    order = relationship("Order", back_populates="subscriptions")
    quotation = relationship("Quotation", back_populates="subscription")
    customer = relationship("Customer")
    product = relationship("Product")
    recurring_plan = relationship("RecurringPlan")
    invoices = relationship("Invoice", back_populates="subscription", cascade="all, delete-orphan")
    lines = relationship("SubscriptionLine", back_populates="subscription", cascade="all, delete-orphan")
