from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base

class OrderStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    cancelled = "cancelled"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, unique=True, nullable=True)  # Order number like ORD/2024/0001
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    total_amount = Column(Float, nullable=False, default=0.0)
    status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.pending)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Shipping/Billing info
    shipping_address = Column(String, nullable=True)
    billing_address = Column(String, nullable=True)

    # Relationships
    user = relationship("User")
    order_lines = relationship("OrderLine", back_populates="order", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="order")
