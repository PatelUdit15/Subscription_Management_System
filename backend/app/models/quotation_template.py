from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base

class DurationUnit(str, enum.Enum):
    month = "month"
    year = "year"

class QuotationTemplate(Base):
    __tablename__ = "quotation_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    validity_days = Column(Integer, nullable=False, default=30)
    recurring_plan_id = Column(Integer, ForeignKey("recurring_plans.id", ondelete="SET NULL"), nullable=True)
    end_duration = Column(Integer, nullable=True)
    duration_unit = Column(Enum(DurationUnit), nullable=True, default=DurationUnit.month)

    # Relationships
    recurring_plan = relationship("RecurringPlan", back_populates="quotation_templates")
    template_lines = relationship("TemplateLine", back_populates="template", cascade="all, delete-orphan")
