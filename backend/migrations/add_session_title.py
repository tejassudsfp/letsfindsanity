"""
Migration: Add title field to sessions table
Every journal entry must have a title
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()

    print("Starting migration: add_session_title...")

    # Add title column
    cur.execute('''
        ALTER TABLE sessions
        ADD COLUMN IF NOT EXISTS title VARCHAR(200) NOT NULL DEFAULT '';
    ''')
    conn.commit()
    print('✓ Added title column to sessions table')

    # Remove default constraint after adding column
    cur.execute('''
        ALTER TABLE sessions
        ALTER COLUMN title DROP DEFAULT;
    ''')
    conn.commit()
    print('✓ Removed default constraint from title column')

    cur.close()
    conn.close()

    print("Migration completed successfully!")

if __name__ == '__main__':
    run_migration()
