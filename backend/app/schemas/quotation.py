from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import date, datetime
from app.models.quotation import QuotationStatus

class QuotationLineBase(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: float = Field(gt=0)
    unit_price: float = Field(ge=0)
    tax_id: Optional[int] = None
    discount_id: Optional[int] = None

class QuotationLineCreate(QuotationLineBase):
    pass

class QuotationLine(QuotationLineBase):
    id: int
    quotation_id: int
    price_subtotal: float

    class Config:
        from_attributes = True

class QuotationLineDetail(BaseModel):
    id: int
    product_id: int
    product_name: str
    variant_id: Optional[int] = None
    variant_name: Optional[str] = None
    quantity: float
    unit_price: float
    tax_id: Optional[int] = None
    tax_name: Optional[str] = None
    tax_value: Optional[float] = None
    discount_id: Optional[int] = None
    discount_name: Optional[str] = None
    discount_value: Optional[float] = None
    price_subtotal: float

class QuotationBase(BaseModel):
    customer_name: str
    customer_email: EmailStr
    validity_date: date
    recurring_plan_id: Optional[int] = None

class QuotationCreate(QuotationBase):
    quotation_lines: List[QuotationLineCreate] = []
    template_id: Optional[int] = None  # Optional: auto-fill from template

class QuotationUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    validity_date: Optional[date] = None
    recurring_plan_id: Optional[int] = None
    status: Optional[QuotationStatus] = None

class Quotation(QuotationBase):
    id: int
    number: str
    status: QuotationStatus
    subtotal: float
    tax_amount: float
    total_amount: float
    signature_data: Optional[str] = None
    signed_by: Optional[str] = None
    signed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class QuotationDetail(Quotation):
    recurring_plan_name: Optional[str] = None
    quotation_lines: List[QuotationLineDetail] = []

class QuotationStatusUpdate(BaseModel):
    status: QuotationStatus


class QuotationSignature(BaseModel):
    signature_data: str  # Base64 encoded signature image
    signed_by: str  # Name of person signing
