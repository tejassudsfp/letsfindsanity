"""Add safety check fields to sessions table"""
import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get('DATABASE_URL')

def run_migration():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    try:
        # Add safety fields to sessions
        cursor.execute("""
            ALTER TABLE sessions
            ADD COLUMN IF NOT EXISTS is_safe_for_sharing BOOLEAN DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS safety_reason TEXT,
            ADD COLUMN IF NOT EXISTS recommend_professional_help BOOLEAN DEFAULT FALSE;
        """)

        # Add rejection_reason to applications if not exists
        cursor.execute("""
            ALTER TABLE applications
            ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
        """)

        conn.commit()
        print("✓ Migration completed successfully")
        print("  - Added safety fields to sessions table")
        print("  - Added rejection_reason to applications table")
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    run_migration()
