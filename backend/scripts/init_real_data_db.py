"""
Database initialization script for Smart Farm AI
Creates all necessary tables for real user data collection
"""

import sqlite3
import os
from datetime import datetime

import sys
# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import DB_NAME

def init_real_data_schema():
    """Initialize database schema for real user data"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # 1. Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            farm_name TEXT,
            location_lat REAL,
            location_lon REAL,
            location_name TEXT,
            crop_type TEXT DEFAULT 'Strawberries',
            is_terms_agreed BOOLEAN DEFAULT 0,
            terms_agreed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 2. Sensor readings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            temperature REAL NOT NULL,
            humidity REAL NOT NULL,
            vpd REAL,
            soil_moisture REAL,
            light_level REAL,
            co2_level REAL,
            data_source TEXT DEFAULT 'manual',
            notes TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # 3. Pest incidents table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pest_incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            pest_type TEXT NOT NULL,
            severity TEXT CHECK(severity IN ('low', 'medium', 'high')),
            affected_area TEXT,
            treatment TEXT,
            treatment_date DATE,
            resolved BOOLEAN DEFAULT 0,
            notes TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # 4. Crop diagnoses table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS crop_diagnoses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            image_url TEXT,
            diagnosis TEXT,
            confidence REAL,
            treatment TEXT,
            user_feedback TEXT CHECK(user_feedback IN ('correct', 'incorrect', 'partially_correct', NULL)),
            feedback_notes TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # 5. Voice logs table (server-side storage)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS voice_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            text TEXT NOT NULL,
            category TEXT CHECK(category IN ('observation', 'task', 'issue', 'note')),
            parsed_crop TEXT,
            parsed_quantity REAL,
            parsed_unit TEXT,
            parsed_action TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # 6. Market price cache table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS market_price_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            crop_type TEXT NOT NULL,
            date DATE NOT NULL,
            price REAL NOT NULL,
            unit TEXT DEFAULT '$/lb',
            source TEXT,
            market_location TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(crop_type, date, source)
        )
    ''')
    
    # 7. Pest forecasts table (AI predictions)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pest_forecasts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            date DATE NOT NULL,
            risk_score INTEGER,
            pest_type TEXT,
            confidence REAL,
            weather_temp REAL,
            weather_humidity REAL,
            weather_rain REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, date)
        )
    ''')
    
    # 8. User preferences table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_preferences (
            user_id TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, key),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # 9. Data collection reminders table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS data_reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            reminder_type TEXT,
            last_sent TIMESTAMP,
            frequency_hours INTEGER DEFAULT 24,
            enabled BOOLEAN DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Create indexes for better query performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sensor_user_time ON sensor_readings(user_id, timestamp DESC)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_pest_user_time ON pest_incidents(user_id, timestamp DESC)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_diagnoses_user_time ON crop_diagnoses(user_id, timestamp DESC)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_voice_user_time ON voice_logs(user_id, timestamp DESC)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_forecasts_user_date ON pest_forecasts(user_id, date DESC)')
    
    conn.commit()
    conn.close()
    
    print(f"✅ Database schema initialized successfully at {DB_NAME}")
    print("✅ Created tables:")
    print("   - users")
    print("   - sensor_readings")
    print("   - pest_incidents")
    print("   - crop_diagnoses")
    print("   - voice_logs")
    print("   - market_price_cache")
    print("   - pest_forecasts")
    print("   - user_preferences")
    print("   - data_reminders")

def create_sample_user():
    """Create a sample user for testing"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT OR IGNORE INTO users (id, email, name, farm_name, location_lat, location_lon, location_name, crop_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'test_user_001',
            'test@forhumanai.net',
            'Test Farmer',
            'Demo Farm',
            37.7749,
            -122.4194,
            'San Francisco, CA',
            'Strawberries'
        ))
        
        conn.commit()
        print("✅ Sample user created: test@forhumanai.net")
    except Exception as e:
        print(f"⚠️  Sample user may already exist: {e}")
    finally:
        conn.close()

def verify_schema():
    """Verify that all tables were created successfully"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print("\n📊 Database Tables:")
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
        count = cursor.fetchone()[0]
        print(f"   - {table[0]}: {count} records")
    
    conn.close()

if __name__ == "__main__":
    print("🚀 Initializing Smart Farm AI Database...")
    print("=" * 60)
    
    init_real_data_schema()
    create_sample_user()
    verify_schema()
    
    print("\n" + "=" * 60)
    print("✅ Database initialization complete!")
    print(f"📁 Database location: {DB_NAME}")
