"""
Comprehensive migration to fix subscriptions table schema
Adds all missing columns required by the Subscription model
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def fix_subscription_schema():
    """Add all missing columns to subscriptions table"""
    engine = create_engine(settings.DATABASE_URL)
    
    columns_to_add = [
        ("number", "VARCHAR UNIQUE"),
        ("order_id", "INTEGER"),
        ("quotation_id", "INTEGER UNIQUE"),
        ("next_billing_date", "DATE"),
        ("end_date", "DATE")
    ]
    
    with engine.connect() as conn:
        for column_name, column_type in columns_to_add:
            try:
                # Check if column exists
                result = conn.execute(text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='subscriptions' AND column_name='{column_name}'
                """))
                
                if result.fetchone() is None:
                    print(f"Adding '{column_name}' column to subscriptions table...")
                    conn.execute(text(f"""
                        ALTER TABLE subscriptions 
                        ADD COLUMN {column_name} {column_type}
                    """))
                    conn.commit()
                    print(f"✓ Column '{column_name}' added successfully!")
                else:
                    print(f"✓ Column '{column_name}' already exists")
                    
            except Exception as e:
                print(f"Error adding column '{column_name}': {e}")
                conn.rollback()
        
        print("\n" + "="*50)
        print("Schema migration completed!")
        print("="*50)

if __name__ == "__main__":
    fix_subscription_schema()
