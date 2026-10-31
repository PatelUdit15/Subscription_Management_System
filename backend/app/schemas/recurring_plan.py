from pydantic import BaseModel, Field
from typing import Optional
from app.models.recurring_plan import BillingPeriod

class RecurringPlanBase(BaseModel):
    name: str
    billing_period: BillingPeriod
    auto_close_days: int = Field(default=0, ge=0)
    is_closable: bool = True
    is_pausable: bool = True
    can_renew: bool = True

class RecurringPlanCreate(RecurringPlanBase):
    pass

class RecurringPlanUpdate(BaseModel):
    name: Optional[str] = None
    billing_period: Optional[BillingPeriod] = None
    auto_close_days: Optional[int] = None
    is_closable: Optional[bool] = None
    is_pausable: Optional[bool] = None
    can_renew: Optional[bool] = None

class RecurringPlan(RecurringPlanBase):
    id: int

    class Config:
        from_attributes = True
