"""
Script to create a customer/portal user for testing
Run this once: python create_customer_user.py
"""
import psycopg2
from app.core.config import settings
from app.core.security import get_password_hash

def create_customer_user():
    try:
        # Parse DATABASE_URL
        db_url = settings.DATABASE_URL
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
        
        # Check if customer user exists
        cursor.execute("SELECT id FROM users WHERE email = 'customer@example.com'")
        existing = cursor.fetchone()
        
        if existing:
            print("✅ Customer user already exists")
        else:
            # Create customer user
            hashed_password = get_password_hash("customer123")
            cursor.execute("""
                INSERT INTO users (name, email, hashed_password, role)
                VALUES (%s, %s, %s, %s)
            """, ('Customer User', 'customer@example.com', hashed_password, 'portal'))
            
            conn.commit()
            print("✅ Customer user created: customer@example.com / customer123")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    create_customer_user()
