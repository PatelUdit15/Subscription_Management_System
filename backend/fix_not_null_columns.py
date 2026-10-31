"""
Fix NOT NULL columns in subscriptions table
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def fix_not_null_columns():
    """Add NOT NULL columns with default values for existing rows"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # First, check if there are any existing subscriptions
            result = conn.execute(text("SELECT COUNT(*) FROM subscriptions"))
            count = result.fetchone()[0]
            print(f"Found {count} existing subscription(s) in the table")
            
            # Check if product_id column exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='subscriptions' AND column_name='product_id'
            """))
            
            if result.fetchone() is None:
                print("\nAdding 'product_id' column...")
                # Add as nullable first
                conn.execute(text("""
                    ALTER TABLE subscriptions 
                    ADD COLUMN product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT
                """))
                conn.commit()
                
                # Get first product ID to use as default
                result = conn.execute(text("SELECT id FROM products LIMIT 1"))
                first_product = result.fetchone()
                if first_product:
                    default_product_id = first_product[0]
                    print(f"Setting default product_id={default_product_id} for existing rows...")
                    conn.execute(text(f"""
                        UPDATE subscriptions 
                        SET product_id = {default_product_id} 
                        WHERE product_id IS NULL
                    """))
                    conn.commit()
                
                # Now make it NOT NULL
                conn.execute(text("""
                    ALTER TABLE subscriptions 
                    ALTER COLUMN product_id SET NOT NULL
                """))
                conn.commit()
                print("✓ Column 'product_id' added successfully!")
            else:
                print("✓ Column 'product_id' already exists")
            
            # Check if recurring_plan_id column exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='subscriptions' AND column_name='recurring_plan_id'
            """))
            
            if result.fetchone() is None:
                print("\nAdding 'recurring_plan_id' column...")
                # Add as nullable first
                conn.execute(text("""
                    ALTER TABLE subscriptions 
                    ADD COLUMN recurring_plan_id INTEGER REFERENCES recurring_plans(id) ON DELETE RESTRICT
                """))
                conn.commit()
                
                # Get first recurring plan ID to use as default
                result = conn.execute(text("SELECT id FROM recurring_plans LIMIT 1"))
                first_plan = result.fetchone()
                if first_plan:
                    default_plan_id = first_plan[0]
                    print(f"Setting default recurring_plan_id={default_plan_id} for existing rows...")
                    conn.execute(text(f"""
                        UPDATE subscriptions 
                        SET recurring_plan_id = {default_plan_id} 
                        WHERE recurring_plan_id IS NULL
                    """))
                    conn.commit()
                
                # Now make it NOT NULL
                conn.execute(text("""
                    ALTER TABLE subscriptions 
                    ALTER COLUMN recurring_plan_id SET NOT NULL
                """))
                conn.commit()
                print("✓ Column 'recurring_plan_id' added successfully!")
            else:
                print("✓ Column 'recurring_plan_id' already exists")
            
            print("\n" + "="*70)
            print("Schema migration completed successfully!")
            print("="*70)
            
        except Exception as e:
            print(f"Error: {e}")
            conn.rollback()

if __name__ == "__main__":
    fix_not_null_columns()
