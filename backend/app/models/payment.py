from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Date
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base

class PaymentMethod(str, enum.Enum):
    cash = "cash"
    bank_transfer = "bank_transfer"
    credit_card = "credit_card"
    stripe = "stripe"
    paypal = "paypal"
    upi = "upi"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    transaction_reference = Column(String, nullable=True)
    payment_date = Column(Date, nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
