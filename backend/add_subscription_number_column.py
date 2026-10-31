"""
Add number column to subscriptions table
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def add_subscription_number_column():
    """Add number column to subscriptions table if it doesn't exist"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='subscriptions' AND column_name='number'
            """))
            
            if result.fetchone() is None:
                print("Adding 'number' column to subscriptions table...")
                conn.execute(text("""
                    ALTER TABLE subscriptions 
                    ADD COLUMN number VARCHAR UNIQUE
                """))
                conn.commit()
                print("✓ Column 'number' added successfully!")
            else:
                print("✓ Column 'number' already exists")
                
        except Exception as e:
            print(f"Error: {e}")
            conn.rollback()

if __name__ == "__main__":
    add_subscription_number_column()
