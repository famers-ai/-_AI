from fastapi import APIRouter, File, UploadFile, Request, Header, HTTPException
from PIL import Image
import io
from app.services.ai_engine import analyze_crop_image
from app.services.diagnosis_history import (
    get_user_diagnosis_history,
    get_diagnosis_stats
)
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/diagnose")
@limiter.limit("10/minute")
async def diagnose_crop(
    request: Request, 
    file: UploadFile = File(...),
    x_farm_id: str = Header(..., alias="X-Farm-ID")
):
    """
    Receives an uploaded image file, processes it, and sends it to Gemini for diagnosis.
    Validates file type to reject non-image files.
    
    CRITICAL: Tracks user_id for diagnosis history and audit trail.
    Uses past diagnosis history for context-aware recommendations.
    """
    if not file.content_type.startswith("image/"):
        return {"error": "Invalid file type. Please upload an image (JPEG, PNG)."}

    try:
        user_id = x_farm_id
        
        # Read image to memory
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Call Gemini Vision with user context
        diagnosis = analyze_crop_image(image, user_id=user_id)
        
        return {
            "diagnosis": diagnosis,
            "user_id": user_id,
            "message": "Diagnosis saved to your history"
        }
    except Exception as e:
        return {"error": f"Analysis failed: {str(e)}"}


@router.get("/diagnosis/history")
async def get_diagnosis_history(
    x_farm_id: str = Header(..., alias="X-Farm-ID"),
    limit: int = 10,
    crop_type: str = None
):
    """
    Retrieve user's diagnosis history
    
    Query Parameters:
        limit: Maximum number of records (default: 10, max: 50)
        crop_type: Filter by specific crop type (optional)
    """
    try:
        user_id = x_farm_id
        
        # Limit validation
        if limit > 50:
            limit = 50
        
        history = get_user_diagnosis_history(
            user_id=user_id,
            limit=limit,
            crop_type=crop_type,
            days_back=90  # Last 90 days
        )
        
        return {
            "history": history,
            "count": len(history),
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {str(e)}")


@router.get("/diagnosis/stats")
async def get_diagnosis_statistics(
    x_farm_id: str = Header(..., alias="X-Farm-ID"),
    days: int = 30
):
    """
    Get diagnosis statistics for the user
    
    Query Parameters:
        days: Number of days to analyze (default: 30, max: 365)
    """
    try:
        user_id = x_farm_id
        
        # Days validation
        if days > 365:
            days = 365
        
        stats = get_diagnosis_stats(user_id=user_id, days=days)
        
        return {
            "stats": stats,
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve stats: {str(e)}")
