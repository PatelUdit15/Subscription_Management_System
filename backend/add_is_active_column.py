"""
Migration script to add is_active column to products table
Run this once: python add_is_active_column.py
"""
import psycopg2
from app.core.config import settings

def add_is_active_column():
    try:
        # Parse DATABASE_URL
        db_url = settings.DATABASE_URL
        # Extract connection details from postgresql://user:pass@host:port/dbname
        db_url = db_url.replace('postgresql://', '')
        user_pass, host_port_db = db_url.split('@')
        user, password = user_pass.split(':')
        host_port, dbname = host_port_db.split('/')
        host, port = host_port.split(':')
        
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=dbname,
            user=user,
            password=password
        )
        cursor = conn.cursor()
        
        # Add is_active column if it doesn't exist
        cursor.execute("""
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
        """)
        
        conn.commit()
        print("✅ Successfully added is_active column to products table")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Note: If column already exists, this is expected.")

if __name__ == "__main__":
    add_is_active_column()
