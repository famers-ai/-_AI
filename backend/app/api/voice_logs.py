from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import sqlite3
import os

router = APIRouter()

# Database path - using same logic as other files
from app.core.config import DB_NAME

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

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
    id: int # Changed to int to match DB
    text: str
    category: str
    parsedData: Optional[ParsedData] = None
    timestamp: datetime

# Helper to emulate auth
def get_current_user_id():
    return "test_user_001"

@router.post("/", response_model=VoiceLogResponse)
async def create_log(log: VoiceLogCreate, user_id: str = Depends(get_current_user_id)):
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        timestamp = log.timestamp or datetime.now()
        timestamp_str = timestamp.isoformat()
        
        # Extract parsed data if available
        p_crop = log.parsedData.crop if log.parsedData else None
        p_qty = log.parsedData.quantity if log.parsedData else None
        p_unit = log.parsedData.unit if log.parsedData else None
        p_action = log.parsedData.action if log.parsedData else None

        c.execute("""
            INSERT INTO voice_logs 
            (user_id, text, category, parsed_crop, parsed_quantity, parsed_unit, parsed_action, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, log.text, log.category, p_crop, p_qty, p_unit, p_action, timestamp_str))
        
        new_id = c.lastrowid
        conn.commit()
        conn.close()
        
        return {
            "id": new_id,
            "text": log.text,
            "category": log.category,
            "parsedData": log.parsedData,
            "timestamp": timestamp
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[VoiceLogResponse])
async def get_logs(user_id: str = Depends(get_current_user_id)):
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM voice_logs WHERE user_id = ? ORDER BY timestamp DESC", (user_id,))
        rows = c.fetchall()
        conn.close()
        
        results = []
        for row in rows:
            parsed_data = None
            if row['parsed_crop'] or row['parsed_quantity'] or row['parsed_action']:
                parsed_data = {
                    "crop": row['parsed_crop'],
                    "quantity": row['parsed_quantity'],
                    "unit": row['parsed_unit'],
                    "action": row['parsed_action']
                }
            
            # Handle string timestamp from DB
            try:
                ts = datetime.fromisoformat(row['timestamp'])
            except:
                ts = datetime.now() # Fallback

            results.append({
                "id": row['id'],
                "text": row['text'],
                "category": row['category'],
                "parsedData": parsed_data,
                "timestamp": ts
            })
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{log_id}")
async def delete_log(log_id: int, user_id: str = Depends(get_current_user_id)):
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("DELETE FROM voice_logs WHERE id = ? AND user_id = ?", (log_id, user_id))
        conn.commit()
        deleted = c.rowcount > 0
        conn.close()
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Log not found")
            
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
