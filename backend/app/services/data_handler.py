import requests
import pandas as pd
import random
import math
import os
from datetime import datetime, timedelta
from functools import lru_cache

@lru_cache(maxsize=128)
def fetch_weather_data(lat=37.7749, lon=-122.4194):
    """
    Fetches current weather data from Open-Meteo API.
    """
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        current = data.get('current', {})
        return {
            "temperature": current.get('temperature_2m'),
            "humidity": current.get('relative_humidity_2m'),
            "rain": current.get('rain', 0.0),
            "wind_speed": current.get('wind_speed_10m', 0.0)
        }
    except Exception as e:
        print(f"Error fetching weather: {e}")
        # STRICT REAL DATA POLICY: Return None on failure, do not fake data
        return None

@lru_cache(maxsize=128)
def get_coordinates_from_city(city_name):
    try:
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {
            "name": city_name,
            "count": 5,
            "language": "en",
            "format": "json"
        }
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
        
        if "results" in data and data["results"]:
            # Prefer match with highest population if available, or just first
            results = data["results"]
            # specific fix for "New York" -> usually first is NYC, but let's be safe
            best_match = results[0]
            
            lat = best_match.get("latitude")
            lon = best_match.get("longitude")
            country = best_match.get("country", "")
            state = best_match.get("admin1", "")
            
            # Formatting name nicely
            location_name = f"{best_match['name']}"
            if state: location_name += f", {state}"
            elif country: location_name += f", {country}"
            
            return lat, lon, location_name
    except Exception:
        pass
    return None, None, None

def calculate_vpd(temp_f, humidity):
    temp_c = (temp_f - 32) * 5.0/9.0
    svp = 0.61078 * math.exp((17.27 * temp_c) / (temp_c + 237.3))
    vpd = svp * (1 - (humidity / 100))
    return round(vpd, 2)

def calculate_pest_risk(weather_data, crop_type):
    temp = weather_data['temperature']
    humidity = weather_data['humidity']
    vpd = calculate_vpd(temp, humidity)
    
    risk_level = "Low"
    pest_name = "None"
    probability = 10
    
    if crop_type == "Strawberries":
        if 60 <= temp <= 80 and vpd < 0.5:
            risk_level = "High"
            pest_name = "Powdery Mildew"
            probability = min(95, 40 + (80 - vpd*100))
        elif temp > 80 and vpd > 1.2:
            risk_level = "Medium"
            pest_name = "Spider Mites"
            probability = 65
            
    elif crop_type == "Tomatoes":
        if 50 <= temp <= 75 and (humidity > 90 or vpd < 0.3):
             risk_level = "High"
             pest_name = "Late Blight"
             probability = 90
        elif temp > 85:
             risk_level = "Medium"
             pest_name = "Whiteflies"
             probability = 55
             
    elif crop_type == "Peppers":
        if 65 <= temp <= 80:
            risk_level = "Medium"
            pest_name = "Aphids"
            probability = 50 + (temp - 60)
            if probability > 85: risk_level = "High"
            
    return {"level": risk_level, "pest": pest_name, "prob": int(probability)}

from .ai_engine import analyze_pest_risk_with_ai, analyze_market_prices_with_ai

@lru_cache(maxsize=64)
def fetch_7day_weather(lat, lon):
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,precipitation_sum&temperature_unit=fahrenheit&precipitation_unit=inch&wind_speed_unit=mph&timezone=auto"
        response = requests.get(url, timeout=10)
        data = response.json()
        return data.get('daily', {})
    except Exception as e:
        print(f"Error forecast: {e}")
        return {}

def calculate_weekly_pest_risk(lat, lon, crop_type):
    daily = fetch_7day_weather(lat, lon)
    if not daily:
        return pd.DataFrame() 
    
    # Check if we can use AI first
    dates = daily.get('time', [])
    
    # Simplify weather for AI context
    weather_summary = []
    for i in range(len(dates)):
        weather_summary.append({
            "date": dates[i],
            "max_temp": daily['temperature_2m_max'][i],
            "humidity": daily['relative_humidity_2m_mean'][i],
            "rain": daily['precipitation_sum'][i]
        })
        
    ai_results = analyze_pest_risk_with_ai(weather_summary, crop_type)
    
    if ai_results:
        # Merge AI results with rain data for chart
        for i, item in enumerate(ai_results):
            # Try to match rain data if dates align
            if i < len(daily['precipitation_sum']):
                 item["Rain (in)"] = daily['precipitation_sum'][i]
        
        df_ai = pd.DataFrame(ai_results)
        df_ai['Source'] = "AI Analysis (Gemini 1.5)"
        return df_ai

    # Fallback to Rule-based if AI fails or no key
    max_temps = daily.get('temperature_2m_max', [])
    min_temps = daily.get('temperature_2m_min', [])
    humidities = daily.get('relative_humidity_2m_mean', [])
    rains = daily.get('precipitation_sum', [])
    
    risk_data = []
    
    for i in range(len(dates)):
        date = dates[i]
        t_max = max_temps[i]
        t_min = min_temps[i]
        hum = humidities[i]
        rain = rains[i]
        avg_temp = (t_max + t_min) / 2
        
        risk_score = 10 
        risk_detail = "Low Risk (Rule-Based)"
        primary_pest = "None"
        
        if crop_type == "Strawberries":
            if 55 <= avg_temp <= 75 and (rain > 0.05 or hum > 85):
                risk_score = 90
                risk_detail = "High Risk: Botrytis (Gray Mold)"
                primary_pest = "Gray Mold"
            elif t_max > 80 and hum < 50:
                risk_score = 75
                risk_detail = "High Risk: Spider Mites"
                primary_pest = "Spider Mites"
        
        risk_data.append({
            "Date": date,
            "Risk Score": risk_score,
            "Condition": risk_detail,
            "Pest": primary_pest,
            "Rain (in)": rain,
            "Humidity (%)": hum,
            "Temp (F)": avg_temp
        })
        
    return pd.DataFrame(risk_data)

def fetch_market_prices(crop_type):
    # Try AI First
    ai_prices = analyze_market_prices_with_ai(crop_type)
    if ai_prices:
        df = pd.DataFrame(ai_prices)
        df['Source'] = "AI Market Analysis (Gemini 1.5)"
        return df

    # STRICT REAL DATA POLICY: No simulation allowed
    # Return empty if AI fails and no real API is available
    return pd.DataFrame(columns=["Date", "Price ($/lb)", "Source"])
