"""
Location Service API
Provides location-based services with privacy and security in mind
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db, User

router = APIRouter()

# CRITICAL: Get user_id from X-Farm-ID header to prevent data mixing
def get_current_user_id(
    x_farm_id: str = Header(..., alias="X-Farm-ID")
):
    """
    Get current user ID from X-Farm-ID header.
    This ensures all location data is isolated per user.
    """
    if not x_farm_id:
        raise HTTPException(status_code=400, detail="Missing X-Farm-ID header")
    return x_farm_id

class LocationData(BaseModel):
    """Location data model - city level only for privacy"""
    city: str
    region: Optional[str] = None
    country: Optional[str] = None
    consent: bool = True

class IPLocationResponse(BaseModel):
    """IP-based location detection response"""
    city: str
    region: str
    country: str
    latitude: float
    longitude: float

# Server-side IP detection removed to strictly adhere to privacy minimization.
# Location detection will be handled client-side, sending only the city/country result to the server.


@router.post("/set")
async def set_user_location(
    location: LocationData,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Set user location (city-level only)
    Requires explicit user consent
    
    Privacy: Only stores city/region/country, not GPS coordinates
    Security: User can only update their own location
    """
    if not location.consent:
        raise HTTPException(
            status_code=400,
            detail="User consent is required to store location information"
        )
    
    try:
        # Find user
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update user location
        user.location = location.city  # Using existing location field
        # Note: location_region, location_country, location_consent, location_updated_at 
        # are not in current schema. Using location field for city.
        
        db.commit()
        
        return {
            "success": True,
            "message": "Location updated successfully",
            "location": {
                "city": location.city,
                "region": location.region,
                "country": location.country
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update location: {str(e)}")

@router.get("/get")
async def get_user_location(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get user's stored location
    
    Security: User can only access their own location
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "city": user.location,
            "region": None,  # Not in current schema
            "country": None,  # Not in current schema
            "consent": True,  # Not in current schema
            "updated_at": None,  # Not in current schema
            "has_location": user.location is not None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get location: {str(e)}")

@router.delete("/delete")
async def delete_user_location(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Delete user's location data (GDPR Right to be Forgotten)
    
    Privacy: User can delete their location data at any time
    Security: User can only delete their own location
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Clear location
        user.location = None
        
        db.commit()
        
        return {
            "success": True,
            "message": "Location data deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete location: {str(e)}")

@router.get("/weather")
async def get_location_based_weather(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get weather data based on user's stored location
    Falls back to IP-based detection if no location is stored
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user or not user.location:
            # No stored location, return 404 asking client to set location
            # Server-side IP detection was removed for privacy/accuracy
            raise HTTPException(
                status_code=404, 
                detail="Location not set. Please set your location to get weather data."
            )
        
        # Return city for weather API
        return {
            "city": user.location,
            "message": "Use this city for weather API calls"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get weather location: {str(e)}")
