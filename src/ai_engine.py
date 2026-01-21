import os
import google.generativeai as genai
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

# Priority: Streamlit Secrets (Cloud) > os.getenv (Local .env)
# Debugging: Print available secrets keys to logs
if hasattr(st, "secrets"):
    print(f"DEBUG: Available secrets keys: {list(st.secrets.keys())}")

if "GEMINI_API_KEY" in st.secrets:
    API_KEY = st.secrets["GEMINI_API_KEY"]
else:
    API_KEY = os.getenv("GEMINI_API_KEY")

def get_gemini_response(context_text, crop_type, role="Smart Farming Expert"):
    if not API_KEY:
        return "⚠️ **Error**: API Key not found. Please set GEMINI_API_KEY in Streamlit Secrets."

    try:
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        You are {role}, also known as Mars AI.
        Current Crop: {crop_type}
        
        Analyze the following real-time data and provide a specific "Ag-Prescription".
        
        DATA:
        {context_text}
        
        OUTPUT FORMAT:
        **Status**: [Normal / Warning / Critical]
        **Prescription**: [Specific action, e.g., "Irrigate 15 mins", "Ventilate"]
        **Reasoning**: [Explain why based on data and crop needs]
        
        Keep it brief, professional, and actionable for a US farmer. Use Imperial units.
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error connecting to AI: {e}"

def get_rule_based_recommendation(sensor_data, weather_data, crop_type):
    """
    Fallback logic if AI is not available.
    """
    moisture = sensor_data['soil_moisture']
    temp = weather_data['temperature']
    
    status = "Normal"
    action = "Monitor conditions."
    reasoning = f"Conditions are within optimal range for {crop_type}."
    
    # Simple logic adjustments per crop
    min_moisture = 60
    max_moisture = 85
    if crop_type == "Peppers":
        min_moisture = 50
    
    if moisture < min_moisture:
        status = "Warning"
        action = "IRRIGATE: Turn on drip lines for 15 minutes."
        reasoning = f"Soil moisture ({moisture}%) is below the {min_moisture}% threshold for {crop_type}."
    elif moisture > max_moisture:
        status = "Warning"
        action = "DRAINAGE CHECK: Ensure fields are not waterlogged."
        reasoning = f"Soil moisture is high ({moisture}%), risk of fungal disease for {crop_type}."
    elif temp > 30 and moisture < min_moisture + 10:
         status = "Critical"
         action = "COOLING MIST: Deploy cooling mist immediately."
         reasoning = f"High heat ({temp}°C) combined with drying soil risks fruit damage."
         
    return f"**Status**: {status}\n\n**Prescription**: {action}\n\n**Reasoning**: {reasoning}\n\n*(Note: Running in Simulation Mode. Add GEMINI_API_KEY to .env for Gemini 3)*"

import json

def load_knowledge_base():
    try:
        with open('src/knowledge_base.json', 'r') as f:
            return json.load(f)
    except:
        return {}

from src.db_handler import log_safety_event, get_weekly_stats

def analyze_situation(weather, crop_type):
    # 1. Load Knowledge Context
    kb = load_knowledge_base()
    crop_info = kb.get(crop_type, {})
    
    context = f"""
    [Situation Report]
    Crop: {crop_type}
    Weather: {weather['temperature']}°F, {weather['humidity']}%, Rain: {weather['rain']}in, Wind: {weather['wind_speed']}mph
    
    [Optimal Ranges]
    Temp: {crop_info.get('temp_min')}-{crop_info.get('temp_max')}°F
    Humidity: {crop_info.get('humidity_min')}-{crop_info.get('humidity_max')}%
    """
    
    # 2. AI Reasoning
    return get_gemini_response(context, crop_type, role="US Agricultural Extension Agent")

def generate_weekly_report(crop_type):
    stats = get_weekly_stats(crop_type)
    if not stats:
        return "Insufficient data to generate weekly report."
        
    kb = load_knowledge_base()
    crop_info = kb.get(crop_type, {})
    
    # Prompt for AI Report
    context = f"""
    [Weekly Farm Stats for {crop_type}]
    Avg Temp: {stats['avg_temp']}°C
    Avg Moisture: {stats['avg_moisture']}%
    Data Points Collected: {stats['data_points']}
    
    [Standard Info]
    Target Moisture: {crop_info.get('soil_moisture_min')} - {crop_info.get('soil_moisture_max')}%
    """
    
    if not API_KEY:
        return f"**Weekly Stats**: Avg Temp {stats['avg_temp']}C, Avg Moisture {stats['avg_moisture']}%.\n*(AI Insight unavailable in Simulation Mode)*"
        
    try:
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"""
        You are a Farm Manager AI. Write a 'Weekly Farm Report' based on the stats.
        Stats: {context}
        
        Output Structure:
        1. **Grade**: (A, B, C, etc based on adherence to standards)
        2. **Summary**: What went well/wrong.
        3. **Next Week Advice**: Focus area.
        """
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error creating report: {e}"

def analyze_crop_image(image_data):
    """
    Analyzes uploaded crop image for diseases.
    """
    if not API_KEY:
        return "⚠️ **Error**: API Key not found. Please set GEMINI_API_KEY in Streamlit Secrets."
        
    try:
        genai.configure(api_key=API_KEY)
        # Use stable model version
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are Mars AI, an expert US Agricultural Extension Agent.
        Analyze this image of a crop.
        1. Identify the crop.
        2. Diagnose any disease or deficiency (e.g., fungal, nutrient, pest).
        3. Recommend a treatment focusing on ROI and efficacy.
        
        If healthy, say "Healthy" and estimate yield potential.
        """
        
        # In a real app, we would pass the PIL image or bytes depending on the library version
        # Here we assume the image is passed in a format Gemini accepts (PIL Image)
        response = model.generate_content([prompt, image_data])
        return response.text
    except Exception as e:
        return f"⚠️ **AI Error**: {type(e).__name__} - {str(e)}"
