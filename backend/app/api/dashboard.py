from fastapi import APIRouter, HTTPException
from app.services.data_handler import fetch_weather_data, get_coordinates_from_city, calculate_vpd
from app.services.ai_engine import analyze_situation

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_data(
    crop_type: str = "Strawberries",
    city: str = "San Francisco" 
):
    # 1. Get Coordinates
    lat, lon, name = get_coordinates_from_city(city)
    if not lat:
        lat, lon, name = 37.7749, -122.4194, "San Francisco (Fallback)"
    
    # 2. Fetch Weather
    weather = fetch_weather_data(lat, lon)
    
    # 3. Virtual Indoor Sensor Logic (Simulating Greenhouse)
    estimated_temp = max(32.0, min(120.0, weather['temperature'] + 8.0))
    estimated_hum = max(10.0, min(100.0, weather['humidity'] + 10.0))
    
    indoor_vpd = calculate_vpd(estimated_temp, estimated_hum)
    
    vpd_status = "Optimal"
    if indoor_vpd < 0.4: vpd_status = "Too Humid (Risk: Fungal)"
    elif indoor_vpd > 1.6: vpd_status = "Too Dry (Risk: Mites)"
    
    indoor_data = {
        "temperature": round(estimated_temp, 1),
        "humidity": round(estimated_hum, 1),
        "vpd": indoor_vpd,
        "vpd_status": vpd_status
    }

    return {
        "location": {"name": name, "lat": lat, "lon": lon},
        "weather": weather,
        "indoor": indoor_data,
        "crop": crop_type
    }

@router.get("/ai/analyze")
def ai_analyze(crop_type: str, temp: float, humidity: float, rain: float, wind: float):
    # Reconstruct weather dict for the AI Engine
    weather = {"temperature": temp, "humidity": humidity, "rain": rain, "wind_speed": wind}
    try:
        insight = analyze_situation(weather, crop_type)
        return {"insight": insight}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
