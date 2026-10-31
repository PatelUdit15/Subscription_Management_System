import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Hack123@localhost:5432/subscription_data")

# Connect to database
conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

try:
    # Add 'upi' to the paymentmethod enum type
    cursor.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_enum 
                WHERE enumlabel = 'upi' 
                AND enumtypid = (
                    SELECT oid FROM pg_type WHERE typname = 'paymentmethod'
                )
            ) THEN
                ALTER TYPE paymentmethod ADD VALUE 'upi';
            END IF;
        END $$;
    """)
    
    print("✓ Added 'upi' to paymentmethod enum type")
    
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
