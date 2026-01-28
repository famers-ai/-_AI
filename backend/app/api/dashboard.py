from fastapi import APIRouter, HTTPException
from app.services.data_handler import fetch_weather_data, get_coordinates_from_city, calculate_vpd
from app.services.ai_engine import analyze_situation
import sqlite3
import os

# Database path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_NAME = os.path.join(BASE_DIR, "farm_data.db")

router = APIRouter()

@router.get("")
async def get_dashboard_data(
    city: str,
    crop_type: str = "Strawberries",
    user_id: str = "test_user_001" # Auth placeholder
):
    try:
        # 1. Fetch Real Weather (External API is 'Real' data)
        lat, lon, location_name = get_coordinates_from_city(city)
        if not lat:
            raise HTTPException(status_code=404, detail="City not found")
            
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
            WHERE user_id = ? AND (data_source IS NULL OR data_source != 'Simulated') 
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

        return {
            "location": {
                "name": location_name,
                "lat": lat,
                "lon": lon
            },
            "weather": weather, # Outside weather is always real
            "indoor": indoor_data,
            "crop": crop_type
        }
        
    except Exception as e:
        print(f"Dashboard Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

def get_vpd_status(vpd):
    if vpd is None: return "No Data"
    if vpd < 0.4: return "Risk: Low (Humid)"
    if 0.4 <= vpd <= 1.2: return "Optimal"
    if 1.2 < vpd <= 1.6: return "Acceptable"
    return "Risk: High (Dry)"

@router.get("/ai/analyze")
def ai_analyze(crop_type: str, temp: float, humidity: float, rain: float, wind: float):
    # Reconstruct weather dict for the AI Engine
    weather = {"temperature": temp, "humidity": humidity, "rain": rain, "wind_speed": wind}
    try:
        insight = analyze_situation(weather, crop_type)
        return {"insight": insight}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
