"""
Add description and tax_rate columns to invoice_lines table
"""
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def add_invoice_line_columns():
    """Add description and tax_rate columns to invoice_lines table"""
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
        
        # Check if description column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='invoice_lines' AND column_name='description'
        """)
        
        if cursor.fetchone():
            print("✓ Column 'description' already exists in invoice_lines table")
        else:
            cursor.execute("""
                ALTER TABLE invoice_lines 
                ADD COLUMN description VARCHAR
            """)
            conn.commit()
            print("✓ Added 'description' column to invoice_lines table")
        
        # Check if tax_rate column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='invoice_lines' AND column_name='tax_rate'
        """)
        
        if cursor.fetchone():
            print("✓ Column 'tax_rate' already exists in invoice_lines table")
        else:
            cursor.execute("""
                ALTER TABLE invoice_lines 
                ADD COLUMN tax_rate FLOAT DEFAULT 0.0
            """)
            conn.commit()
            print("✓ Added 'tax_rate' column to invoice_lines table")
        
        # Make product_id nullable
        cursor.execute("""
            ALTER TABLE invoice_lines 
            ALTER COLUMN product_id DROP NOT NULL
        """)
        conn.commit()
        print("✓ Made 'product_id' nullable in invoice_lines table")
        
        cursor.close()
        conn.close()
        print("\n✓ Migration completed successfully!")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        if conn:
            conn.rollback()

if __name__ == "__main__":
    print("Adding columns to invoice_lines table...")
    add_invoice_line_columns()
