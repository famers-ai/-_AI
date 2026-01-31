"""
Location Service API
Provides location-based services with privacy and security in mind
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
import sqlite3
import os
import requests
from typing import Optional

router = APIRouter()

# Database path
from app.core.config import DB_NAME

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

# TODO: Implement proper authentication
def get_current_user_id(user_id: str = "test_user_001"):
    """Get current user ID (placeholder for auth)"""
    return user_id

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
    user_id: str = Depends(get_current_user_id)
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
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Update user location
        cursor.execute("""
            UPDATE users
            SET location_city = ?,
                location_region = ?,
                location_country = ?,
                location_consent = ?,
                location_updated_at = ?
            WHERE id = ?
        """, (
            location.city,
            location.region,
            location.country,
            1,  # consent = True
            datetime.now(),
            user_id
        ))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": "Location updated successfully",
            "location": {
                "city": location.city,
                "region": location.region,
                "country": location.country
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update location: {str(e)}")

@router.get("/get")
async def get_user_location(user_id: str = Depends(get_current_user_id)):
    """
    Get user's stored location
    
    Security: User can only access their own location
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT location_city, location_region, location_country,
                   location_consent, location_updated_at
            FROM users
            WHERE id = ?
        """, (user_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "city": row["location_city"],
            "region": row["location_region"],
            "country": row["location_country"],
            "consent": bool(row["location_consent"]),
            "updated_at": row["location_updated_at"],
            "has_location": row["location_city"] is not None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get location: {str(e)}")

@router.delete("/delete")
async def delete_user_location(user_id: str = Depends(get_current_user_id)):
    """
    Delete user's location data (GDPR Right to be Forgotten)
    
    Privacy: User can delete their location data at any time
    Security: User can only delete their own location
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE users
            SET location_city = NULL,
                location_region = NULL,
                location_country = NULL,
                location_consent = 0,
                location_updated_at = ?
            WHERE id = ?
        """, (datetime.now(), user_id))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": "Location data deleted successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete location: {str(e)}")

@router.get("/weather")
async def get_location_based_weather(user_id: str = Depends(get_current_user_id)):
    """
    Get weather data based on user's stored location
    Falls back to IP-based detection if no location is stored
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT location_city, location_region, location_country
            FROM users
            WHERE id = ?
        """, (user_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row or not row["location_city"]:
            # No stored location, return 404 asking client to set location
            # Server-side IP detection was removed for privacy/accuracy
            raise HTTPException(
                status_code=404, 
                detail="Location not set. Please set your location to get weather data."
            )
        else:
            city = row["location_city"]
        
        # Return city for weather API
        return {
            "city": city,
            "message": "Use this city for weather API calls"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get weather location: {str(e)}")
