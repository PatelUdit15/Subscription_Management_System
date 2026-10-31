import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

def get_sqlite_fallback_url() -> str:
    # Anchor to the backend directory
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sqlite_path = os.path.join(backend_dir, "subscription_db.sqlite").replace("\\", "/")
    return f"sqlite:///{sqlite_path}"

def init_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql"):
        try:
            # Test connection with a short timeout to prevent startup hangs if remote host is offline
            pg_engine = create_engine(db_url, connect_args={"connect_timeout": 3}, echo=False)
            with pg_engine.connect() as conn:
                pass
            print(f"[INFO] Connected to PostgreSQL database: {db_url.split('@')[-1] if '@' in db_url else db_url}")
            return pg_engine
        except Exception as e:
            fallback_url = get_sqlite_fallback_url()
            print(f"[WARN] Could not connect to PostgreSQL ({e.__class__.__name__}). Falling back to local SQLite database at {fallback_url}.")
            return create_engine(fallback_url, echo=False, connect_args={"check_same_thread": False})
    elif db_url.startswith("sqlite:///."):
        fallback_url = get_sqlite_fallback_url()
        return create_engine(fallback_url, echo=False, connect_args={"check_same_thread": False})
    elif db_url.startswith("sqlite"):
        return create_engine(db_url, echo=False, connect_args={"check_same_thread": False})
    return create_engine(db_url, echo=False)

engine = init_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
