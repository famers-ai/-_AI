#!/usr/bin/env python3
"""
데이터베이스 마이그레이션: 위치 정보 컬럼 추가
기존 데이터베이스에 새로운 위치 관련 컬럼을 안전하게 추가합니다.
"""

import sqlite3
import os
from datetime import datetime

# Database path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "farm_data.db")

def migrate_add_location_fields():
    """Add location consent and city-level location fields to users table"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at: {DB_PATH}")
        print("ℹ️  Run the application first to create the database")
        return False
    
    print(f"🔍 Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("\n" + "="*60)
        print("📊 데이터베이스 마이그레이션: 위치 정보 필드 추가")
        print("="*60)
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        
        new_columns = {
            'location_city': 'TEXT',
            'location_region': 'TEXT',
            'location_country': 'TEXT',
            'location_consent': 'BOOLEAN DEFAULT 0',
            'location_updated_at': 'TIMESTAMP'
        }
        
        added_count = 0
        
        for col_name, col_type in new_columns.items():
            if col_name not in columns:
                print(f"\n✅ Adding column: {col_name} ({col_type})")
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                added_count += 1
            else:
                print(f"⏭️  Column already exists: {col_name}")
        
        if added_count > 0:
            conn.commit()
            print(f"\n🎉 Successfully added {added_count} new column(s)!")
        else:
            print(f"\n✅ All columns already exist. No migration needed.")
        
        # Verify the schema
        print("\n" + "="*60)
        print("📋 Updated Users Table Schema")
        print("="*60)
        cursor.execute("PRAGMA table_info(users)")
        for col in cursor.fetchall():
            print(f"  {col[1]}: {col[2]}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        conn.rollback()
        return False
        
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🔄 Database Migration: Location Fields")
    print("=" * 60)
    print("\nThis migration will add the following fields to the users table:")
    print("  - location_city (TEXT)")
    print("  - location_region (TEXT)")
    print("  - location_country (TEXT)")
    print("  - location_consent (BOOLEAN)")
    print("  - location_updated_at (TIMESTAMP)")
    print("\n" + "=" * 60)
    
    response = input("\n⚠️  Continue with migration? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        import sys
        success = migrate_add_location_fields()
        sys.exit(0 if success else 1)
    else:
        print("❌ Migration cancelled")
        import sys
        sys.exit(0)
