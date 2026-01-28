"""
Database Migration Script
Updates existing database schema with new columns if they don't exist.
"""

import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "farm_data.db")

def migrate_db():
    print(f"Migrating database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check users table columns
    cursor.execute("PRAGMA table_info(users)")
    columns = [info[1] for info in cursor.fetchall()]
    print(f"Existing columns: {columns}")
    
    # 1. Update users table with legal consent fields
    if "is_terms_agreed" not in columns:
        print("Adding 'is_terms_agreed' column...")
        cursor.execute("ALTER TABLE users ADD COLUMN is_terms_agreed INTEGER DEFAULT 0")
        
    if "terms_agreed_at" not in columns:
        print("Adding 'terms_agreed_at' column...")
        cursor.execute("ALTER TABLE users ADD COLUMN terms_agreed_at TEXT")

    # 2. Add privacy_agreed just in case
    if "privacy_agreed" not in columns:
        print("Adding 'privacy_agreed' column...")
        cursor.execute("ALTER TABLE users ADD COLUMN privacy_agreed INTEGER DEFAULT 0")

    conn.commit()
    conn.close()
    print("Migration complete successfully.")

if __name__ == "__main__":
    migrate_db()
