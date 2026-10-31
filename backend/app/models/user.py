from sqlalchemy import Column, Integer, String, Enum as SQLEnum
from app.db.base import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    internal = "internal"
    portal = "portal"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.portal, nullable=False)
