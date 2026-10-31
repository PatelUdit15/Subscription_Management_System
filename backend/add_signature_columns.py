"""
Add signature columns to subscriptions table
"""
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def add_signature_columns():
    with engine.connect() as conn:
        try:
            # Add signature columns to subscriptions table
            print("Adding signature columns to subscriptions table...")
            
            # Check if columns already exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='subscriptions' 
                AND column_name IN ('signature_data', 'signed_by', 'signed_at', 'share_token')
            """))
            existing_columns = [row[0] for row in result]
            
            if 'signature_data' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE subscriptions 
                    ADD COLUMN signature_data TEXT
                """))
                print("✓ Added signature_data column")
            else:
                print("- signature_data column already exists")
            
            if 'signed_by' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE subscriptions 
                    ADD COLUMN signed_by VARCHAR(255)
                """))
                print("✓ Added signed_by column")
            else:
                print("- signed_by column already exists")
            
            if 'signed_at' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE subscriptions 
                    ADD COLUMN signed_at TIMESTAMP
                """))
                print("✓ Added signed_at column")
            else:
                print("- signed_at column already exists")
            
            if 'share_token' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE subscriptions 
                    ADD COLUMN share_token VARCHAR(255) UNIQUE
                """))
                print("✓ Added share_token column")
            else:
                print("- share_token column already exists")
            
            conn.commit()
            print("\n✅ Signature columns added successfully!")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            conn.rollback()

if __name__ == "__main__":
    add_signature_columns()
