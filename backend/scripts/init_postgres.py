import sys
import os
import secrets

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import get_db_connection

def init_db():
    print("Connecting to PostgreSQL...")
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # 1. Users Table
        print("Creating table: users")
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            name TEXT,
            crop_type TEXT DEFAULT 'Strawberries',
            location TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_terms_agreed BOOLEAN DEFAULT FALSE,
            terms_agreed_at TIMESTAMP,
            privacy_agreed BOOLEAN DEFAULT FALSE
        );
        """)

        # 2. Sensor Readings Table
        print("Creating table: sensor_readings")
        cur.execute("""
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            temperature FLOAT,
            humidity FLOAT,
            vpd FLOAT,
            soil_moisture FLOAT,
            co2_level FLOAT,
            light_level FLOAT,
            notes TEXT,
            data_source TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # Index on user_id and timestamp for fast dashboard queries
        cur.execute("CREATE INDEX IF NOT EXISTS idx_sensor_user_time ON sensor_readings(user_id, timestamp DESC);")

        # 3. Pest Forecasts Table
        print("Creating table: pest_forecasts")
        cur.execute("""
        CREATE TABLE IF NOT EXISTS pest_forecasts (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            date DATE NOT NULL,
            risk_score INTEGER,
            condition TEXT,
            pest_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 4. Insert Test User if not exists
        print("Seeding test data...")
        cur.execute("SELECT id FROM users WHERE id = %s", ('test_user_001',))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO users (id, email, name, crop_type, location, is_terms_agreed)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, ('test_user_001', 'test@example.com', 'Test Farmer', 'Strawberries', 'San Francisco', True))
            print("Test user 'test_user_001' created.")

        conn.commit()
        print("✅ Database initialization complete!")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error initializing database: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    init_db()
