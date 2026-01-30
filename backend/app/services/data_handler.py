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

@lru_cache(maxsize=256)
def get_coordinates_from_city(city_name, preferred_country=None):
    """
    Enhanced geocoding with country preference support
    Prioritizes results from preferred_country if provided
    
    Args:
        city_name: City name to search for
        preferred_country: ISO country code (e.g., 'US', 'GB', 'KR') to prioritize
    """
    try:
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {
            "name": city_name,
            "count": 100, # Increased from 10 to ensure major cities are found
            "language": "en",
            "format": "json"
        }
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
        
        if "results" not in data or not data["results"]:
            return None, None, None
        
        results = data["results"]
        best_match = None

        # Helper to get population safely
        def get_pop(item):
            return item.get("population") or 0
        
        # Strategy 1: Country-aware prioritization
        if preferred_country:
            # Try strict country match first
            country_matches = [r for r in results if r.get("country_code") == preferred_country]
            
            if country_matches:
                # Determine "Major City" threshold to avoid tiny villages in preferred country
                # overriding major global cities if the name is ambiguous?
                # Actually, if user sets country, they likely mean that country.
                # Sort by population desc
                country_matches.sort(key=get_pop, reverse=True)
                best_match = country_matches[0]
                print(f"🎯 Prioritized {preferred_country}: '{city_name}' -> {best_match.get('name')}, {best_match.get('country')}")
            else:
                print(f"⚠️ Preferred country {preferred_country} not found for '{city_name}', falling back global.")

        # Strategy 2: Global Population Fallback
        # If no country match yet, use global sorting.
        if not best_match:
            # Sort global results by population
            results.sort(key=get_pop, reverse=True)
            best_match = results[0]
            
            # EDGE CASE: "Newyork" (UK) vs "New York" (US)
            # If the user input is "Newyork" (no space), Open-Meteo might prioritize exact string match 
            # over population in its default sorting (before our re-sort).
            # By fetching 100 results and re-sorting by population here, we ensure 
            # New York, US (8M+) beats Newyork, UK (low pop).
            print(f"🌍 Global match: '{city_name}' -> {best_match.get('name')}, {best_match.get('country')} (Pop: {get_pop(best_match)})")
        
        lat = best_match.get("latitude")
        lon = best_match.get("longitude")
        country = best_match.get("country", "")
        country_code = best_match.get("country_code", "")
        state = best_match.get("admin1", "")  # State/Province
        
        # Format location name intelligently
        location_name = f"{best_match['name']}"
        
        # Add context (State for US, Country for others)
        if country_code == "US" and state:
            location_name += f", {state}"
        elif country:
            location_name += f", {country}"
            
        print(f"📍 Final: '{city_name}' -> {location_name} ({lat}, {lon})")
        
        return lat, lon, location_name, country_code
        
    except Exception as e:
        print(f"Geocoding error for '{city_name}': {e}")
        return None, None, None, None

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
    """
    Calculate pest risk using scientific models + AI fallback
    Priority: Scientific Models > AI > Rule-based
    """
    daily = fetch_7day_weather(lat, lon)
    if not daily:
        return pd.DataFrame() 
    
    dates = daily.get('time', [])
    
    # Prepare weather data for analysis
    weather_summary = []
    for i in range(len(dates)):
        weather_summary.append({
            "date": dates[i],
            "max_temp": daily['temperature_2m_max'][i],
            "humidity": daily['relative_humidity_2m_mean'][i],
            "rain": daily['precipitation_sum'][i]
        })
    
    # Try scientific model first
    try:
        from app.services.pest_forecast import forecast_pest_risk
        forecast_data = forecast_pest_risk(crop_type, weather_summary)
        
        if forecast_data:
            df = pd.DataFrame(forecast_data)
            df['Source'] = "Scientific Pest Model"
            return df
    except ImportError:
        print("⚠️ pest_forecast module not available, trying AI")
    except Exception as e:
        print(f"Error in scientific pest forecast: {e}")
    
    # Fallback to AI analysis
    ai_results = analyze_pest_risk_with_ai(weather_summary, crop_type)
    
    if ai_results:
        # Merge AI results with rain data for chart
        for i, item in enumerate(ai_results):
            if i < len(daily['precipitation_sum']):
                 item["Rain (in)"] = daily['precipitation_sum'][i]
        
        df_ai = pd.DataFrame(ai_results)
        df_ai['Source'] = "AI Analysis (Gemini 1.5)"
        return df_ai

    # Last resort: Simple rule-based fallback
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
        
        # Basic rules for strawberries
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
        
    df = pd.DataFrame(risk_data)
    df['Source'] = "Basic Rule-Based Model"
    return df

def fetch_market_prices(crop_type):
    """
    Fetch real market prices using USDA NASS API
    Falls back to AI analysis if real data unavailable
    """
    try:
        from app.services.market_data import get_market_prices
        df = get_market_prices(crop_type)
        
        if df is not None and not df.empty:
            return df
    except ImportError:
        print("⚠️ market_data module not available, using AI fallback")
    except Exception as e:
        print(f"Error fetching real market data: {e}")
    
    # Fallback to AI analysis
    ai_prices = analyze_market_prices_with_ai(crop_type)
    if ai_prices:
        df = pd.DataFrame(ai_prices)
        df['Source'] = "AI Market Analysis (Gemini 1.5)"
        return df

    # Last resort: return empty DataFrame
    return pd.DataFrame(columns=["Date", "Price ($/lb)", "Source"])

