"""
Add payment_done column to subscriptions table
"""
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def add_payment_done_column():
    """Add payment_done column to subscriptions table"""
    try:
        # Parse DATABASE_URL
        # Format: postgresql://user:password@host:port/database
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
        
        # Check if column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='subscriptions' AND column_name='payment_done'
        """)
        
        if cursor.fetchone():
            print("✓ Column 'payment_done' already exists in subscriptions table")
        else:
            # Add payment_done column
            cursor.execute("""
                ALTER TABLE subscriptions 
                ADD COLUMN payment_done BOOLEAN NOT NULL DEFAULT FALSE
            """)
            conn.commit()
            print("✓ Added 'payment_done' column to subscriptions table")
        
        cursor.close()
        conn.close()
        print("\n✓ Migration completed successfully!")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        if conn:
            conn.rollback()

if __name__ == "__main__":
    print("Adding payment_done column to subscriptions table...")
    add_payment_done_column()
