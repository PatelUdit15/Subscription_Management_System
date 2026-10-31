"""
Verify subscriptions table schema
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def verify_schema():
    """Check all columns in subscriptions table"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name='subscriptions' 
            ORDER BY ordinal_position
        """))
        
        print("\nSubscriptions Table Schema:")
        print("=" * 70)
        print(f"{'Column Name':<30} {'Data Type':<20} {'Nullable':<10}")
        print("-" * 70)
        
        for row in result:
            print(f"{row[0]:<30} {row[1]:<20} {row[2]:<10}")
        
        print("=" * 70)
        
        # Check for required columns from the model
        required_columns = [
            'id', 'number', 'order_id', 'quotation_id', 'customer_id',
            'product_id', 'recurring_plan_id', 'start_date', 
            'next_billing_date', 'end_date', 'created_at', 'status',
            'recurring_amount'
        ]
        
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='subscriptions'
        """))
        
        existing_columns = [row[0] for row in result]
        
        print("\nColumn Check:")
        print("-" * 70)
        for col in required_columns:
            status = "✓" if col in existing_columns else "✗ MISSING"
            print(f"{col:<30} {status}")
        
        print("=" * 70)

if __name__ == "__main__":
    verify_schema()
