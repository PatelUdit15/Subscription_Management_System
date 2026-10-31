from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.models.recurring_plan import RecurringPlan
from app.models.user import User
from app.api.routes.auth import require_roles
from app.schemas import recurring_plan

router = APIRouter()

@router.get("/recurring-plans", response_model=List[recurring_plan.RecurringPlan])
def get_recurring_plans(db: Session = Depends(get_db)):
    return db.query(RecurringPlan).all()

@router.get("/recurring-plans/{plan_id}", response_model=recurring_plan.RecurringPlan)
def get_recurring_plan(plan_id: int, db: Session = Depends(get_db)):
    db_plan = db.query(RecurringPlan).filter(RecurringPlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Recurring plan not found")
    return db_plan

@router.post("/recurring-plans", response_model=recurring_plan.RecurringPlan, status_code=status.HTTP_201_CREATED)
def create_recurring_plan(
    plan: recurring_plan.RecurringPlanCreate,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Create recurring plan (Admin only - Internal users forbidden)"""
    db_plan = RecurringPlan(**plan.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.put("/recurring-plans/{plan_id}", response_model=recurring_plan.RecurringPlan)
def update_recurring_plan(
    plan_id: int,
    plan: recurring_plan.RecurringPlanUpdate,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Update recurring plan (Admin only)"""
    db_plan = db.query(RecurringPlan).filter(RecurringPlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Recurring plan not found")
    
    for key, value in plan.model_dump(exclude_unset=True).items():
        setattr(db_plan, key, value)
    
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.delete("/recurring-plans/{plan_id}")
def delete_recurring_plan(
    plan_id: int,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Delete recurring plan (Admin only)"""
    db_plan = db.query(RecurringPlan).filter(RecurringPlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Recurring plan not found")
    
    db.delete(db_plan)
    db.commit()
    return {"message": "Recurring plan deleted successfully"}
