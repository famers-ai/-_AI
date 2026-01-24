import requests
import pandas as pd
import random
import math
from datetime import datetime, timedelta


import streamlit as st

@st.cache_data(ttl=300)
def fetch_weather_data(lat=37.7749, lon=-122.4194):
    """
    Fetches current weather data from Open-Meteo API (Imperial Units for US Market).
    Defaults to San Francisco if no coordinates provided.
    """
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch"
        response = requests.get(url)
        data = response.json()
        current = data.get('current', {})
        return {
            "temperature": current.get('temperature_2m', 68),
            "humidity": current.get('relative_humidity_2m', 50),
            "rain": current.get('rain', 0.0),
            "wind_speed": current.get('wind_speed_10m', 0.0)
        }
    except Exception as e:
        print(f"Error fetching weather: {e}")
        return {"temperature": 70, "humidity": 55, "rain": 0.0, "wind_speed": 5.0} # Fallback in F

@st.cache_data(ttl=3600)
def get_coordinates_from_city(city_name):
    """
    Searches for a city name and returns (lat, lon, display_name).
    Uses Open-Meteo Geocoding API (Free, No Key).
    """
    try:
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={city_name}&count=1&language=en&format=json"
        response = requests.get(url)
        data = response.json()
        if "results" in data:
            result = data["results"][0]
            lat = result.get("latitude")
            lon = result.get("longitude")
            country = result.get("country", "")
            return lat, lon, f"{result['name']}, {country}"
    except Exception as e:
        pass
    return None, None, None

def calculate_vpd(temp_f, humidity):
    """
    Calculates Vapor Pressure Deficit (VPD) in kPa.
    Formula: VPD = SVP * (1 - RH/100)
    SVP (Saturation Vapor Pressure) depends on Temp in Celsius.
    """
    temp_c = (temp_f - 32) * 5.0/9.0
    # SVP in kPa (Tetens equation)
    svp = 0.61078 * math.exp((17.27 * temp_c) / (temp_c + 237.3))
    vpd = svp * (1 - (humidity / 100))
    return round(vpd, 2)

def calculate_pest_risk(weather_data, crop_type):
    """
    Calculates Pest Risk based on GDD (Growing Degree Days) and VPD.
    Real logic: High temps + Low VPD (High Humidity) = Fungal Risk.
    High temps + High VPD (Dry) = Mite/Insect Risk.
    """
    temp = weather_data['temperature']
    humidity = weather_data['humidity']
    vpd = calculate_vpd(temp, humidity)
    
    risk_level = "Low"
    pest_name = "None"
    probability = 10
    
    # 1. Logic for Strawberries (Fungal sensitive)
    if crop_type == "Strawberries":
        # Powdery Mildew thrives in moderate temp + high humidity (Low VPD)
        if 60 <= temp <= 80 and vpd < 0.5:
            risk_level = "High"
            pest_name = "Powdery Mildew"
            probability = min(95, 40 + (80 - vpd*100))
        # Spider Mitchells thrive in hot + dry (High VPD)
        elif temp > 80 and vpd > 1.2:
            risk_level = "Medium"
            pest_name = "Spider Mites"
            probability = 65
            
    # 2. Logic for Tomatoes (Blight sensitive)
    elif crop_type == "Tomatoes":
        # Late Blight: Cool/Moderate temp + Very High Humidity (Rain or VPD < 0.3)
        if 50 <= temp <= 75 and (humidity > 90 or vpd < 0.3):
             risk_level = "High"
             pest_name = "Late Blight"
             probability = 90
        # Whiteflies: Hot
        elif temp > 85:
             risk_level = "Medium"
             pest_name = "Whiteflies"
             probability = 55
             
    # 3. Logic for Peppers (Aphids sensitive)
    elif crop_type == "Peppers":
        # Aphids reproduce fast in warm temps 65-80F
        if 65 <= temp <= 80:
            risk_level = "Medium"
            pest_name = "Aphids"
            probability = 50 + (temp - 60)
            if probability > 85: risk_level = "High"
            
    return {"level": risk_level, "pest": pest_name, "prob": int(probability)}

@st.cache_data(ttl=3600)
def fetch_market_prices(crop_type):
    """
    Fetches wholesale market prices.
    Priority:
    1. USDA Mars API (Real-time) - Requires USDA_API_KEY in st.secrets
    2. Realistic Historical Data (Fallback) - Based on California seasonal averages
    """
    # USDA Market News API Configuration
    # Slug 2099: San Francisco Terminal Market - Fruit/Veg
    USDA_API_URL = "https://marsapi.ams.usda.gov/services/v1.2/reports/2099" 
    
    # 1. Try to get API Key
    api_key = None
    try:
        if "USDA_API_KEY" in st.secrets:
            api_key = st.secrets["USDA_API_KEY"]
        else:
            api_key = os.getenv("USDA_API_KEY")
    except Exception:
        pass

    # Data container
    prices_data = []
    source = "Simulated (Historical Avg)"
    
    # 2. Attempt Real API Call if Key Exists
    if api_key:
        try:
            # Basic Auth with API Key (Username=Key, Password="")
            response = requests.get(USDA_API_URL, auth=(api_key, ""))
            if response.status_code == 200:
                report = response.json()
                # TODO: Implement complex JSON parsing for USDA Market News
                # Structure varies by commodity.
                # For this version, we log success but continue to Fallback 
                # to ensure data is displayed.
                print("USDA API Success: Parsing logic pending.")
                source = "Simulated (Fallback - API Parsing Pending)" 
                pass 
        except Exception as e:
            print(f"USDA API Error: {e}")

    # 3. Generate Realistic Data (Fallback) if API failed or no key
    # US Market Units: $/lb
    
    # Seasonal base prices (Approx for CA Class 1)
    # Strawberries: Expensive in Winter ($3.50), Cheaper in Spring/Summer ($1.50)
    # Tomatoes: Stable ($1.20 - $2.00)
    # Peppers: Stable ($1.50 - $2.50)
    
    current_month = datetime.now().month
    
    if crop_type == "Strawberries":
        if current_month in [12, 1, 2]: base = 3.50
        elif current_month in [3, 4, 5]: base = 1.80 # Peak season
        else: base = 2.50
        volatility = 0.3
    elif crop_type == "Tomatoes":
        base = 1.80
        volatility = 0.15
    elif crop_type == "Peppers":
        base = 2.20
        volatility = 0.2
    else:
        base = 1.0
        volatility = 0.1

    current_price = base
    days = []
    prices = [] # in $/lb
    
    for i in range(7):
        date = datetime.now() - timedelta(days=6-i)
        days.append(date.strftime("%Y-%m-%d"))
        
        # Add some random daily noise to the seasonal base
        noise = random.uniform(-volatility, volatility)
        daily_price = max(0.5, current_price + noise)
        prices.append(round(daily_price, 2))
        
        # Next day drift
        current_price = daily_price

    df = pd.DataFrame({"Date": days, "Price ($/lb)": prices})
    df['Source'] = source
    return df
