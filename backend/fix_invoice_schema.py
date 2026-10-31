"""
Fix invoice schema - add notes column and make fields nullable
"""
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def fix_invoice_schema():
    """Add notes column and make subscription_id and number nullable"""
    try:
        # Parse DATABASE_URL
        url_parts = DATABASE_URL.replace("postgresql://", "").split("@")
        user_pass = url_parts[0].split(":")
        host_db = url_parts[1].split("/")
        host_port = host_db[0].split(":")
        
        conn = psycopg2.connect(
            dbname=host_db[1],
            user=user_pass[0],
            password=user_pass[1],
            host=host_port[0],
            port=host_port[1] if len(host_port) > 1 else "5432"
        )
        
        cursor = conn.cursor()
        
        # Check if notes column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='invoices' AND column_name='notes'
        """)
        
        if cursor.fetchone():
            print("✓ Column 'notes' already exists in invoices table")
        else:
            cursor.execute("""
                ALTER TABLE invoices 
                ADD COLUMN notes TEXT
            """)
            conn.commit()
            print("✓ Added 'notes' column to invoices table")
        
        # Make subscription_id nullable
        try:
            cursor.execute("""
                ALTER TABLE invoices 
                ALTER COLUMN subscription_id DROP NOT NULL
            """)
            conn.commit()
            print("✓ Made 'subscription_id' nullable in invoices table")
        except Exception as e:
            print(f"Note: subscription_id might already be nullable: {e}")
            conn.rollback()
        
        # Make number nullable
        try:
            cursor.execute("""
                ALTER TABLE invoices 
                ALTER COLUMN number DROP NOT NULL
            """)
            conn.commit()
            print("✓ Made 'number' nullable in invoices table")
        except Exception as e:
            print(f"Note: number might already be nullable: {e}")
            conn.rollback()
        
        cursor.close()
        conn.close()
        print("\n✓ Migration completed successfully!")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    print("Fixing invoice schema...")
    fix_invoice_schema()
