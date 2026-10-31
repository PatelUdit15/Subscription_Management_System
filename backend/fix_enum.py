from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
conn = engine.connect()

try:
    # Alter the column to use the enum
    conn.execute(text("""
        ALTER TABLE subscriptions 
        ALTER COLUMN status TYPE subscriptionstatus 
        USING status::text::subscriptionstatus
    """))
    conn.commit()
    print('✓ Updated status column to use enum type')
    
except Exception as e:
    print(f'Error: {e}')
    conn.rollback()
finally:
    conn.close()
