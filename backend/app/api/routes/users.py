from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.schemas.user import UserResponse
from app.models.user import User

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_current_user(db: Session = Depends(get_db)):
    """
    Mock endpoint - returns the first admin user
    In production, this would decode JWT and return actual user
    """
    user = db.query(User).filter(User.role == "admin").first()
    if not user:
        # Fallback if no admin exists
        user = db.query(User).first()
    return user
