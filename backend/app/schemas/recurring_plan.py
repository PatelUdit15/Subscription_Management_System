from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from app.models.recurring_plan import BillingPeriod

class RecurringPlanBase(BaseModel):
    name: str
    price: float = Field(default=0.0, ge=0)
    billing_period: BillingPeriod
    min_quantity: int = Field(default=1, ge=1)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    auto_close: bool = False
    auto_close_days: int = Field(default=0, ge=0)
    is_closable: bool = True
    is_pausable: bool = True
    can_renew: bool = True

class RecurringPlanCreate(RecurringPlanBase):
    pass

class RecurringPlanUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    billing_period: Optional[BillingPeriod] = None
    min_quantity: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    auto_close: Optional[bool] = None
    auto_close_days: Optional[int] = None
    is_closable: Optional[bool] = None
    is_pausable: Optional[bool] = None
    can_renew: Optional[bool] = None

class RecurringPlan(RecurringPlanBase):
    id: int

    class Config:
        from_attributes = True
