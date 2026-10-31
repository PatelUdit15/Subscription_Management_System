from pydantic import BaseModel, Field
from typing import Optional, List
from app.models.quotation_template import DurationUnit

class TemplateLineBase(BaseModel):
    product_id: int
    quantity: float = Field(default=1.0, gt=0)

class TemplateLineCreate(TemplateLineBase):
    pass

class TemplateLine(TemplateLineBase):
    id: int
    template_id: int

    class Config:
        from_attributes = True

class TemplateLineDetail(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: float
    unit_price: float
    total_price: float

class QuotationTemplateBase(BaseModel):
    name: str
    validity_days: int = Field(default=30, gt=0)
    recurring_plan_id: Optional[int] = None
    end_duration: Optional[int] = None
    duration_unit: Optional[DurationUnit] = DurationUnit.month

class QuotationTemplateCreate(QuotationTemplateBase):
    template_lines: List[TemplateLineCreate] = []

class QuotationTemplateUpdate(BaseModel):
    name: Optional[str] = None
    validity_days: Optional[int] = Field(default=None, gt=0)
    recurring_plan_id: Optional[int] = None
    end_duration: Optional[int] = None
    duration_unit: Optional[DurationUnit] = None

class QuotationTemplate(QuotationTemplateBase):
    id: int

    class Config:
        from_attributes = True

class QuotationTemplateDetail(QuotationTemplate):
    recurring_plan_name: Optional[str] = None
    template_lines: List[TemplateLineDetail] = []
    total_amount: float = 0.0
