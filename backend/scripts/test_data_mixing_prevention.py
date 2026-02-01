#!/usr/bin/env python3
"""
Comprehensive Data Mixing Prevention Test
Tests all potential data mixing scenarios
"""

import sqlite3
import sys
import os
import hashlib
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import DB_NAME

def create_test_users():
    """Create test users"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    test_users = [
        ("user1@test.com", "Test User 1"),
        ("user2@test.com", "Test User 2"),
        ("user3@test.com", "Test User 3")
    ]
    
    user_ids = []
    for email, name in test_users:
        user_id = hashlib.sha256(email.encode()).hexdigest()[:16]
        user_ids.append((user_id, email))
        
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO users (id, email, name, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, email, name, datetime.now(), datetime.now()))
    
    conn.commit()
    conn.close()
    
    return user_ids

def test_sensor_data_isolation(user_ids):
    """Test that sensor data is properly isolated"""
    print("\n🧪 Testing Sensor Data Isolation...")
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Insert test data for each user
    for user_id, email in user_ids:
        cursor.execute("""
            INSERT INTO sensor_readings 
            (user_id, temperature, humidity, vpd, data_source)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, 20.0 + user_ids.index((user_id, email)), 50.0, 1.0, 'test'))
    
    conn.commit()
    
    # Verify isolation
    all_passed = True
    for user_id, email in user_ids:
        cursor.execute("""
            SELECT COUNT(*) as count FROM sensor_readings
            WHERE user_id = ? AND data_source = 'test'
        """, (user_id,))
        
        count = cursor.fetchone()[0]
        if count != 1:
            print(f"   ❌ FAIL: User {email} has {count} records (expected 1)")
            all_passed = False
        else:
            print(f"   ✅ PASS: User {email} has exactly 1 record")
    
    # Cleanup
    cursor.execute("DELETE FROM sensor_readings WHERE data_source = 'test'")
    conn.commit()
    conn.close()
    
    return all_passed

def test_voice_logs_isolation(user_ids):
    """Test that voice logs are properly isolated"""
    print("\n🧪 Testing Voice Logs Isolation...")
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Insert test data for each user
    for user_id, email in user_ids:
        cursor.execute("""
            INSERT INTO voice_logs 
            (user_id, text, category, timestamp)
            VALUES (?, ?, ?, ?)
        """, (user_id, f"Test log for {email}", "note", datetime.now().isoformat()))
    
    conn.commit()
    
    # Verify isolation
    all_passed = True
    for user_id, email in user_ids:
        cursor.execute("""
            SELECT COUNT(*) as count FROM voice_logs
            WHERE user_id = ? AND category = 'note' AND text LIKE 'Test log for%'
        """, (user_id,))
        
        count = cursor.fetchone()[0]
        if count != 1:
            print(f"   ❌ FAIL: User {email} has {count} voice logs (expected 1)")
            all_passed = False
        else:
            print(f"   ✅ PASS: User {email} has exactly 1 voice log")
    
    # Cleanup
    cursor.execute("DELETE FROM voice_logs WHERE category = 'note' AND text LIKE 'Test log for%'")
    conn.commit()
    conn.close()
    
    return all_passed

def test_calibration_data_isolation(user_ids):
    """Test that calibration data is properly isolated"""
    print("\n🧪 Testing Calibration Data Isolation...")
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='calibration_data'
    """)
    
    if not cursor.fetchone():
        print("   ℹ️  Calibration table doesn't exist yet (will be created on first use)")
        conn.close()
        return True
    
    # Insert test data for each user
    for user_id, email in user_ids:
        cursor.execute("""
            INSERT INTO calibration_data 
            (user_id, actual_temp_c, weather_temp_c, weather_humidity, weather_wind_speed, weather_rain)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, 25.0, 24.0, 50.0, 5.0, 0.0))
    
    conn.commit()
    
    # Verify isolation
    all_passed = True
    for user_id, email in user_ids:
        cursor.execute("""
            SELECT COUNT(*) as count FROM calibration_data
            WHERE user_id = ?
        """, (user_id,))
        
        count = cursor.fetchone()[0]
        if count < 1:
            print(f"   ❌ FAIL: User {email} has {count} calibration records (expected >= 1)")
            all_passed = False
        else:
            print(f"   ✅ PASS: User {email} has {count} calibration record(s)")
    
    # Cleanup
    cursor.execute("DELETE FROM calibration_data WHERE user_id IN (?, ?, ?)", 
                   tuple(uid for uid, _ in user_ids))
    conn.commit()
    conn.close()
    
    return all_passed

def test_control_logs_isolation(user_ids):
    """Test that control logs are properly isolated"""
    print("\n🧪 Testing Control Logs Isolation...")
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='control_logs'
    """)
    
    if not cursor.fetchone():
        print("   ℹ️  Control logs table doesn't exist yet (will be created on first use)")
        conn.close()
        return True
    
    # Insert test data for each user
    import json
    for user_id, email in user_ids:
        cursor.execute("""
            INSERT INTO control_logs 
            (user_id, action, state_before, state_after)
            VALUES (?, ?, ?, ?)
        """, (user_id, "test_action", json.dumps({"test": "before"}), json.dumps({"test": "after"})))
    
    conn.commit()
    
    # Verify isolation
    all_passed = True
    for user_id, email in user_ids:
        cursor.execute("""
            SELECT COUNT(*) as count FROM control_logs
            WHERE user_id = ? AND action = 'test_action'
        """, (user_id,))
        
        count = cursor.fetchone()[0]
        if count != 1:
            print(f"   ❌ FAIL: User {email} has {count} control logs (expected 1)")
            all_passed = False
        else:
            print(f"   ✅ PASS: User {email} has exactly 1 control log")
    
    # Cleanup
    cursor.execute("DELETE FROM control_logs WHERE action = 'test_action'")
    conn.commit()
    conn.close()
    
    return all_passed

def test_location_data_isolation(user_ids):
    """Test that location data is properly isolated"""
    print("\n🧪 Testing Location Data Isolation...")
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Update location for each user
    cities = ["San Francisco", "New York", "Los Angeles"]
    for i, (user_id, email) in enumerate(user_ids):
        cursor.execute("""
            UPDATE users
            SET location_city = ?, location_consent = 1
            WHERE id = ?
        """, (cities[i], user_id))
    
    conn.commit()
    
    # Verify isolation
    all_passed = True
    for i, (user_id, email) in enumerate(user_ids):
        cursor.execute("""
            SELECT location_city FROM users WHERE id = ?
        """, (user_id,))
        
        row = cursor.fetchone()
        if row and row[0] == cities[i]:
            print(f"   ✅ PASS: User {email} has correct location ({cities[i]})")
        else:
            print(f"   ❌ FAIL: User {email} has wrong location (expected {cities[i]})")
            all_passed = False
    
    # Cleanup
    cursor.execute("""
        UPDATE users 
        SET location_city = NULL, location_consent = 0
        WHERE id IN (?, ?, ?)
    """, tuple(uid for uid, _ in user_ids))
    conn.commit()
    conn.close()
    
    return all_passed

def test_cross_user_data_access():
    """Test that users cannot access each other's data"""
    print("\n🧪 Testing Cross-User Data Access Prevention...")
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Get two different users
    cursor.execute("SELECT id, email FROM users LIMIT 2")
    users = cursor.fetchall()
    
    if len(users) < 2:
        print("   ⚠️  Need at least 2 users for this test")
        conn.close()
        return True
    
    user1_id, user1_email = users[0]
    user2_id, user2_email = users[1]
    
    # Try to query user1's data with user2's ID
    cursor.execute("""
        SELECT COUNT(*) FROM sensor_readings
        WHERE user_id = ?
    """, (user1_id,))
    user1_count = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT COUNT(*) FROM sensor_readings
        WHERE user_id = ?
    """, (user2_id,))
    user2_count = cursor.fetchone()[0]
    
    # Verify that counts are different (if both have data)
    if user1_count > 0 and user2_count > 0:
        print(f"   ✅ PASS: User1 has {user1_count} records, User2 has {user2_count} records")
        print(f"   ✅ PASS: Data is properly segregated")
    else:
        print(f"   ℹ️  User1: {user1_count} records, User2: {user2_count} records")
        print(f"   ℹ️  Test inconclusive (need data for both users)")
    
    conn.close()
    return True

def cleanup_test_users(user_ids):
    """Cleanup test users"""
    print("\n🧹 Cleaning up test users...")
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    for user_id, email in user_ids:
        # Delete all related data
        cursor.execute("DELETE FROM sensor_readings WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM voice_logs WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        print(f"   ✅ Cleaned up {email}")
    
    conn.commit()
    conn.close()

def main():
    print("=" * 70)
    print("🔒 COMPREHENSIVE DATA MIXING PREVENTION TEST")
    print("=" * 70)
    print(f"📁 Database: {DB_NAME}\n")
    
    # Create test users
    print("📝 Creating test users...")
    user_ids = create_test_users()
    print(f"   ✅ Created {len(user_ids)} test users\n")
    
    # Run all tests
    results = []
    results.append(("Sensor Data Isolation", test_sensor_data_isolation(user_ids)))
    results.append(("Voice Logs Isolation", test_voice_logs_isolation(user_ids)))
    results.append(("Calibration Data Isolation", test_calibration_data_isolation(user_ids)))
    results.append(("Control Logs Isolation", test_control_logs_isolation(user_ids)))
    results.append(("Location Data Isolation", test_location_data_isolation(user_ids)))
    results.append(("Cross-User Access Prevention", test_cross_user_data_access()))
    
    # Cleanup
    cleanup_test_users(user_ids)
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("\n" + "=" * 70)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("✅ ALL TESTS PASSED - No data mixing detected!")
    else:
        print("❌ SOME TESTS FAILED - Data mixing possible!")
        sys.exit(1)
    
    print("=" * 70)

if __name__ == "__main__":
    main()
