
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db, User, SensorReading, PestForecast, PestIncident, CropDiagnosis, VoiceLog

router = APIRouter()

@router.delete("/reset-data")
async def reset_database(
    confirm: bool = Query(False, description="Set to true to confirm deletion"),
    db: Session = Depends(get_db)
):
    """
    SAFE CLEANUP: Deletes ONLY test/sample data (test_user_001)
    Preserves all real user data from Google OAuth
    """
    if not confirm:
        raise HTTPException(status_code=400, detail="You must confirm deletion by setting confirm=true")
        
    try:
        # Only delete test user data
        test_user_id = 'test_user_001'
        test_email = 'test@forhumanai.net'
        
        # Clear test user's sensor readings
        readings_count = db.query(SensorReading).filter(
            SensorReading.user_id == test_user_id
        ).delete()
        
        # Clear test user's pest forecasts
        forecasts_count = db.query(PestForecast).filter(
            PestForecast.user_id == test_user_id
        ).delete()
        
        # Clear test user's other data
        db.query(PestIncident).filter(PestIncident.user_id == test_user_id).delete()
        db.query(CropDiagnosis).filter(CropDiagnosis.user_id == test_user_id).delete()
        db.query(VoiceLog).filter(VoiceLog.user_id == test_user_id).delete()
        
        # Delete the test user itself
        user_deleted = db.query(User).filter(
            (User.id == test_user_id) | (User.email == test_email)
        ).delete()
        
        # Count remaining real users
        real_users = db.query(User).count()
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Test data cleanup successful. Deleted {readings_count} readings, {forecasts_count} forecasts, and {user_deleted} test user(s). {real_users} real user(s) preserved."
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to cleanup test data: {str(e)}")
