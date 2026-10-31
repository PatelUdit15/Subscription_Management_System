from pydantic import BaseModel
from typing import Optional

class AttributeValueBase(BaseModel):
    attribute_id: int
    value: str
    is_active: Optional[bool] = True

class AttributeValueCreate(AttributeValueBase):
    pass

class AttributeValueUpdate(BaseModel):
    value: Optional[str] = None
    is_active: Optional[bool] = None

class AttributeValue(AttributeValueBase):
    id: int

    class Config:
        from_attributes = True

class AttributeValueWithAttribute(AttributeValue):
    attribute_name: str
