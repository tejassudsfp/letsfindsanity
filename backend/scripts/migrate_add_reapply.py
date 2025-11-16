"""Add can_reapply field to applications table"""
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
        # Add can_reapply field
        cursor.execute("""
            ALTER TABLE applications
            ADD COLUMN IF NOT EXISTS can_reapply BOOLEAN DEFAULT FALSE;
        """)

        # Update existing rejected applications to allow reapply
        cursor.execute("""
            UPDATE applications
            SET can_reapply = TRUE
            WHERE status = 'rejected';
        """)

        conn.commit()
        print("✓ Migration completed successfully")
        print("  - Added can_reapply field to applications table")
        print("  - Set can_reapply=true for all rejected applications")
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    run_migration()
