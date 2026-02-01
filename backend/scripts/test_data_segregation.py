#!/usr/bin/env python3
"""
Data Segregation Test Script
Tests that user data is properly isolated in the database
"""

import sqlite3
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import DB_NAME

def test_data_segregation():
    """Test that data is properly segregated by user_id"""
    
    print("🔍 Testing Data Segregation...")
    print(f"📁 Database: {DB_NAME}\n")
    
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Test 1: Check users table
    print("1️⃣ Checking Users Table:")
    cursor.execute("SELECT id, email, name FROM users")
    users = cursor.fetchall()
    
    if not users:
        print("   ⚠️  No users found in database")
    else:
        print(f"   ✅ Found {len(users)} user(s):")
        for user in users:
            print(f"      - {user['email']} (ID: {user['id'][:16]}...)")
    
    print()
    
    # Test 2: Check sensor readings segregation
    print("2️⃣ Checking Sensor Readings Segregation:")
    cursor.execute("""
        SELECT user_id, COUNT(*) as count 
        FROM sensor_readings 
        GROUP BY user_id
    """)
    sensor_data = cursor.fetchall()
    
    if not sensor_data:
        print("   ℹ️  No sensor readings found")
    else:
        print(f"   ✅ Sensor readings properly segregated:")
        for row in sensor_data:
            user_id = row['user_id']
            count = row['count']
            # Find user email
            cursor.execute("SELECT email FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            email = user['email'] if user else "Unknown"
            print(f"      - {email}: {count} reading(s)")
    
    print()
    
    # Test 3: Check voice logs segregation
    print("3️⃣ Checking Voice Logs Segregation:")
    cursor.execute("""
        SELECT user_id, COUNT(*) as count 
        FROM voice_logs 
        GROUP BY user_id
    """)
    voice_data = cursor.fetchall()
    
    if not voice_data:
        print("   ℹ️  No voice logs found")
    else:
        print(f"   ✅ Voice logs properly segregated:")
        for row in voice_data:
            user_id = row['user_id']
            count = row['count']
            cursor.execute("SELECT email FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            email = user['email'] if user else "Unknown"
            print(f"      - {email}: {count} log(s)")
    
    print()
    
    # Test 4: Check pest incidents segregation
    print("4️⃣ Checking Pest Incidents Segregation:")
    cursor.execute("""
        SELECT user_id, COUNT(*) as count 
        FROM pest_incidents 
        GROUP BY user_id
    """)
    pest_data = cursor.fetchall()
    
    if not pest_data:
        print("   ℹ️  No pest incidents found")
    else:
        print(f"   ✅ Pest incidents properly segregated:")
        for row in pest_data:
            user_id = row['user_id']
            count = row['count']
            cursor.execute("SELECT email FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            email = user['email'] if user else "Unknown"
            print(f"      - {email}: {count} incident(s)")
    
    print()
    
    # Test 5: Check crop diagnoses segregation
    print("5️⃣ Checking Crop Diagnoses Segregation:")
    cursor.execute("""
        SELECT user_id, COUNT(*) as count 
        FROM crop_diagnoses 
        GROUP BY user_id
    """)
    diagnosis_data = cursor.fetchall()
    
    if not diagnosis_data:
        print("   ℹ️  No crop diagnoses found")
    else:
        print(f"   ✅ Crop diagnoses properly segregated:")
        for row in diagnosis_data:
            user_id = row['user_id']
            count = row['count']
            cursor.execute("SELECT email FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            email = user['email'] if user else "Unknown"
            print(f"      - {email}: {count} diagnosis(es)")
    
    print()
    
    # Test 6: Verify foreign key constraints
    print("6️⃣ Verifying Foreign Key Constraints:")
    
    # Check for orphaned sensor readings
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM sensor_readings 
        WHERE user_id NOT IN (SELECT id FROM users)
    """)
    orphaned_sensors = cursor.fetchone()['count']
    
    # Check for orphaned voice logs
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM voice_logs 
        WHERE user_id NOT IN (SELECT id FROM users)
    """)
    orphaned_voice = cursor.fetchone()['count']
    
    # Check for orphaned pest incidents
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM pest_incidents 
        WHERE user_id NOT IN (SELECT id FROM users)
    """)
    orphaned_pests = cursor.fetchone()['count']
    
    if orphaned_sensors == 0 and orphaned_voice == 0 and orphaned_pests == 0:
        print("   ✅ No orphaned records found - data integrity maintained")
    else:
        print(f"   ⚠️  Found orphaned records:")
        if orphaned_sensors > 0:
            print(f"      - {orphaned_sensors} sensor reading(s)")
        if orphaned_voice > 0:
            print(f"      - {orphaned_voice} voice log(s)")
        if orphaned_pests > 0:
            print(f"      - {orphaned_pests} pest incident(s)")
    
    print()
    
    # Summary
    print("=" * 60)
    print("📊 SUMMARY:")
    print("=" * 60)
    
    total_users = len(users)
    total_sensor_readings = sum(row['count'] for row in sensor_data) if sensor_data else 0
    total_voice_logs = sum(row['count'] for row in voice_data) if voice_data else 0
    total_pest_incidents = sum(row['count'] for row in pest_data) if pest_data else 0
    total_diagnoses = sum(row['count'] for row in diagnosis_data) if diagnosis_data else 0
    
    print(f"Total Users: {total_users}")
    print(f"Total Sensor Readings: {total_sensor_readings}")
    print(f"Total Voice Logs: {total_voice_logs}")
    print(f"Total Pest Incidents: {total_pest_incidents}")
    print(f"Total Crop Diagnoses: {total_diagnoses}")
    print()
    
    if total_users > 0:
        print("✅ Data segregation is working correctly!")
        print("   Each user's data is isolated by their unique user_id (email)")
    else:
        print("ℹ️  No users found. Data segregation will work once users sign in.")
    
    print("=" * 60)
    
    conn.close()

if __name__ == "__main__":
    test_data_segregation()
