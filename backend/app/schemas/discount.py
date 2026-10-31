from pydantic import BaseModel, Field, field_validator
from datetime import date
from typing import Optional
from app.models.discount import DiscountType

class DiscountBase(BaseModel):
    name: str
    type: DiscountType
    value: float = Field(ge=0, description="Value must be non-negative")
    min_purchase_amount: float = Field(ge=0, default=0.0)
    min_quantity: int = Field(ge=0, default=0)
    start_date: date
    end_date: date
    usage_limit: int = Field(ge=0, default=0)  # 0 means unlimited
    times_used: int = Field(ge=0, default=0)
    apply_to: str = "all"  # "all" or "specific_products"
    product_id: Optional[int] = None
    is_active: bool = True

    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, v, info):
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('end_date must be after start_date')
        return v

class DiscountCreate(DiscountBase):
    pass

class DiscountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[DiscountType] = None
    value: Optional[float] = Field(None, ge=0)
    min_purchase_amount: Optional[float] = Field(None, ge=0)
    min_quantity: Optional[int] = Field(None, ge=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    usage_limit: Optional[int] = Field(None, ge=0)
    times_used: Optional[int] = Field(None, ge=0)
    apply_to: Optional[str] = None
    product_id: Optional[int] = None
    is_active: Optional[bool] = None

class DiscountResponse(DiscountBase):
    id: int
    product_name: Optional[str] = None
    
    class Config:
        from_attributes = True
