#!/usr/bin/env python3
"""
Production Data Cleanup Script
Removes all test/sample data from production database
Only keeps real user data from Google OAuth
"""

import sqlite3
import os
import sys

# Database path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "farm_data.db")

def cleanup_production_data():
    """Remove all sample/test data, keep only real user data"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at: {DB_PATH}")
        return False
    
    print(f"🔍 Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # 1. Delete test user
        cursor.execute("DELETE FROM users WHERE id = 'test_user_001' OR email = 'test@forhumanai.net'")
        test_users_deleted = cursor.rowcount
        print(f"✅ Deleted {test_users_deleted} test user(s)")
        
        # 2. Delete all sensor readings from test user
        cursor.execute("DELETE FROM sensor_readings WHERE user_id = 'test_user_001'")
        test_readings_deleted = cursor.rowcount
        print(f"✅ Deleted {test_readings_deleted} test sensor reading(s)")
        
        # 3. Delete all pest forecasts from test user
        cursor.execute("DELETE FROM pest_forecasts WHERE user_id = 'test_user_001'")
        test_forecasts_deleted = cursor.rowcount
        print(f"✅ Deleted {test_forecasts_deleted} test pest forecast(s)")
        
        # 4. Delete other test data
        cursor.execute("DELETE FROM pest_incidents WHERE user_id = 'test_user_001'")
        cursor.execute("DELETE FROM crop_diagnoses WHERE user_id = 'test_user_001'")
        cursor.execute("DELETE FROM voice_logs WHERE user_id = 'test_user_001'")
        
        # 5. Show remaining real users
        cursor.execute("SELECT COUNT(*) FROM users")
        real_users = cursor.fetchone()[0]
        print(f"📊 Remaining real users: {real_users}")
        
        cursor.execute("SELECT COUNT(*) FROM sensor_readings")
        real_readings = cursor.fetchone()[0]
        print(f"📊 Remaining sensor readings: {real_readings}")
        
        # Commit changes
        conn.commit()
        print("\n✅ Production data cleanup complete!")
        print("🎉 Database now contains only real user data")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        conn.rollback()
        return False
        
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🧹 PRODUCTION DATA CLEANUP")
    print("=" * 60)
    print("\nThis script will:")
    print("  - Remove test user (test_user_001)")
    print("  - Remove all associated test data")
    print("  - Keep all real user data from Google OAuth")
    print("\n" + "=" * 60)
    
    response = input("\n⚠️  Continue? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        success = cleanup_production_data()
        sys.exit(0 if success else 1)
    else:
        print("❌ Cleanup cancelled")
        sys.exit(0)
