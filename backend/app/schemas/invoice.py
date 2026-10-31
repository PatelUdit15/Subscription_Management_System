from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from app.models.invoice import InvoiceStatus

class InvoiceLineBase(BaseModel):
    product_id: Optional[int] = None
    variant_id: Optional[int] = None
    quantity: float = Field(gt=0)
    unit_price: float = Field(ge=0)
    tax_id: Optional[int] = None
    discount_id: Optional[int] = None

class InvoiceLineCreate(InvoiceLineBase):
    description: Optional[str] = None
    tax_rate: Optional[float] = 0

class InvoiceLine(InvoiceLineBase):
    id: int
    invoice_id: int
    price_subtotal: float

    class Config:
        from_attributes = True

class InvoiceLineDetail(BaseModel):
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

class InvoiceBase(BaseModel):
    customer_name: str
    date_issued: date
    due_date: date

class InvoiceCreate(InvoiceBase):
    subscription_id: Optional[int] = None
    notes: Optional[str] = None
    total_amount: float
    status: Optional[str] = None
    lines: List[InvoiceLineCreate] = []

class InvoiceUpdate(BaseModel):
    status: Optional[InvoiceStatus] = None

class Invoice(InvoiceBase):
    id: int
    number: str
    subscription_id: int
    total_amount: float
    status: InvoiceStatus

    class Config:
        from_attributes = True

class InvoiceDetail(Invoice):
    invoice_lines: List[InvoiceLineDetail] = []

class InvoiceStatusUpdate(BaseModel):
    status: InvoiceStatus
