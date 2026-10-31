"""
Seed script to populate database with mock data for subscription testing
"""
from app.db.base import SessionLocal
from app.models.customer import Customer
from app.models.product import Product, ProductType
from app.models.recurring_plan import RecurringPlan, BillingPeriod
from app.models.quotation_template import QuotationTemplate, DurationUnit
from app.models.template_line import TemplateLine
from app.models.tax import Tax, TaxType
from app.models.discount import Discount, DiscountType
from datetime import datetime

def seed_data():
    db = SessionLocal()
    
    try:
        print("Starting database seeding...")
        
        # 1. Create Customers
        print("\nCreating customers...")
        customers_data = [
            {
                "name": "Acme Corporation",
                "email": "contact@acme.com",
                "phone": "+1-555-0101",
                "company_name": "Acme Corp",
                "address": "123 Business St, New York, NY 10001",
                "gst_number": "GST123456789"
            },
            {
                "name": "TechStart Inc",
                "email": "info@techstart.com",
                "phone": "+1-555-0102",
                "company_name": "TechStart Inc",
                "address": "456 Innovation Ave, San Francisco, CA 94102",
                "gst_number": "GST987654321"
            },
            {
                "name": "Global Solutions Ltd",
                "email": "hello@globalsolutions.com",
                "phone": "+1-555-0103",
                "company_name": "Global Solutions Ltd",
                "address": "789 Enterprise Blvd, Austin, TX 78701",
                "gst_number": "GST456789123"
            },
            {
                "name": "Digital Dynamics",
                "email": "contact@digitaldynamics.com",
                "phone": "+1-555-0104",
                "company_name": "Digital Dynamics LLC",
                "address": "321 Tech Park, Seattle, WA 98101",
                "gst_number": "GST789123456"
            }
        ]
        
        for customer_data in customers_data:
            existing = db.query(Customer).filter(Customer.email == customer_data["email"]).first()
            if not existing:
                customer = Customer(**customer_data)
                db.add(customer)
                print(f"  + Created customer: {customer_data['name']}")
            else:
                print(f"  - Customer already exists: {customer_data['name']}")
        
        db.commit()
        
        # 2. Create/Update Products
        print("\nCreating products...")
        products_data = [
            {
                "name": "Cloud Storage Pro",
                "type": ProductType.service,
                "base_price": 49.99,
                "cost": 20.00,
                "description": "Professional cloud storage solution with 1TB space",
                "is_active": True
            },
            {
                "name": "Email Marketing Suite",
                "type": ProductType.service,
                "base_price": 99.99,
                "cost": 40.00,
                "description": "Complete email marketing platform with automation",
                "is_active": True
            },
            {
                "name": "CRM Enterprise",
                "type": ProductType.service,
                "base_price": 199.99,
                "cost": 80.00,
                "description": "Enterprise-grade CRM with advanced analytics",
                "is_active": True
            },
            {
                "name": "Website Hosting",
                "type": ProductType.service,
                "base_price": 29.99,
                "cost": 10.00,
                "description": "Reliable website hosting with 99.9% uptime",
                "is_active": True
            },
            {
                "name": "Project Management Tool",
                "type": ProductType.service,
                "base_price": 79.99,
                "cost": 30.00,
                "description": "Collaborative project management software",
                "is_active": True
            }
        ]
        
        for product_data in products_data:
            existing = db.query(Product).filter(Product.name == product_data["name"]).first()
            if not existing:
                product = Product(**product_data)
                db.add(product)
                print(f"  + Created product: {product_data['name']}")
            else:
                print(f"  - Product already exists: {product_data['name']}")
        
        db.commit()
        
        # 3. Create Recurring Plans
        print("\nCreating recurring plans...")
        plans_data = [
            {
                "name": "Monthly Plan",
                "billing_period": BillingPeriod.month,
                "auto_close_days": 30,
                "is_closable": True,
                "is_pausable": True,
                "can_renew": True
            },
            {
                "name": "Quarterly Plan",
                "billing_period": BillingPeriod.month,
                "auto_close_days": 90,
                "is_closable": True,
                "is_pausable": True,
                "can_renew": True
            },
            {
                "name": "Annual Plan",
                "billing_period": BillingPeriod.year,
                "auto_close_days": 365,
                "is_closable": True,
                "is_pausable": False,
                "can_renew": True
            },
            {
                "name": "Weekly Plan",
                "billing_period": BillingPeriod.weeks,
                "auto_close_days": 7,
                "is_closable": True,
                "is_pausable": True,
                "can_renew": True
            }
        ]
        
        for plan_data in plans_data:
            existing = db.query(RecurringPlan).filter(RecurringPlan.name == plan_data["name"]).first()
            if not existing:
                plan = RecurringPlan(**plan_data)
                db.add(plan)
                print(f"  + Created plan: {plan_data['name']}")
            else:
                print(f"  - Plan already exists: {plan_data['name']}")
        
        db.commit()
        
        # 4. Create Quotation Templates
        print("\nCreating quotation templates...")
        
        # Get first recurring plan for templates
        monthly_plan = db.query(RecurringPlan).filter(RecurringPlan.name == "Monthly Plan").first()
        annual_plan = db.query(RecurringPlan).filter(RecurringPlan.name == "Annual Plan").first()
        
        if monthly_plan and annual_plan:
            templates_data = [
                {
                    "name": "Standard SaaS Package",
                    "validity_days": 30,
                    "recurring_plan_id": monthly_plan.id,
                    "end_duration": 12,
                    "duration_unit": DurationUnit.month
                },
                {
                    "name": "Enterprise Bundle",
                    "validity_days": 45,
                    "recurring_plan_id": annual_plan.id,
                    "end_duration": 1,
                    "duration_unit": DurationUnit.year
                },
                {
                    "name": "Startup Package",
                    "validity_days": 15,
                    "recurring_plan_id": monthly_plan.id,
                    "end_duration": 6,
                    "duration_unit": DurationUnit.month
                }
            ]
            
            for template_data in templates_data:
                existing = db.query(QuotationTemplate).filter(
                    QuotationTemplate.name == template_data["name"]
                ).first()
                if not existing:
                    template = QuotationTemplate(**template_data)
                    db.add(template)
                    db.flush()
                    
                    # Add template lines
                    products = db.query(Product).limit(2).all()
                    for i, product in enumerate(products):
                        line = TemplateLine(
                            template_id=template.id,
                            product_id=product.id,
                            quantity=1.0
                        )
                        db.add(line)
                    
                    print(f"  + Created template: {template_data['name']}")
                else:
                    print(f"  - Template already exists: {template_data['name']}")
        
        db.commit()
        
        # 5. Create Taxes
        print("\nCreating taxes...")
        taxes_data = [
            {
                "name": "GST 18%",
                "type": TaxType.percentage,
                "value": 18.0,
                "is_active": True
            },
            {
                "name": "VAT 10%",
                "type": TaxType.percentage,
                "value": 10.0,
                "is_active": True
            },
            {
                "name": "Service Tax 5%",
                "type": TaxType.percentage,
                "value": 5.0,
                "is_active": True
            }
        ]
        
        for tax_data in taxes_data:
            existing = db.query(Tax).filter(Tax.name == tax_data["name"]).first()
            if not existing:
                tax = Tax(**tax_data)
                db.add(tax)
                print(f"  + Created tax: {tax_data['name']}")
            else:
                print(f"  - Tax already exists: {tax_data['name']}")
        
        db.commit()
        
        # Skip discounts - not critical for subscription testing
        print("\nSkipping discounts (not required for subscription testing)...")
        
        # Summary
        print("\n" + "="*50)
        print("DATABASE SEEDING COMPLETE!")
        print("="*50)
        print(f"Customers: {db.query(Customer).count()}")
        print(f"Products: {db.query(Product).count()}")
        print(f"Recurring Plans: {db.query(RecurringPlan).count()}")
        print(f"Quotation Templates: {db.query(QuotationTemplate).count()}")
        print(f"Taxes: {db.query(Tax).count()}")
        print(f"Discounts: {db.query(Discount).count()}")
        print("="*50)
        
    except Exception as e:
        print(f"\nError seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()


