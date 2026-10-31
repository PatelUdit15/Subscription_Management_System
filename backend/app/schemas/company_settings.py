from pydantic import BaseModel
from typing import Optional

class CompanySettingsBase(BaseModel):
    company_name: str
    address: Optional[str] = None
    website: Optional[str] = None
    currency: str = "USD"
    logo_url: Optional[str] = None

class CompanySettingsCreate(CompanySettingsBase):
    pass

class CompanySettingsUpdate(CompanySettingsBase):
    pass

class CompanySettingsResponse(CompanySettingsBase):
    id: int
    
    class Config:
        from_attributes = True
