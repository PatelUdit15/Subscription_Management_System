from pydantic import BaseModel, Field, field_validator
from datetime import date
from app.models.discount import DiscountType

class DiscountBase(BaseModel):
    name: str
    type: DiscountType
    value: float = Field(ge=0, description="Value must be non-negative")
    min_purchase_amount: float = Field(ge=0, default=0.0)
    start_date: date
    end_date: date
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
    name: str | None = None
    type: DiscountType | None = None
    value: float | None = Field(None, ge=0)
    min_purchase_amount: float | None = Field(None, ge=0)
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool | None = None

class DiscountResponse(DiscountBase):
    id: int
    
    class Config:
        from_attributes = True
