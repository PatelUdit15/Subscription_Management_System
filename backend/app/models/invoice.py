from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base

class InvoiceStatus(str, enum.Enum):
    draft = "draft"
    posted = "posted"
    paid = "paid"
    cancelled = "cancelled"

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, unique=True, nullable=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=True)
    customer_name = Column(String, nullable=False)
    date_issued = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    total_amount = Column(Float, nullable=False, default=0.0)
    status = Column(Enum(InvoiceStatus), nullable=False, default=InvoiceStatus.draft)
    notes = Column(Text, nullable=True)

    # Relationships
    subscription = relationship("Subscription", back_populates="invoices")
    invoice_lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")
