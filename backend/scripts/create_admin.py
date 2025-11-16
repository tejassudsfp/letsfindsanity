"""Script to create an admin account"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.database import db
from services.identity_service import generate_three_word_id


def create_admin(email):
    """Create an admin account"""

    # Check if user exists
    existing = db.execute("""
        SELECT id, is_admin, three_word_id FROM users WHERE email = %s
    """, [email], fetch_one=True)

    if existing:
        if existing['is_admin']:
            print(f"✓ {email} is already an admin")
            return

        # Update existing user to admin
        db.execute("""
            UPDATE users SET is_admin = TRUE WHERE email = %s
        """, [email], commit=True)
        print(f"✓ Updated {email} to admin")

        if existing['three_word_id']:
            print(f"  Three-word ID: {existing['three_word_id']}")
    else:
        # Create new admin user
        three_word_id = generate_three_word_id()
        db.execute("""
            INSERT INTO users (email, is_admin, three_word_id)
            VALUES (%s, TRUE, %s)
        """, [email, three_word_id], commit=True)
        print(f"✓ Created admin account for {email}")
        print(f"  Three-word ID: {three_word_id}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python create_admin.py <email>")
        sys.exit(1)

    email = sys.argv[1].strip().lower()
    create_admin(email)
