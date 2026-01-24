from fastapi import APIRouter
from app.services.data_handler import fetch_market_prices

router = APIRouter()

@router.get("/prices")
def get_market_prices(crop_type: str = "Strawberries"):
    df = fetch_market_prices(crop_type)
    if df.empty:
        return {"error": "No price data available", "data": []}
        
    records = df.to_dict(orient='records')
    # Get the source from the first record if available
    source = df['Source'].iloc[0] if 'Source' in df.columns and not df.empty else "Unknown"
    
    return {"data": records, "source": source, "crop": crop_type}
