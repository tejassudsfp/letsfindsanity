"""Add title column to posts table"""
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
        # Add title column
        cursor.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS title TEXT;")

        # Add is_ai_analysis to comments
        cursor.execute("ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_ai_analysis BOOLEAN DEFAULT FALSE;")

        conn.commit()
        print("✓ Migration completed successfully")
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    run_migration()
