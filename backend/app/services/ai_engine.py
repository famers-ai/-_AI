import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from functools import lru_cache
from .db_handler import log_safety_event, get_weekly_stats

load_dotenv()

def get_api_key():
    return os.getenv("GEMINI_API_KEY")

@lru_cache(maxsize=1)
def get_active_model_name():
    try:
        api_key = get_api_key()
        if not api_key: return "gemini-pro"
        
        genai.configure(api_key=api_key)
        models = genai.list_models()
        candidates = []
        for m in models:
            if "generateContent" in m.supported_generation_methods:
                name = m.name.replace("models/", "")
                candidates.append(name)
        
        preferred = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
        for pref in preferred:
            if pref in candidates:
                return pref
        return candidates[0] if candidates else "gemini-pro"
    except:
        return "gemini-pro"

def get_gemini_response(context_text, crop_type, role="Smart Farming Expert"):
    api_key = get_api_key()
    if not api_key:
        return "Error: API Key not found. Please set GEMINI_API_KEY in .env"

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(get_active_model_name())
        
        prompt = f"""
        You are {role}, also known as ForHuman AI.
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
        # Fallback simulation
        return f"""
        **Status**: Normal (Simulation Mode)
        **Prescription**: Maintain current irrigation schedule.
        **Reasoning**: Conditions are within expected ranges for {crop_type}. 
        *(Error: {str(e)})*
        """

def load_knowledge_base():
    try:
        base_path = os.path.dirname(__file__)
        path = os.path.join(base_path, 'knowledge_base.json')
        with open(path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading KB: {e}")
        return {}

def analyze_situation(weather, crop_type):
    kb = load_knowledge_base()
    crop_info = kb.get(crop_type, {})
    
    context = f"""
    [Situation Report]
    Crop: {crop_type}
    Weather: {weather['temperature']}F, {weather['humidity']}%, Rain: {weather['rain']}in, Wind: {weather['wind_speed']}mph
    
    [Optimal Ranges]
    Temp: {crop_info.get('temp_min')}-{crop_info.get('temp_max')}F
    Humidity: {crop_info.get('humidity_min')}-{crop_info.get('humidity_max')}%
    """
    
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
    Avg Temp: {stats.get('avg_temp')}
    Avg Moisture: {stats.get('avg_moisture')}%
    Data Points Collected: {stats.get('data_points')}
    
    [Standard Info]
    Target Moisture: {crop_info.get('soil_moisture_min')} - {crop_info.get('soil_moisture_max')}%
    """
    
    api_key = get_api_key()
    if not api_key:
        return f"Weekly Report (Simulated): Stats indicate stable growth. Avg Temp {stats.get('avg_temp')}."
        
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
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
    api_key = get_api_key()
    if not api_key:
        return "Error: API Key not found."
        
    try:
        genai.configure(api_key=api_key)
        model_name = get_active_model_name()
        # Ensure model supports vision
        if "flash" not in model_name and "1.5" not in model_name:
            model_name = "gemini-1.5-flash"
            
        model = genai.GenerativeModel(model_name)
        
        prompt = """
        You are ForHuman AI, an expert US Agricultural Extension Agent.
        Analyze this image of a crop.
        1. Identify the crop.
        2. Diagnose any disease or deficiency (e.g., fungal, nutrient, pest).
        3. Recommend a treatment focusing on ROI and efficacy.
        
        If healthy, say "Healthy" and estimate yield potential.
        """
        
        response = model.generate_content([prompt, image_data])
        return response.text
    except Exception as e:
        return f"Global API Error: {str(e)}"

def analyze_pest_risk_with_ai(weather_forecast, crop_type):
    api_key = get_api_key()
    if not api_key:
        return []

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
        You are an expert plant pathologist. I will provide a 7-day weather forecast.
        For each day, analyze the risk of pests/diseases for {crop_type}.
        
        FORECAST DATA:
        {json.dumps(weather_forecast)}
        
        OUTPUT FORMAT (JSON list only, no markdown):
        [
            {{
                "Date": "YYYY-MM-DD",
                "Risk Score": 0-100 (integer),
                "Condition": "High Risk: [Specific Disease]",
                "Pest": "[Pest Name]"
            }},
            ...
        ]
        
        Rules:
        - Strict JSON output.
        - High humidity + moderate temp = Fungal risk (Botrytis, Blight).
        - Hot + Dry = Mite risk.
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Robust JSON extraction
        try:
            import re
            match = re.search(r'\[.*\]', text, re.DOTALL)
            if match:
                json_str = match.group()
                return json.loads(json_str)
            else:
                # Try simple clean if regex fails
                cleaned = text.replace("```json", "").replace("```", "").strip()
                return json.loads(cleaned)
        except Exception as e:
            print(f"AI Pest Parse Error: {e} | Raw: {text[:100]}...")
            return []
    except Exception as e:
        print(f"AI Pest Error: {e}")
        return []

def analyze_market_prices_with_ai(crop_type):
    api_key = get_api_key()
    if not api_key:
        return []

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
        You are an agricultural market analyst. 
        Generate or estimate the current wholesale market price trend for {crop_type} (US Market) for the last 7 days.
        Base this on your knowledge of seasonal trends and current market conditions.
        
        OUTPUT FORMAT (JSON list only, no markdown):
        [
            {{
                "Date": "YYYY-MM-DD",
                "Price ($/lb)": 0.00 (float)
            }},
            ...
        ]
        
        Rules:
        - Return exactly 7 days ending today.
        - Prices should be realistic per lb.
        - Strict JSON output.
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        try:
            import re
            match = re.search(r'\[.*\]', text, re.DOTALL)
            if match:
                json_str = match.group()
                return json.loads(json_str)
            else:
                 cleaned = text.replace("```json", "").replace("```", "").strip()
                 return json.loads(cleaned)
        except Exception as e:
            print(f"AI Market Parse Error: {e}")
            return []
    except Exception as e:
        print(f"AI Market Error: {e}")
        return []
