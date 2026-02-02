"""
Sensor Data API for Smart Farm AI
Handles real user sensor data collection and retrieval
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.core.database import get_db, SensorReading as SensorReadingModel

router = APIRouter()

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

# Authentication via Header
def get_current_user_id(
    x_farm_id: str = Header(..., alias="X-Farm-ID")
):
    """
    Get current user ID from X-Farm-ID header.
    This ensures all data is isolated per farm.
    """
    if not x_farm_id:
        raise HTTPException(status_code=400, detail="Missing X-Farm-ID header")
    return x_farm_id

@router.post("/record", response_model=SensorReadingResponse)
async def record_sensor_data(
    reading: SensorReading,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
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
        
        # Create new sensor reading
        new_reading = SensorReadingModel(
            user_id=user_id,
            temperature=reading.temperature,
            humidity=reading.humidity,
            soil_moisture=reading.soil_moisture,
            light_level=reading.light_level,
            ph_level=reading.co2_level,  # Note: Using ph_level field for co2_level
            timestamp=datetime.utcnow()
        )
        
        db.add(new_reading)
        db.commit()
        db.refresh(new_reading)
        
        return SensorReadingResponse(
            success=True,
            message="Data recorded successfully",
            vpd=vpd,
            reading_id=new_reading.id
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to record data: {str(e)}")

@router.get("/latest")
async def get_latest_reading(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get the latest sensor reading for the current user
    """
    try:
        reading = db.query(SensorReadingModel).filter(
            SensorReadingModel.user_id == user_id
        ).order_by(SensorReadingModel.timestamp.desc()).first()
        
        if not reading:
            return {
                "error": "No data found",
                "message": "Please record your first data point",
                "has_data": False
            }
        
        # Calculate VPD
        from app.services.data_handler import calculate_vpd
        vpd = calculate_vpd(reading.temperature, reading.humidity) if reading.temperature and reading.humidity else 0
        
        return {
            "has_data": True,
            "temperature": reading.temperature,
            "humidity": reading.humidity,
            "vpd": vpd,
            "soil_moisture": reading.soil_moisture,
            "light_level": reading.light_level,
            "co2_level": reading.ph_level,  # Note: Using ph_level field for co2_level
            "timestamp": reading.timestamp.isoformat() if reading.timestamp else None,
            "data_source": "manual",
            "notes": None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data: {str(e)}")

@router.get("/history")
async def get_sensor_history(
    days: int = 7,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get sensor data history for the specified number of days
    Used for weekly reports and trend analysis
    """
    try:
        # Calculate date range
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get daily averages
        results = db.query(
            func.date(SensorReadingModel.timestamp).label('date'),
            func.avg(SensorReadingModel.temperature).label('avg_temp'),
            func.min(SensorReadingModel.temperature).label('min_temp'),
            func.max(SensorReadingModel.temperature).label('max_temp'),
            func.avg(SensorReadingModel.humidity).label('avg_humidity'),
            func.min(SensorReadingModel.humidity).label('min_humidity'),
            func.max(SensorReadingModel.humidity).label('max_humidity'),
            func.avg(SensorReadingModel.soil_moisture).label('avg_soil_moisture'),
            func.count(SensorReadingModel.id).label('readings_count')
        ).filter(
            and_(
                SensorReadingModel.user_id == user_id,
                SensorReadingModel.timestamp >= start_date
            )
        ).group_by(
            func.date(SensorReadingModel.timestamp)
        ).order_by(
            func.date(SensorReadingModel.timestamp).asc()
        ).all()
        
        if not results:
            return {
                "has_data": False,
                "message": "No data available for the specified period",
                "data": []
            }
        
        # Calculate VPD for each day
        from app.services.data_handler import calculate_vpd
        data = []
        for row in results:
            vpd = calculate_vpd(row.avg_temp, row.avg_humidity) if row.avg_temp and row.avg_humidity else None
            data.append({
                "date": str(row.date),
                "avg_temp": round(float(row.avg_temp), 1) if row.avg_temp else None,
                "min_temp": round(float(row.min_temp), 1) if row.min_temp else None,
                "max_temp": round(float(row.max_temp), 1) if row.max_temp else None,
                "avg_humidity": round(float(row.avg_humidity), 1) if row.avg_humidity else None,
                "min_humidity": round(float(row.min_humidity), 1) if row.min_humidity else None,
                "max_humidity": round(float(row.max_humidity), 1) if row.max_humidity else None,
                "avg_vpd": round(vpd, 2) if vpd else None,
                "avg_soil_moisture": round(float(row.avg_soil_moisture), 1) if row.avg_soil_moisture else None,
                "readings_count": row.readings_count
            })
        
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
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get statistical summary of sensor data
    """
    try:
        # Calculate date range
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Overall stats for the period
        result = db.query(
            func.count(SensorReadingModel.id).label('total_readings'),
            func.avg(SensorReadingModel.temperature).label('avg_temp'),
            func.min(SensorReadingModel.temperature).label('min_temp'),
            func.max(SensorReadingModel.temperature).label('max_temp'),
            func.avg(SensorReadingModel.humidity).label('avg_humidity'),
            func.min(SensorReadingModel.humidity).label('min_humidity'),
            func.max(SensorReadingModel.humidity).label('max_humidity'),
            func.min(SensorReadingModel.timestamp).label('first_reading'),
            func.max(SensorReadingModel.timestamp).label('last_reading')
        ).filter(
            and_(
                SensorReadingModel.user_id == user_id,
                SensorReadingModel.timestamp >= start_date
            )
        ).first()
        
        if not result or result.total_readings == 0:
            return {
                "has_data": False,
                "message": "No data available for the specified period"
            }
        
        # Calculate VPD stats
        from app.services.data_handler import calculate_vpd
        avg_vpd = calculate_vpd(result.avg_temp, result.avg_humidity) if result.avg_temp and result.avg_humidity else 0
        min_vpd = calculate_vpd(result.min_temp, result.max_humidity) if result.min_temp and result.max_humidity else 0
        max_vpd = calculate_vpd(result.max_temp, result.min_humidity) if result.max_temp and result.min_humidity else 0
        
        return {
            "has_data": True,
            "period_days": days,
            "total_readings": result.total_readings,
            "temperature": {
                "avg": round(float(result.avg_temp), 1),
                "min": round(float(result.min_temp), 1),
                "max": round(float(result.max_temp), 1)
            },
            "humidity": {
                "avg": round(float(result.avg_humidity), 1),
                "min": round(float(result.min_humidity), 1),
                "max": round(float(result.max_humidity), 1)
            },
            "vpd": {
                "avg": round(avg_vpd, 2),
                "min": round(min_vpd, 2),
                "max": round(max_vpd, 2)
            },
            "first_reading": result.first_reading.isoformat() if result.first_reading else None,
            "last_reading": result.last_reading.isoformat() if result.last_reading else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")

@router.put("/reading/{reading_id}")
async def update_sensor_reading(
    reading_id: int,
    reading: SensorReading,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update an existing sensor reading.
    Recalculates VPD based on new values.
    """
    try:
        from app.services.data_handler import calculate_vpd
        new_vpd = calculate_vpd(reading.temperature, reading.humidity)
        
        # Check existence and ownership
        existing_reading = db.query(SensorReadingModel).filter(
            and_(
                SensorReadingModel.id == reading_id,
                SensorReadingModel.user_id == user_id
            )
        ).first()
        
        if not existing_reading:
            raise HTTPException(status_code=404, detail="Reading not found or unauthorized")
        
        # Update fields
        existing_reading.temperature = reading.temperature
        existing_reading.humidity = reading.humidity
        existing_reading.soil_moisture = reading.soil_moisture
        existing_reading.light_level = reading.light_level
        existing_reading.ph_level = reading.co2_level
        
        db.commit()
        
        return {
            "success": True, 
            "message": "Reading updated successfully",
            "vpd": new_vpd
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update reading: {str(e)}")

@router.delete("/delete/{reading_id}")
async def delete_reading(
    reading_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Delete a specific sensor reading
    """
    try:
        # Verify ownership before deleting
        reading = db.query(SensorReadingModel).filter(
            and_(
                SensorReadingModel.id == reading_id,
                SensorReadingModel.user_id == user_id
            )
        ).first()
        
        if not reading:
            raise HTTPException(status_code=404, detail="Reading not found or unauthorized")
        
        db.delete(reading)
        db.commit()
        
        return {
            "success": True,
            "message": "Reading deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete reading: {str(e)}")
