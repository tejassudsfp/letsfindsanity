"""Setup database and create admin user"""
import os
import sys
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path to import from services
sys.path.insert(0, str(Path(__file__).parent.parent))

DATABASE_URL = os.environ.get('DATABASE_URL')

def run_sql_file(conn, filepath):
    """Execute SQL file"""
    with open(filepath, 'r') as f:
        sql = f.read()

    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        conn.commit()
        print(f"✓ Executed {filepath}")
    except Exception as e:
        print(f"✗ Error executing {filepath}: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()

def create_admin(conn, email):
    """Create admin user"""
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO users (email, is_admin)
            VALUES (%s, TRUE)
            ON CONFLICT (email)
            DO UPDATE SET is_admin = TRUE
            RETURNING id, email, is_admin
        """, [email])
        conn.commit()
        result = cursor.fetchone()
        print(f"✓ Admin user created/updated: {result[1]} (is_admin={result[2]})")
        return result[0]
    except Exception as e:
        print(f"✗ Error creating admin: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()

def main():
    if not DATABASE_URL:
        print("Error: DATABASE_URL environment variable not set")
        sys.exit(1)

    print("Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL)

    try:
        # Initialize database schema
        print("\n1. Initializing database schema...")
        script_dir = Path(__file__).parent
        init_sql = script_dir / 'init_db.sql'
        run_sql_file(conn, init_sql)

        # Create admin user
        print("\n2. Creating admin user...")
        admin_email = sys.argv[1] if len(sys.argv) > 1 else 'tejas@fanpit.live'
        create_admin(conn, admin_email)

        print("\n✓ Database setup complete!")

    except Exception as e:
        print(f"\n✗ Setup failed: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == '__main__':
    main()
