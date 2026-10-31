import psycopg2
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Hack123@localhost:5432/subscription_data")

# Connect to database
conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

try:
    # Add number column to orders table
    cursor.execute("""
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS number VARCHAR UNIQUE
    """)
    print("✓ Added 'number' column to orders table")
    
    # Generate order numbers for existing orders
    cursor.execute("SELECT id, created_at FROM orders ORDER BY id")
    orders = cursor.fetchall()
    
    for order_id, created_at in orders:
        # Get year from created_at
        try:
            if created_at:
                year = created_at.year
            else:
                year = datetime.now().year
        except:
            year = datetime.now().year
        
        # Generate order number: ORD/YYYY/NNNN
        order_number = f"ORD/{year}/{str(order_id).zfill(4)}"
        cursor.execute("UPDATE orders SET number = %s WHERE id = %s AND number IS NULL", (order_number, order_id))
    
    print(f"✓ Generated order numbers for {len(orders)} existing orders")
    
    conn.commit()
    print("\n✅ Migration completed successfully!")
    
except psycopg2.Error as e:
    print(f"❌ Database Error: {e}")
    conn.rollback()
except Exception as e:
    print(f"❌ Error: {e}")
    conn.rollback()
finally:
    cursor.close()
    conn.close()
