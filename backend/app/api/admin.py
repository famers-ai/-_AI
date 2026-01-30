
from fastapi import APIRouter, HTTPException, Query
import sqlite3
import os

router = APIRouter()

from app.core.config import DB_NAME

@router.delete("/reset-data")
async def reset_database(confirm: bool = Query(False, description="Set to true to confirm deletion")):
    """
    SAFE CLEANUP: Deletes ONLY test/sample data (test_user_001)
    Preserves all real user data from Google OAuth
    """
    if not confirm:
        raise HTTPException(status_code=400, detail="You must confirm deletion by setting confirm=true")
        
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        # Only delete test user data
        test_user_id = 'test_user_001'
        
        # Clear test user's sensor readings
        cursor.execute("DELETE FROM sensor_readings WHERE user_id = ?", (test_user_id,))
        readings_count = cursor.rowcount
        
        # Clear test user's pest forecasts
        cursor.execute("DELETE FROM pest_forecasts WHERE user_id = ?", (test_user_id,))
        forecasts_count = cursor.rowcount
        
        # Clear test user's other data
        cursor.execute("DELETE FROM pest_incidents WHERE user_id = ?", (test_user_id,))
        cursor.execute("DELETE FROM crop_diagnoses WHERE user_id = ?", (test_user_id,))
        cursor.execute("DELETE FROM voice_logs WHERE user_id = ?", (test_user_id,))
        
        # Delete the test user itself
        cursor.execute("DELETE FROM users WHERE id = ? OR email = ?", (test_user_id, 'test@forhumanai.net'))
        user_deleted = cursor.rowcount
        
        # Count remaining real users
        cursor.execute("SELECT COUNT(*) FROM users")
        real_users = cursor.fetchone()[0]
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": f"Test data cleanup successful. Deleted {readings_count} readings, {forecasts_count} forecasts, and {user_deleted} test user(s). {real_users} real user(s) preserved."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cleanup test data: {str(e)}")
