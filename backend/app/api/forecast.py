from fastapi import APIRouter
from app.services.data_handler import calculate_weekly_pest_risk, fetch_market_prices

router = APIRouter()

@router.get("/forecast")
def get_pest_forecast(
    crop_type: str = "Strawberries",
    lat: float = 37.7749,
    lon: float = -122.4194
):
    df = calculate_weekly_pest_risk(lat, lon, crop_type)
    if df.empty:
        return {"error": "Failed to calculate forecast", "data": []}
    
    # Convert DataFrame to JSON-friendly list of dicts
    # Dates to string, etc
    records = df.to_dict(orient='records')
    return {"data": records, "crop": crop_type}
