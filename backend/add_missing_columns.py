"""
Add all missing columns to subscriptions table
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def add_missing_columns():
    """Add all missing columns required by the Subscription model"""
    engine = create_engine(settings.DATABASE_URL)
    
    # Define columns to add with their types and constraints
    columns_to_add = [
        ("customer_id", "INTEGER", "REFERENCES customers(id) ON DELETE RESTRICT"),
        ("product_id", "INTEGER NOT NULL", "REFERENCES products(id) ON DELETE RESTRICT"),
        ("recurring_plan_id", "INTEGER NOT NULL", "REFERENCES recurring_plans(id) ON DELETE RESTRICT"),
        ("created_at", "TIMESTAMP NOT NULL", "DEFAULT CURRENT_TIMESTAMP"),
        ("recurring_amount", "DOUBLE PRECISION", "")
    ]
    
    with engine.connect() as conn:
        for column_info in columns_to_add:
            column_name = column_info[0]
            column_type = column_info[1]
            constraint = column_info[2]
            
            try:
                # Check if column exists
                result = conn.execute(text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='subscriptions' AND column_name='{column_name}'
                """))
                
                if result.fetchone() is None:
                    print(f"Adding '{column_name}' column...")
                    
                    # Build the ALTER TABLE statement
                    alter_statement = f"ALTER TABLE subscriptions ADD COLUMN {column_name} {column_type}"
                    if constraint:
                        alter_statement += f" {constraint}"
                    
                    conn.execute(text(alter_statement))
                    conn.commit()
                    print(f"✓ Column '{column_name}' added successfully!")
                else:
                    print(f"✓ Column '{column_name}' already exists")
                    
            except Exception as e:
                print(f"Error adding column '{column_name}': {e}")
                conn.rollback()
        
        print("\n" + "="*70)
        print("All missing columns have been added!")
        print("="*70)
        print("\nNOTE: If you have existing data in the subscriptions table,")
        print("you may need to update NULL values for NOT NULL columns.")

if __name__ == "__main__":
    add_missing_columns()
