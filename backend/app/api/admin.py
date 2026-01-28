
from fastapi import APIRouter, HTTPException, Query
import sqlite3
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_NAME = os.path.join(BASE_DIR, "farm_data.db")

@router.delete("/reset-data")
async def reset_database(confirm: bool = Query(False, description="Set to true to confirm deletion")):
    """
    DANGER: Deletes ALL sensor readings and pest forecasts.
    """
    if not confirm:
        raise HTTPException(status_code=400, detail="You must confirm deletion by setting confirm=true")
        
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        # Clear specific tables
        cursor.execute("DELETE FROM sensor_readings")
        readings_count = cursor.rowcount
        
        cursor.execute("DELETE FROM pest_forecasts")
        forecasts_count = cursor.rowcount
        
        # We can optionally clear other logs if needed
        # cursor.execute("DELETE FROM pest_incidents")
        # cursor.execute("DELETE FROM crop_diagnoses")
        # cursor.execute("DELETE FROM voice_logs")
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": f"Database reset successful. Deleted {readings_count} readings and {forecasts_count} forecasts."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset database: {str(e)}")
