"""
Sensor Data API for Smart Farm AI
Handles real user sensor data collection and retrieval
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
import sqlite3
import os

router = APIRouter()

# Database path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_NAME = os.path.join(BASE_DIR, "farm_data.db")

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

# Pydantic models
class SensorReading(BaseModel):
    temperature: float = Field(..., ge=-50, le=150, description="Temperature in Fahrenheit")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    soil_moisture: Optional[float] = Field(None, ge=0, le=100, description="Soil moisture percentage")
    light_level: Optional[float] = Field(None, ge=0, description="Light level in lux")
    co2_level: Optional[float] = Field(None, ge=0, description="CO2 level in ppm")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes")
    data_source: str = Field(default='manual', description="Data source: manual, iot, estimated")

class SensorReadingResponse(BaseModel):
    success: bool
    message: str
    vpd: float
    reading_id: int

# TODO: Implement proper authentication
# For now, using a simple user_id parameter
def get_current_user_id(user_id: str = "test_user_001"):
    """Get current user ID (placeholder for auth)"""
    return user_id

@router.post("/record", response_model=SensorReadingResponse)
async def record_sensor_data(
    reading: SensorReading,
    user_id: str = Depends(get_current_user_id)
):
    """
    Record sensor data for the current user
    
    This endpoint allows users to manually input their farm data or
    receive data from IoT sensors.
    """
    try:
        # Calculate VPD
        from app.services.data_handler import calculate_vpd
        vpd = calculate_vpd(reading.temperature, reading.humidity)
        
        # Save to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO sensor_readings 
            (user_id, temperature, humidity, vpd, soil_moisture, light_level, co2_level, data_source, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            reading.temperature,
            reading.humidity,
            vpd,
            reading.soil_moisture,
            reading.light_level,
            reading.co2_level,
            reading.data_source,
            reading.notes
        ))
        
        reading_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return SensorReadingResponse(
            success=True,
            message="Data recorded successfully",
            vpd=vpd,
            reading_id=reading_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record data: {str(e)}")

@router.get("/latest")
async def get_latest_reading(user_id: str = Depends(get_current_user_id)):
    """
    Get the latest sensor reading for the current user
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM sensor_readings
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT 1
        """, (user_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return {
                "error": "No data found",
                "message": "Please record your first data point",
                "has_data": False
            }
        
        return {
            "has_data": True,
            "temperature": row['temperature'],
            "humidity": row['humidity'],
            "vpd": row['vpd'],
            "soil_moisture": row['soil_moisture'],
            "light_level": row['light_level'],
            "co2_level": row['co2_level'],
            "timestamp": row['timestamp'],
            "data_source": row['data_source'],
            "notes": row['notes']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data: {str(e)}")

@router.get("/history")
async def get_sensor_history(
    days: int = 7,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get sensor data history for the specified number of days
    Used for weekly reports and trend analysis
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get daily averages
        cursor.execute("""
            SELECT 
                DATE(timestamp) as date,
                AVG(temperature) as avg_temp,
                MIN(temperature) as min_temp,
                MAX(temperature) as max_temp,
                AVG(humidity) as avg_humidity,
                MIN(humidity) as min_humidity,
                MAX(humidity) as max_humidity,
                AVG(vpd) as avg_vpd,
                AVG(soil_moisture) as avg_soil_moisture,
                COUNT(*) as readings_count
            FROM sensor_readings
            WHERE user_id = ?
            AND timestamp >= datetime('now', '-' || ? || ' days')
            GROUP BY DATE(timestamp)
            ORDER BY date ASC
        """, (user_id, days))
        
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return {
                "has_data": False,
                "message": "No data available for the specified period",
                "data": []
            }
        
        data = [
            {
                "date": row['date'],
                "avg_temp": round(row['avg_temp'], 1) if row['avg_temp'] else None,
                "min_temp": round(row['min_temp'], 1) if row['min_temp'] else None,
                "max_temp": round(row['max_temp'], 1) if row['max_temp'] else None,
                "avg_humidity": round(row['avg_humidity'], 1) if row['avg_humidity'] else None,
                "min_humidity": round(row['min_humidity'], 1) if row['min_humidity'] else None,
                "max_humidity": round(row['max_humidity'], 1) if row['max_humidity'] else None,
                "avg_vpd": round(row['avg_vpd'], 2) if row['avg_vpd'] else None,
                "avg_soil_moisture": round(row['avg_soil_moisture'], 1) if row['avg_soil_moisture'] else None,
                "readings_count": row['readings_count']
            }
            for row in rows
        ]
        
        return {
            "has_data": True,
            "data": data,
            "total_days": len(data),
            "total_readings": sum(d['readings_count'] for d in data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")

@router.get("/stats")
async def get_sensor_stats(
    days: int = 7,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get statistical summary of sensor data
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Overall stats for the period
        cursor.execute("""
            SELECT 
                COUNT(*) as total_readings,
                AVG(temperature) as avg_temp,
                MIN(temperature) as min_temp,
                MAX(temperature) as max_temp,
                AVG(humidity) as avg_humidity,
                MIN(humidity) as min_humidity,
                MAX(humidity) as max_humidity,
                AVG(vpd) as avg_vpd,
                MIN(vpd) as min_vpd,
                MAX(vpd) as max_vpd,
                MIN(timestamp) as first_reading,
                MAX(timestamp) as last_reading
            FROM sensor_readings
            WHERE user_id = ?
            AND timestamp >= datetime('now', '-' || ? || ' days')
        """, (user_id, days))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row or row['total_readings'] == 0:
            return {
                "has_data": False,
                "message": "No data available for the specified period"
            }
        
        return {
            "has_data": True,
            "period_days": days,
            "total_readings": row['total_readings'],
            "temperature": {
                "avg": round(row['avg_temp'], 1),
                "min": round(row['min_temp'], 1),
                "max": round(row['max_temp'], 1)
            },
            "humidity": {
                "avg": round(row['avg_humidity'], 1),
                "min": round(row['min_humidity'], 1),
                "max": round(row['max_humidity'], 1)
            },
            "vpd": {
                "avg": round(row['avg_vpd'], 2),
                "min": round(row['min_vpd'], 2),
                "max": round(row['max_vpd'], 2)
            },
            "first_reading": row['first_reading'],
            "last_reading": row['last_reading']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")

@router.delete("/delete/{reading_id}")
async def delete_reading(
    reading_id: int,
    user_id: str = Depends(get_current_user_id)
):
    """
    Delete a specific sensor reading
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify ownership before deleting
        cursor.execute("""
            DELETE FROM sensor_readings
            WHERE id = ? AND user_id = ?
        """, (reading_id, user_id))
        
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Reading not found or unauthorized")
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": "Reading deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete reading: {str(e)}")
