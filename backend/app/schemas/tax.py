from pydantic import BaseModel, Field
from app.models.tax import TaxType

class TaxBase(BaseModel):
    name: str
    type: TaxType
    value: float = Field(ge=0, description="Value must be non-negative")
    is_active: bool = True

class TaxCreate(TaxBase):
    pass

class TaxUpdate(BaseModel):
    name: str | None = None
    type: TaxType | None = None
    value: float | None = Field(None, ge=0)
    is_active: bool | None = None

class TaxResponse(TaxBase):
    id: int
    
    class Config:
        from_attributes = True
