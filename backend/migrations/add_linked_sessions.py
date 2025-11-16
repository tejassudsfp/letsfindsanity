"""
Migration: Add linked_sessions field to sessions table
Stores IDs of previous sessions that were linked for context during analysis
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()

    print("Starting migration: add_linked_sessions...")

    # Add linked_sessions column (array of UUIDs)
    cur.execute('''
        ALTER TABLE sessions
        ADD COLUMN IF NOT EXISTS linked_sessions UUID[] DEFAULT '{}';
    ''')
    conn.commit()
    print('✓ Added linked_sessions column to sessions table')

    cur.close()
    conn.close()

    print("Migration completed successfully!")

if __name__ == '__main__':
    run_migration()
