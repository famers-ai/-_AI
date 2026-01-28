
import sqlite3
import os

# Robustly find the DB file in the backend root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "farm_data.db")

def clear_sensor_data():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file not found at {DB_PATH}")
        return

    print(f"Connecting to database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check current count
        cursor.execute("SELECT COUNT(*) FROM sensor_readings")
        count = cursor.fetchone()[0]
        print(f"Found {count} existing records in 'sensor_readings'.")

        if count > 0:
            user_input = input(f"Are you sure you want to DELETE ALL {count} records? (y/n): ")
            if user_input.lower() == 'y':
                cursor.execute("DELETE FROM sensor_readings")
                conn.commit()
                print("All sensor readings have been deleted.")
            else:
                print("Operation cancelled.")
        else:
            print("Table is already empty.")

        # Also clear pest_forecasts if needed
        cursor.execute("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='pest_forecasts'")
        if cursor.fetchone()[0] > 0:
             cursor.execute("SELECT COUNT(*) FROM pest_forecasts")
             p_count = cursor.fetchone()[0]
             if p_count > 0:
                 print(f"Found {p_count} pest forecasts.")
                 if input("Delete pest forecasts? (y/n) ").lower() == 'y':
                     cursor.execute("DELETE FROM pest_forecasts")
                     conn.commit()
                     print("Pest forecasts deleted.")
    
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    clear_sensor_data()
