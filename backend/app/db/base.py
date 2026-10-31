import os
import socket
import logging
from urllib.parse import urlparse
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

def get_sqlite_fallback_url() -> str:
    # Anchor to the backend directory
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    db_path = os.path.join(backend_dir, 'subscription_db.sqlite').replace('\\', '/')
    return f"sqlite:///{db_path}"

def init_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql"):
        postgres_available = False
        parsed = None
        try:
            parsed = urlparse(db_url)
            host = parsed.hostname or "localhost"
            port = parsed.port or 5432
            with socket.create_connection((host, port), timeout=1.0):
                postgres_available = True
        except Exception:
            pass

        # If configured remote host failed, try localhost fallback for PostgreSQL
        if not postgres_available and parsed and parsed.hostname not in ("localhost", "127.0.0.1"):
            try:
                local_port = parsed.port or 5432
                with socket.create_connection(("localhost", local_port), timeout=1.0):
                    local_url = db_url.replace(f"@{parsed.hostname}:", "@localhost:")
                    pg_engine = create_engine(local_url, connect_args={"connect_timeout": 3}, echo=False)
                    with pg_engine.connect() as conn:
                        pass
                    print(f"[INFO] Connected to local PostgreSQL database at localhost:{local_port}")
                    return pg_engine
            except Exception as e:
                logger.warning(f"Local PostgreSQL fallback attempt failed: {e}")

        if postgres_available:
            try:
                pg_engine = create_engine(db_url, connect_args={"connect_timeout": 3}, echo=False)
                with pg_engine.connect() as conn:
                    pass
                print(f"[INFO] Connected to PostgreSQL database: {db_url.split('@')[-1] if '@' in db_url else db_url}")
                return pg_engine
            except Exception as e:
                print(f"[WARN] PostgreSQL connection failed ({e}). Falling back to SQLite.")

        fallback_url = get_sqlite_fallback_url()
        print(f"[INFO] Using local SQLite database at {fallback_url}")
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
