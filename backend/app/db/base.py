from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

db_url = settings.DATABASE_URL
connect_args = {}

import socket
from urllib.parse import urlparse

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(db_url, connect_args=connect_args)
else:
    postgres_available = False
    try:
        parsed = urlparse(db_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        with socket.create_connection((host, port), timeout=1.0):
            postgres_available = True
    except Exception as e:
        print(f"⚠️ PostgreSQL host unreachable ({e}). Falling back to SQLite.")

    if postgres_available:
        try:
            temp_engine = create_engine(db_url, connect_args={"connect_timeout": 2})
            with temp_engine.connect() as conn:
                pass
            engine = temp_engine
        except Exception as e:
            print(f"⚠️ PostgreSQL connection failed ({e}). Falling back to SQLite.")
            db_url = "sqlite:///./subscription_db.sqlite"
            connect_args = {"check_same_thread": False}
            engine = create_engine(db_url, connect_args=connect_args)
    else:
        db_url = "sqlite:///./subscription_db.sqlite"
        connect_args = {"check_same_thread": False}
        engine = create_engine(db_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
