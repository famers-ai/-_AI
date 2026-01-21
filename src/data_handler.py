import requests
import pandas as pd
import random
from datetime import datetime, timedelta

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

def calculate_pest_risk(weather_data, crop_type):
    """
    Calculates Pest Risk based on GDD (Growing Degree Days) or humidity/temp.
    Returns: Warning Level (Low/Med/High), Pest Name, probability
    """
    # Mock GDD calculation logic (Simplified for US Market)
    # High Temp + High Humidity = Fungal / Insect boom
    temp = weather_data['temperature']
    humidity = weather_data['humidity']
    
    risk_level = "Low"
    pest_name = "None"
    probability = 10
    
    if crop_type == "Strawberries":
        if temp > 68 and humidity > 70:
            risk_level = "High"
            pest_name = "Powdery Mildew"
            probability = 85
        elif temp > 77:
             risk_level = "Medium"
             pest_name = "Spider Mites"
             probability = 60
             
    elif crop_type == "Tomatoes":
        if temp > 72 and humidity > 80:
            risk_level = "High"
            pest_name = "Late Blight"
            probability = 90
            
    elif crop_type == "Peppers":
        if temp > 82:
            risk_level = "High"
            pest_name = "Aphids"
            probability = 75
            
    return {"level": risk_level, "pest": pest_name, "prob": probability}

def fetch_market_prices(crop_type):
    """
    Generates mock market price trends (Last 7 days).
    """
    days = []
    prices = []
    
    # Base price per kg
    base_price = 10.0
    if crop_type == "Strawberries": base_price = 12.5
    elif crop_type == "Tomatoes": base_price = 4.5
    elif crop_type == "Peppers": base_price = 7.0
    
    current_price = base_price
    
    for i in range(7):
        date = datetime.now() - timedelta(days=6-i)
        days.append(date.strftime("%Y-%m-%d"))
        
        # Random market fluctuation
        change = random.uniform(-0.5, 0.8)
        current_price += change
        prices.append(round(current_price, 2))
        
    return pd.DataFrame({"Date": days, "Price ($/kg)": prices})
