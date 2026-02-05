from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.database import get_db, VoiceLog

router = APIRouter()

# Models
class ParsedData(BaseModel):
    crop: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    action: Optional[str] = None

class VoiceLogCreate(BaseModel):
    text: str
    category: str
    parsedData: Optional[ParsedData] = None
    timestamp: Optional[datetime] = None

class VoiceLogResponse(BaseModel):
    id: int
    text: str
    category: str
    parsedData: Optional[ParsedData] = None
    timestamp: datetime

# CRITICAL: Get user_id from X-Farm-ID header to prevent data mixing
def get_current_user_id(
    x_farm_id: str = Header(..., alias="X-Farm-ID")
):
    """
    Get current user ID from X-Farm-ID header.
    This ensures all voice logs are isolated per user.
    """
    if not x_farm_id:
        raise HTTPException(status_code=400, detail="Missing X-Farm-ID header")
    return x_farm_id

@router.post("/", response_model=VoiceLogResponse)
async def create_log(
    log: VoiceLogCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    try:
        timestamp = log.timestamp or datetime.utcnow()
        
        # Create new voice log
        new_log = VoiceLog(
            user_id=user_id,
            transcription=log.text,
            timestamp=timestamp,
            # Store parsed data as JSON in analysis field
            analysis=log.parsedData.model_dump_json() if log.parsedData else None
        )
        
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        
        # --- NEW: AI LEARNING LOOP ---
        # Analyze if this voice log contains environmental feedback
        try:
            from app.services.ai_engine import analyze_environment_feedback
            from app.core.database import RealityFeedbackLog, VirtualEnvironmentLog
            
            feedback_analysis = analyze_environment_feedback(log.text)
            
            # If feedback detected with high confidence, save to RealityFeedbackLog
            if feedback_analysis.get("is_feedback") and feedback_analysis.get("confidence", 0) > 0.7:
                # Get the most recent AI prediction for this user (if exists)
                latest_prediction = db.query(VirtualEnvironmentLog).filter(
                    VirtualEnvironmentLog.user_id == user_id
                ).order_by(VirtualEnvironmentLog.timestamp.desc()).first()
                
                prediction_ref_id = latest_prediction.id if latest_prediction else None
                
                # Save feedback to database
                feedback_log = RealityFeedbackLog(
                    user_id=user_id,
                    timestamp=timestamp,
                    feedback_type=feedback_analysis.get("feedback_type"),
                    feedback_value=feedback_analysis.get("feedback_value"),
                    ai_prediction_ref_id=prediction_ref_id
                )
                
                db.add(feedback_log)
                db.commit()
                
                print(f"✅ Feedback saved: {feedback_analysis.get('feedback_type')} - {feedback_analysis.get('feedback_value')}")
            
        except Exception as e:
            # Don't fail the voice log if feedback analysis fails
            print(f"⚠️ Feedback analysis failed (non-critical): {e}")
        
        return {
            "id": new_log.id,
            "text": log.text,
            "category": log.category,
            "parsedData": log.parsedData,
            "timestamp": timestamp
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[VoiceLogResponse])
async def get_logs(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    try:
        logs = db.query(VoiceLog).filter(
            VoiceLog.user_id == user_id
        ).order_by(VoiceLog.timestamp.desc()).all()
        
        results = []
        for log in logs:
            # Parse analysis JSON if available
            parsed_data = None
            if log.analysis:
                try:
                    import json
                    analysis_data = json.loads(log.analysis)
                    parsed_data = ParsedData(**analysis_data)
                except:
                    pass
            
            results.append({
                "id": log.id,
                "text": log.transcription or "",
                "category": "general",  # Default category
                "parsedData": parsed_data,
                "timestamp": log.timestamp
            })
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{log_id}")
async def delete_log(
    log_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    try:
        log = db.query(VoiceLog).filter(
            VoiceLog.id == log_id,
            VoiceLog.user_id == user_id
        ).first()
        
        if not log:
            raise HTTPException(status_code=404, detail="Log not found")
        
        db.delete(log)
        db.commit()
            
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
