"""Add deletion_requests table for account deletion workflow"""
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
        # Create deletion_requests table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS deletion_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                email TEXT NOT NULL,
                three_word_id TEXT,
                reason TEXT,
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved_delete_all', 'approved_retain_data', 'rejected')),
                admin_notes TEXT,
                reviewed_by UUID REFERENCES users(id),
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                reviewed_at TIMESTAMP,
                UNIQUE(user_id)
            );
        """)

        # Add index for faster queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_deletion_requests_status
            ON deletion_requests(status);
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_deletion_requests_created
            ON deletion_requests(created_at DESC);
        """)

        conn.commit()
        print("✓ Migration completed successfully")
        print("  - Created deletion_requests table")
        print("  - Added indexes for status and created_at")
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    run_migration()
