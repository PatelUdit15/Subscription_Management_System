from sqlalchemy import Column, Integer, Float, ForeignKey, String
from sqlalchemy.orm import relationship
from app.db.base import Base

class InvoiceLine(Base):
    __tablename__ = "invoice_lines"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True)
    description = Column(String, nullable=True)
    quantity = Column(Float, nullable=False, default=1.0)
    unit_price = Column(Float, nullable=False, default=0.0)
    tax_rate = Column(Float, nullable=True, default=0.0)
    tax_id = Column(Integer, ForeignKey("taxes.id", ondelete="SET NULL"), nullable=True)
    discount_id = Column(Integer, ForeignKey("discounts.id", ondelete="SET NULL"), nullable=True)
    price_subtotal = Column(Float, nullable=False, default=0.0)

    # Relationships
    invoice = relationship("Invoice", back_populates="invoice_lines")
    product = relationship("Product")
    variant = relationship("ProductVariant")
    tax = relationship("Tax")
    discount = relationship("Discount")
