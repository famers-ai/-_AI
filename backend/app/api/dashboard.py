from fastapi import APIRouter, HTTPException, Header, Depends
from app.services.data_handler import fetch_weather_data, get_coordinates_from_city, calculate_vpd
from app.services.ai_engine import analyze_situation
import sqlite3
import os

# Database path
from app.core.config import DB_NAME
from app.services.physics_engine import physics_engine

router = APIRouter()

@router.get("")
async def get_dashboard_data(
    city: str = None,
    lat: float = None,
    lon: float = None,
    country: str = None,  # ISO country code (e.g., 'US', 'GB', 'KR')
    crop_type: str = "Strawberries",
    x_farm_id: str = Header(..., alias="X-Farm-ID")
):
    try:
        user_id = x_farm_id # Map header to internal user_id logic
        location_name = city or "Unknown Location"
        
        found_country_code = None

        # 1. Determine Location (Coordinates vs City Name)
        if lat is not None and lon is not None:
             # Direct coordinates provided (e.g. from "Use My Location")
             if not city:
                 location_name = f"{lat:.2f}, {lon:.2f}"
        else:
            # Fallback to city search
            if not city:
                city = "San Francisco"
                
            lat, lon, found_name, found_country_code = get_coordinates_from_city(city, country)
            if found_name:
                location_name = found_name
            
            if not lat or not lon:
                return {
                    "location": {
                        "name": city,
                        "lat": None,
                        "lon": None,
                        "error": "City not found. Please try a major city name."
                    },
                    "weather": {
                        "temperature": None,
                        "humidity": None,
                        "rain": None,
                        "wind_speed": None
                    },
                    "indoor": {
                        "temperature": None,
                        "humidity": None,
                        "vpd": None,
                        "vpd_status": "No Data - Please Record",
                        "soil_moisture": None,
                        "timestamp": None
                    },
                    "crop": crop_type
                }

        # 2. Fetch Weather Data using coordinates
        weather = fetch_weather_data(lat, lon)

        if weather is None:
            weather = {
                "temperature": None,
                "humidity": None,
                "rain": None,
                "wind_speed": None
            }
        
        # 2. Fetch User's Real Indoor Data (DB)
        # NO MORE SIMULATION. Only DB data.
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT temperature, humidity, vpd, soil_moisture, timestamp 
            FROM sensor_readings 
            WHERE user_id = ? AND data_source = 'manual' 
            ORDER BY timestamp DESC 
            LIMIT 1
        """, (user_id,))
        
        indoor_row = cursor.fetchone()
        conn.close()

        # Default state if no data
        indoor_data = {
            "temperature": None,
            "humidity": None,
            "vpd": None,
            "vpd_status": "No Data - Please Record",
            "soil_moisture": None,
            "timestamp": None
        }

        if indoor_row:
            indoor_data = {
                "temperature": indoor_row['temperature'],
                "humidity": indoor_row['humidity'],
                "vpd": indoor_row['vpd'],
                "vpd_status": get_vpd_status(indoor_row['vpd']),
                "soil_moisture": indoor_row['soil_moisture'],
                "timestamp": indoor_row['timestamp']
            }
        else:
            # NO SENSOR DATA -> ACTIVATE VIRTUAL SENSOR (PHYSICS ENGINE)
            if weather is not None and weather.get('temperature') is not None:
                # Convert F to C for physics engine (metric-based)
                w_metric = {
                    "temperature": (float(weather['temperature']) - 32) * 5/9,
                    "humidity": float(weather['humidity'] or 50),
                    "wind_speed": float(weather['wind_speed'] or 0) * 0.44704,
                    "rain": float(weather['rain'] or 0) * 25.4,
                    "is_day": True # In real app, check sunrise/sunset
                }
                
                micro = physics_engine.estimate_microclimate(w_metric)
                
                # Convert back to Imperial for US Dashboard
                est_temp_f = (micro['temperature'] * 9/5) + 32
                
                indoor_data = {
                    "temperature": round(est_temp_f, 1),
                    "humidity": micro['humidity'],
                    "vpd": micro['vpd'],
                    "vpd_status": get_vpd_status(micro['vpd']) + " (Virtual)",
                    "soil_moisture": None, # Cannot estimate soil without more inputs
                    "timestamp": "Estimated Now"
                }

        
        # 3. AI Analysis (Now integrated into Dashboard)
        # Check for optional feedback handling (not in main GET, but structure ready)
        # Default AI run usually has no feedback unless explicitly requested via separate call.
        
        ai_result = analyze_situation(weather, crop_type or "tomato") # Default crop
        
        # Check if result is dict (New Format) or str (Old/Error)
        if isinstance(ai_result, dict):
            ai_analysis = ai_result.get("analysis_text", "AI Service Unavailable")
            confidence = ai_result.get("confidence_score", 0.0)
            question = ai_result.get("validation_question", None)
        else:
            ai_analysis = str(ai_result)
            confidence = 0.0
            question = None
            
        return {
            "location": {
                "name": location_name,
                "lat": lat,
                "lon": lon,
                "country": found_country_code
            },
            "weather": weather, # Outside weather is always real
            "indoor": indoor_data,
            "ai_analysis": ai_analysis,
            "ai_meta": {
                "confidence_score": confidence,
                "user_question": question
            },
            "crop": crop_type
        }
        
    except Exception as e:
        print(f"Dashboard Error: {e}")
        # Return graceful error response instead of 500
        return {
            "location": {
                "name": city,
                "lat": None,
                "lon": None,
                "error": "Service temporarily unavailable"
            },
            "weather": {
                "temperature": None,
                "humidity": None,
                "rain": None,
                "wind_speed": None
            },
            "indoor": {
                "temperature": None,
                "humidity": None,
                "vpd": None,
                "vpd_status": "No Data - Please Record",
                "soil_moisture": None,
                "timestamp": None
            },
            "crop": crop_type
        }

def get_vpd_status(vpd):
    if vpd is None: return "No Data"
    if vpd < 0.4: return "Risk: Low (Humid)"
    if 0.4 <= vpd <= 1.2: return "Optimal"
    if 1.2 < vpd <= 1.6: return "Acceptable"
    return "Risk: High (Dry)"

@router.get("/ai/analyze")
def ai_analyze(
    crop_type: str, 
    temp: float, 
    humidity: float, 
    rain: float, 
    wind: float,
    user_feedback: str = None
):
    # Reconstruct weather dict for the AI Engine
    weather = {"temperature": temp, "humidity": humidity, "rain": rain, "wind_speed": wind}
    try:
        # Now pass feedback to the engine
        insight = analyze_situation(weather, crop_type, user_feedback=user_feedback)
        return {"insight": insight}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sensors/calibrate")
def calibrate_sensors(
    data: dict 
):
    """
    Endpoint for users to submit REAL ground truth to improve Physics Engine.
    Body: { "actual_temp": 25.5, "weather": {...} }
    """
    try:
        actual_temp = data.get("actual_temp")
        weather = data.get("weather") # Must match external weather format
        
        # Convert inputs to metric if needed
        # We assume frontend passes nicely formatted data or we handle it.
        # Physics engine expects metric web inputs usually.
        
        w_metric = {
            "temperature": (float(weather['temperature']) - 32) * 5/9,
            "humidity": float(weather.get('humidity') or 50),
            "wind_speed": float(weather.get('wind_speed') or 0) * 0.44704,
            "rain": float(weather.get('rain') or 0) * 25.4,
            "is_day": True 
        }
        
        result = physics_engine.calibrate_model((float(actual_temp) - 32) * 5/9, w_metric)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/control")
def control_farm(data: dict):
    """
    Virtual Controller Endpoint.
    Body: { "action": "irrigate", "current_state": {...} }
    """
    try:
        action = data.get("action")
        current_state = data.get("current_state")
        
        # Validate input
        if not action or not current_state:
            raise HTTPException(status_code=400, detail="Missing action or state")
            
        # Simulate Physics
        new_state = physics_engine.simulate_action(action, current_state)
        return new_state
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/weekly")
def get_weekly_report(crop_type: str = "tomato"):
    """
    Generates a PDF-like Weekly AI Report.
    """
    try:
        # Import here to avoid circular dependencies if simple
        from app.services.ai_engine import generate_weekly_report
        report_text = generate_weekly_report(crop_type)
        return {"report_text": report_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
