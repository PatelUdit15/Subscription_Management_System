from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.schemas.company_settings import CompanySettingsResponse, CompanySettingsUpdate
from app.models.company_settings import CompanySettings
from app.models.user import User
from app.api.routes.auth import require_roles

router = APIRouter()

@router.get("/settings", response_model=CompanySettingsResponse)
def get_company_settings(db: Session = Depends(get_db)):
    """Get global company settings"""
    settings = db.query(CompanySettings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Company settings not found")
    return settings

@router.post("/settings", response_model=CompanySettingsResponse)
def update_company_settings(
    settings_update: CompanySettingsUpdate,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Update global company settings (Admin only - Internal users forbidden)"""
    settings = db.query(CompanySettings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Company settings not found")
    
    # Update fields
    for key, value in settings_update.model_dump().items():
        setattr(settings, key, value)
    
    db.commit()
    db.refresh(settings)
    return settings
