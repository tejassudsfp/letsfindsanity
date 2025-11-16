"""
Migration: Decouple posts and sessions deletion behavior
Changes posts.session_id foreign key from ON DELETE CASCADE to ON DELETE SET NULL
This allows posts and sessions to be deleted independently while maintaining their link
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()

    print("Starting migration: decouple_posts_sessions...")

    # Drop existing constraint
    cur.execute('ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_session_id_fkey;')
    conn.commit()
    print('✓ Dropped existing posts_session_id_fkey constraint')

    # Add new constraint with SET NULL instead of CASCADE
    cur.execute('''
        ALTER TABLE posts
        ADD CONSTRAINT posts_session_id_fkey
        FOREIGN KEY (session_id)
        REFERENCES sessions(id)
        ON DELETE SET NULL;
    ''')
    conn.commit()
    print('✓ Added new constraint with ON DELETE SET NULL')

    cur.close()
    conn.close()

    print("Migration completed successfully!")

if __name__ == '__main__':
    run_migration()
