from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.db.base import engine, Base, SessionLocal
import app.models  # Ensure all models are registered with Base.metadata
from app.models.user import User, UserRole
from app.models.company_settings import CompanySettings
from app.core.security import get_password_hash
from app.api.routes import (
    users, settings, taxes, discounts, products, attributes,
    recurring_plans, quotation_templates, quotations, invoices,
    dashboard, shop, auth, checkout, my_account, customers,
    payments, payment_gateway, manual_payment, subscriptions, customers_test
)

# Create tables
def sync_sqlite_columns():
    """Ensure any newly added model columns exist in existing SQLite databases without dropping tables."""
    try:
        from sqlalchemy import inspect, text
        with engine.connect() as conn:
            inspector = inspect(engine)
            # Check recurring_plans
            if "recurring_plans" in inspector.get_table_names():
                rp_cols = [c["name"] for c in inspector.get_columns("recurring_plans")]
                if "price" not in rp_cols:
                    conn.execute(text("ALTER TABLE recurring_plans ADD COLUMN price FLOAT DEFAULT 0.0"))
                if "min_quantity" not in rp_cols:
                    conn.execute(text("ALTER TABLE recurring_plans ADD COLUMN min_quantity INTEGER DEFAULT 1"))
                if "start_date" not in rp_cols:
                    conn.execute(text("ALTER TABLE recurring_plans ADD COLUMN start_date DATE"))
                if "end_date" not in rp_cols:
                    conn.execute(text("ALTER TABLE recurring_plans ADD COLUMN end_date DATE"))
                if "auto_close" not in rp_cols:
                    conn.execute(text("ALTER TABLE recurring_plans ADD COLUMN auto_close BOOLEAN DEFAULT 0"))
            # Check discounts
            if "discounts" in inspector.get_table_names():
                d_cols = [c["name"] for c in inspector.get_columns("discounts")]
                if "min_quantity" not in d_cols:
                    conn.execute(text("ALTER TABLE discounts ADD COLUMN min_quantity INTEGER DEFAULT 0"))
                if "usage_limit" not in d_cols:
                    conn.execute(text("ALTER TABLE discounts ADD COLUMN usage_limit INTEGER DEFAULT 0"))
                if "times_used" not in d_cols:
                    conn.execute(text("ALTER TABLE discounts ADD COLUMN times_used INTEGER DEFAULT 0"))
                if "apply_to" not in d_cols:
                    conn.execute(text("ALTER TABLE discounts ADD COLUMN apply_to VARCHAR DEFAULT 'all'"))
                if "product_id" not in d_cols:
                    conn.execute(text("ALTER TABLE discounts ADD COLUMN product_id INTEGER"))
            conn.commit()
    except Exception as e:
        print(f"[WARN] Schema sync note: {e}")

# Create tables and sync columns
Base.metadata.create_all(bind=engine)
sync_sqlite_columns()

app = FastAPI(title="SubscriptionFlow Pro API - Brightloop Software")

# CORS Configuration - Allow React frontend on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)


# Seed database on startup
@app.on_event("startup")
def seed_database():
    sync_sqlite_columns()
    db = SessionLocal()
    try:
        # Check if admin user exists
        admin_exists = db.query(User).filter(User.role == UserRole.admin).first()
        if not admin_exists:
            admin_user = User(
                name="Admin User",
                email="admin@subscriptionflow.com",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.admin
            )
            db.add(admin_user)
            print("[INFO] Admin user created: admin@subscriptionflow.com / admin123")
        
        # Check if internal user exists (Brightloop Internal Operator)
        internal_exists = db.query(User).filter(User.role == UserRole.internal).first()
        if not internal_exists:
            internal_user = User(
                name="Internal Operator",
                email="internal@brightloop.com",
                hashed_password=get_password_hash("Internal@123"),
                role=UserRole.internal
            )
            db.add(internal_user)
            print("[INFO] Internal user created: internal@brightloop.com / Internal@123")
        
        # Check if test customer user exists
        customer_exists = db.query(User).filter(User.email == "customer@example.com").first()
        if not customer_exists:
            customer_user = User(
                name="Test Customer",
                email="customer@example.com",
                hashed_password=get_password_hash("customer123"),
                role=UserRole.portal
            )
            db.add(customer_user)
            print("[INFO] Test customer created: customer@example.com / customer123")
        
        # Check if company settings exist
        settings_exist = db.query(CompanySettings).first()
        if not settings_exist:
            default_settings = CompanySettings(
                company_name="Brightloop Software - SubscriptionFlow",
                address="123 Business Street, Tech City, TC 12345",
                website="https://brightloop.com",
                currency="USD",
                logo_url=None
            )
            db.add(default_settings)
            print("[INFO] Default company settings created")
        
        db.commit()


    except Exception as e:
        print(f"[ERROR] Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

# Include routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(settings.router, prefix="/api", tags=["Settings"])
app.include_router(customers.router, prefix="/api", tags=["Customers"])
app.include_router(customers_test.router, prefix="/api", tags=["Customers Test"])
app.include_router(taxes.router, prefix="/api", tags=["Taxes"])
app.include_router(discounts.router, prefix="/api", tags=["Discounts"])
app.include_router(products.router, prefix="/api", tags=["Products"])
app.include_router(attributes.router, prefix="/api", tags=["Attributes"])
app.include_router(recurring_plans.router, prefix="/api", tags=["Recurring Plans"])
app.include_router(quotation_templates.router, prefix="/api", tags=["Quotation Templates"])
app.include_router(quotations.router, prefix="/api", tags=["Quotations"])
app.include_router(subscriptions.router, prefix="/api", tags=["Subscriptions"])
app.include_router(invoices.router, prefix="/api", tags=["Invoices"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(shop.router, prefix="/api", tags=["Shop"])
app.include_router(checkout.router, prefix="/api", tags=["Checkout"])
app.include_router(my_account.router, prefix="/api", tags=["My Account"])
app.include_router(payments.router, prefix="/api", tags=["Payments"])
app.include_router(payment_gateway.router, prefix="/api", tags=["Payment Gateway"])
app.include_router(manual_payment.router, prefix="/api", tags=["Manual Payment"])

@app.get("/")
def root():
    return {
        "message": "Brightloop Subscription Management System API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
