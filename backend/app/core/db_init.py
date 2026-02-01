
import sqlite3
import os
import logging

from app.core.config import DB_NAME


logger = logging.getLogger(__name__)

def init_db_if_missing():
    """Check if database exists, if not create it and initialize schema"""
    if not os.path.exists(DB_NAME):
        logger.info(f"Database not found at {DB_NAME}. Initializing...")
        init_real_data_schema()
        # DO NOT create sample user - only real users via Google OAuth
        logger.info("Database schema initialized. No sample data created.")
    else:
        logger.info(f"Database found at {DB_NAME}. Checking schema...")
        # Optional: Add migration logic here if needed
        pass

def init_real_data_schema():
    """Initialize database schema for real user data"""
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        # CRITICAL: Enable foreign key constraints for data integrity
        cursor.execute("PRAGMA foreign_keys = ON")
        
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
                location_city TEXT,
                location_region TEXT,
                location_country TEXT,
                location_consent BOOLEAN DEFAULT 0,
                location_updated_at TIMESTAMP,
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
        
        # 5. Voice logs table
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
        
        # 7. Pest forecasts table
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
        
        # 10. Safety Logs (for AI Engine)
        cursor.execute('''
             CREATE TABLE IF NOT EXISTS safety_logs (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 user_id TEXT NOT NULL,
                 timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                 crop_type TEXT,
                 message TEXT, 
                 severity TEXT,
                 FOREIGN KEY (user_id) REFERENCES users(id)
             )
        ''')
        
        # Indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sensor_user_time ON sensor_readings(user_id, timestamp DESC)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_pest_user_time ON pest_incidents(user_id, timestamp DESC)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_diagnoses_user_time ON crop_diagnoses(user_id, timestamp DESC)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_voice_user_time ON voice_logs(user_id, timestamp DESC)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_forecasts_user_date ON pest_forecasts(user_id, date DESC)')
        
        conn.commit()
        logger.info("Database schema initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize schema: {e}")
        raise e
    finally:
        conn.close()

def create_sample_user():
    """
    DEPRECATED: Create a sample user for testing
    This function is no longer called automatically.
    Only use manually for local development testing.
    """
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
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
        logger.warning("Sample user created - this should only be used for local testing!")
    except Exception as e:
        logger.error(f"Failed to create sample user: {e}")
    finally:
        conn.close()
