from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class QuotationLine(Base):
    __tablename__ = "quotation_lines"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Float, nullable=False, default=1.0)
    unit_price = Column(Float, nullable=False, default=0.0)
    tax_id = Column(Integer, ForeignKey("taxes.id", ondelete="SET NULL"), nullable=True)
    discount_id = Column(Integer, ForeignKey("discounts.id", ondelete="SET NULL"), nullable=True)
    price_subtotal = Column(Float, nullable=False, default=0.0)

    # Relationships
    quotation = relationship("Quotation", back_populates="quotation_lines")
    product = relationship("Product")
    variant = relationship("ProductVariant")
    tax = relationship("Tax")
    discount = relationship("Discount")
