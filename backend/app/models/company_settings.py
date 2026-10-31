from sqlalchemy import Column, Integer, String, Text
from app.db.base import Base

class CompanySettings(Base):
    __tablename__ = "company_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False, default="SubscriptionFlow Pro")
    address = Column(Text, nullable=True)
    website = Column(String, nullable=True)
    currency = Column(String, default="USD", nullable=False)
    logo_url = Column(String, nullable=True)
