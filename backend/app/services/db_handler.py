import sqlite3
import pandas as pd
import os
from datetime import datetime

# Robustly find the DB file in the backend root
# Structure: backend/app/services/db_handler.py
from app.core.config import DB_NAME

# init_db removed - handled by app.core.db_init

def set_user_pref(key, value):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("INSERT OR REPLACE INTO user_prefs VALUES (?, ?)", (key, value))
    conn.commit()
    conn.close()

def get_user_pref(key, default=None):
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("SELECT value FROM user_prefs WHERE key=?", (key,))
        result = c.fetchone()
        conn.close()
        return result[0] if result else default
    except:
        return default

def log_sensor_data(user_id, crop_type, weather, sensor):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Using unified sensor_readings table
    c.execute("""
        INSERT INTO sensor_readings (user_id, temperature, humidity, soil_moisture, data_source)
        VALUES (?, ?, ?, ?, 'manual')
    """, (user_id, weather['temperature'], weather['humidity'], sensor['soil_moisture']))
    conn.commit()
    conn.close()

def log_safety_event(user_id, crop_type, message, severity="Critical"):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("INSERT INTO safety_logs (user_id, crop_type, message, severity) VALUES (?, ?, ?, ?)",
              (user_id, crop_type, message, severity))
    conn.commit()
    conn.close()

def save_labeled_data(image_id, label, correction):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute("INSERT INTO training_data VALUES (?, ?, ?, ?)",
              (timestamp, image_id, label, correction))
    conn.commit()
    conn.close()

def get_safety_logs(limit=10):
    conn = sqlite3.connect(DB_NAME)
    query = f"SELECT * FROM safety_logs ORDER BY timestamp DESC LIMIT {limit}"
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

def get_weekly_stats(user_id, crop_type):
    conn = sqlite3.connect(DB_NAME)
    # Use sensor_readings table
    query = "SELECT AVG(temperature) as avg_temp, AVG(soil_moisture) as avg_moisture, COUNT(*) as count FROM sensor_readings WHERE user_id = ?"
    df = pd.read_sql_query(query, conn, params=(user_id,))
    conn.close()
    
    if df.empty or df.iloc[0]['count'] == 0:
        return None
        
    return {
        "avg_temp": round(df.iloc[0]['avg_temp'], 1),
        "avg_moisture": round(df.iloc[0]['avg_moisture'], 1),
        "data_points": int(df.iloc[0]['count'])
    }

def get_historical_data_db(crop_type, limit=50):
    conn = sqlite3.connect(DB_NAME)
    query = "SELECT * FROM sensor_logs WHERE crop_type = ? ORDER BY timestamp DESC LIMIT ?"
    df = pd.read_sql_query(query, conn, params=(crop_type, limit))
    conn.close()
    if not df.empty:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp') 
    return df

def get_training_data_stats():
    conn = sqlite3.connect(DB_NAME)
    query = "SELECT label, COUNT(*) as count FROM training_data GROUP BY label"
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df
