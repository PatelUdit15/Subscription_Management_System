from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.db.base import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.models.company_settings import CompanySettings
from app.core.security import get_password_hash
from app.api.routes import users, settings

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SubscriptionFlow Pro API")

# CORS Configuration - Allow React frontend on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
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
            print("✅ Admin user created: admin@subscriptionflow.com / admin123")
        
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
            print("✅ Test customer created: customer@example.com / customer123")
        
        # Check if company settings exist
        settings_exist = db.query(CompanySettings).first()
        if not settings_exist:
            default_settings = CompanySettings(
                company_name="SubscriptionFlow Pro",
                address="123 Business Street, Tech City, TC 12345",
                website="https://subscriptionflow.com",
                currency="USD",
                logo_url=None
            )
            db.add(default_settings)
            print("✅ Default company settings created")
        
        db.commit()
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

# Include routers
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(settings.router, prefix="/api", tags=["Settings"])

# Import new routers
from app.api.routes import taxes, discounts, products, attributes, recurring_plans, quotation_templates, quotations, invoices, dashboard, shop, auth, checkout, my_account, customers, payments, payment_gateway, manual_payment, subscriptions, customers_test

print(f"Customers router has {len(customers.router.routes)} routes")
print(f"Routes: {[r.path for r in customers.router.routes]}")

app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(customers.router, prefix="/api", tags=["Customers"])
print("Registered customers router with /api prefix!")
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
        "message": "SubscriptionFlow Pro API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/api/customers-direct")
def get_customers_direct():
    """Direct customers endpoint for testing"""
    from app.db.base import SessionLocal
    from app.models.customer import Customer
    db = SessionLocal()
    try:
        customers = db.query(Customer).all()
        return [{"id": c.id, "name": c.name, "email": c.email} for c in customers]
    finally:
        db.close()

@app.get("/health")
def health_check():
    return {"status": "healthy"}



