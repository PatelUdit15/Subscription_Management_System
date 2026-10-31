from pydantic import BaseModel
from typing import Optional

class AttributeBase(BaseModel):
    name: str
    is_active: Optional[bool] = True

class AttributeCreate(AttributeBase):
    pass

class AttributeUpdate(AttributeBase):
    pass

class Attribute(AttributeBase):
    id: int

    class Config:
        from_attributes = True
