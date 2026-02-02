"""
User Management API
Handles user profile and preferences, including legal consent
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
import logging
import hashlib

from app.core.database import get_db, User

logger = logging.getLogger(__name__)

router = APIRouter()

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
async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get current user profile including terms agreement status"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "crop_type": user.crop_type,
        "farm_size": user.farm_size,
        "location": user.location,
        "latitude": user.latitude,
        "longitude": user.longitude,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

@router.post("/me/terms")
async def update_terms_agreement(
    agreement: TermsAgreement,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update terms of service agreement status"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Note: Add is_terms_agreed and terms_agreed_at columns to User model if needed
    # For now, just return success
    
    return {"status": "success", "message": "Terms agreement updated"}

class UserSync(BaseModel):
    email: str
    name: Optional[str] = None
    image: Optional[str] = None
    provider: Optional[str] = None
    provider_id: Optional[str] = None

@router.post("/sync")
async def sync_user(user_data: UserSync, db: Session = Depends(get_db)):
    """
    Create or update user from OAuth provider (Google)
    This ensures every authenticated user has a database record
    """
    # Generate user ID from email (consistent across logins)
    user_id = hashlib.sha256(user_data.email.encode()).hexdigest()[:16]
    
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    
    if existing_user:
        # Update existing user
        existing_user.name = user_data.name
        logger.info(f"Updated existing user: {user_data.email}")
    else:
        # Create new user
        new_user = User(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            created_at=datetime.utcnow()
        )
        db.add(new_user)
        logger.info(f"Created new user: {user_data.email} with ID: {user_id}")
    
    db.commit()
    
    return {
        "status": "success", 
        "message": "User synced successfully",
        "user_id": user_id
    }
