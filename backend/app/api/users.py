"""
User Management API
Handles user profile and preferences, including legal consent
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import sqlite3
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Database path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_NAME = os.path.join(BASE_DIR, "farm_data.db")

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

# Temporary auth placeholder
def get_current_user_id(user_id: str = "test_user_001"):
    return user_id

class UserProfile(BaseModel):
    name: Optional[str] = None
    farm_name: Optional[str] = None
    location_lat: Optional[float] = None
    location_lon: Optional[float] = None
    crop_type: Optional[str] = None

class TermsAgreement(BaseModel):
    agreed: bool

@router.get("/me")
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    """Get current user profile including terms agreement status"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return dict(user)

@router.post("/me/terms")
async def update_terms_agreement(
    agreement: TermsAgreement,
    user_id: str = Depends(get_current_user_id)
):
    """Update terms of service agreement status"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if agreement.agreed:
        cursor.execute("""
            UPDATE users 
            SET is_terms_agreed = 1, terms_agreed_at = ? 
            WHERE id = ?
        """, (datetime.now(), user_id))
    else:
        # User implies revoking consent? (Usually not allowed for active users)
        cursor.execute("""
            UPDATE users 
            SET is_terms_agreed = 0, terms_agreed_at = NULL 
            WHERE id = ?
        """, (user_id,))
        
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Terms agreement updated"}

class UserSync(BaseModel):
    email: str
    name: Optional[str] = None
    image: Optional[str] = None
    provider: Optional[str] = None
    provider_id: Optional[str] = None

@router.post("/sync")
async def sync_user(user_data: UserSync):
    """
    Create or update user from OAuth provider (Google)
    This ensures every authenticated user has a database record
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Generate user ID from email (consistent across logins)
    import hashlib
    user_id = hashlib.sha256(user_data.email.encode()).hexdigest()[:16]
    
    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (user_data.email,))
    existing = cursor.fetchone()
    
    if existing:
        # Update existing user
        cursor.execute("""
            UPDATE users 
            SET name = ?, updated_at = ?
            WHERE email = ?
        """, (user_data.name, datetime.now(), user_data.email))
        logger.info(f"Updated existing user: {user_data.email}")
    else:
        # Create new user
        cursor.execute("""
            INSERT INTO users (id, email, name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, user_data.email, user_data.name, datetime.now(), datetime.now()))
        logger.info(f"Created new user: {user_data.email} with ID: {user_id}")
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success", 
        "message": "User synced successfully",
        "user_id": user_id
    }
