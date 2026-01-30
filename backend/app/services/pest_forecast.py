"""
Enhanced Pest & Disease Forecasting
Uses real weather data and scientific models for accurate predictions
"""
import math
from typing import Dict, List, Tuple

# Scientific pest risk models based on research
PEST_MODELS = {
    "Strawberries": {
        "Gray Mold (Botrytis)": {
            "temp_range": (50, 77),
            "humidity_min": 85,
            "rain_threshold": 0.05,
            "vpd_max": 0.5,
            "severity": "High"
        },
        "Powdery Mildew": {
            "temp_range": (60, 80),
            "humidity_range": (40, 70),
            "vpd_range": (0.3, 0.8),
            "severity": "Medium"
        },
        "Spider Mites": {
            "temp_min": 80,
            "humidity_max": 50,
            "vpd_min": 1.2,
            "severity": "High"
        },
        "Anthracnose": {
            "temp_range": (70, 85),
            "humidity_min": 80,
            "rain_threshold": 0.1,
            "severity": "High"
        }
    },
    "Tomatoes": {
        "Late Blight": {
            "temp_range": (50, 75),
            "humidity_min": 90,
            "rain_threshold": 0.1,
            "severity": "Critical"
        },
        "Early Blight": {
            "temp_range": (75, 85),
            "humidity_range": (80, 95),
            "severity": "High"
        },
        "Whiteflies": {
            "temp_min": 85,
            "humidity_range": (60, 80),
            "severity": "Medium"
        },
        "Septoria Leaf Spot": {
            "temp_range": (60, 80),
            "humidity_min": 85,
            "rain_threshold": 0.05,
            "severity": "Medium"
        }
    },
    "Peppers": {
        "Bacterial Spot": {
            "temp_range": (75, 86),
            "humidity_min": 85,
            "rain_threshold": 0.1,
            "severity": "High"
        },
        "Phytophthora Blight": {
            "temp_range": (75, 85),
            "humidity_min": 90,
            "rain_threshold": 0.2,
            "severity": "Critical"
        },
        "Aphids": {
            "temp_range": (65, 80),
            "humidity_range": (50, 70),
            "severity": "Medium"
        }
    },
    "Lettuce": {
        "Downy Mildew": {
            "temp_range": (59, 68),
            "humidity_min": 85,
            "rain_threshold": 0.05,
            "severity": "High"
        },
        "Bottom Rot": {
            "temp_range": (68, 77),
            "humidity_min": 90,
            "severity": "Medium"
        },
        "Aphids": {
            "temp_range": (60, 75),
            "humidity_range": (40, 70),
            "severity": "Low"
        }
    },
    "Cucumbers": {
        "Powdery Mildew": {
            "temp_range": (68, 81),
            "humidity_range": (50, 70),
            "severity": "High"
        },
        "Downy Mildew": {
            "temp_range": (59, 72),
            "humidity_min": 85,
            "rain_threshold": 0.1,
            "severity": "High"
        },
        "Cucumber Beetles": {
            "temp_min": 75,
            "severity": "Medium"
        }
    }
}

def calculate_vpd(temp_f: float, humidity: float) -> float:
    """Calculate Vapor Pressure Deficit"""
    temp_c = (temp_f - 32) * 5.0/9.0
    svp = 0.61078 * math.exp((17.27 * temp_c) / (temp_c + 237.3))
    vpd = svp * (1 - (humidity / 100))
    return round(vpd, 2)

def evaluate_pest_risk(
    pest_name: str,
    conditions: Dict,
    temp: float,
    humidity: float,
    rain: float,
    vpd: float
) -> Tuple[int, str]:
    """
    Evaluate pest risk based on scientific conditions
    Returns (risk_score, risk_level)
    """
    risk_score = 0
    factors_met = []
    
    # Temperature check
    if "temp_range" in conditions:
        t_min, t_max = conditions["temp_range"]
        if t_min <= temp <= t_max:
            risk_score += 30
            factors_met.append("optimal temperature")
    elif "temp_min" in conditions:
        if temp >= conditions["temp_min"]:
            risk_score += 30
            factors_met.append("high temperature")
    
    # Humidity check
    if "humidity_min" in conditions:
        if humidity >= conditions["humidity_min"]:
            risk_score += 25
            factors_met.append("high humidity")
    elif "humidity_max" in conditions:
        if humidity <= conditions["humidity_max"]:
            risk_score += 25
            factors_met.append("low humidity")
    elif "humidity_range" in conditions:
        h_min, h_max = conditions["humidity_range"]
        if h_min <= humidity <= h_max:
            risk_score += 25
            factors_met.append("optimal humidity")
    
    # Rain check
    if "rain_threshold" in conditions:
        if rain >= conditions["rain_threshold"]:
            risk_score += 20
            factors_met.append("recent rainfall")
    
    # VPD check
    if "vpd_max" in conditions:
        if vpd <= conditions["vpd_max"]:
            risk_score += 15
            factors_met.append("low VPD")
    elif "vpd_min" in conditions:
        if vpd >= conditions["vpd_min"]:
            risk_score += 15
            factors_met.append("high VPD")
    elif "vpd_range" in conditions:
        v_min, v_max = conditions["vpd_range"]
        if v_min <= vpd <= v_max:
            risk_score += 15
            factors_met.append("optimal VPD")
    
    # Determine risk level
    if risk_score >= 70:
        risk_level = "Critical"
    elif risk_score >= 50:
        risk_level = "High"
    elif risk_score >= 30:
        risk_level = "Medium"
    else:
        risk_level = "Low"
    
    return risk_score, risk_level, factors_met

def forecast_pest_risk(crop_type: str, weather_data: List[Dict]) -> List[Dict]:
    """
    Generate pest forecast based on weather data and scientific models
    """
    crop_pests = PEST_MODELS.get(crop_type, PEST_MODELS["Strawberries"])
    forecast = []
    
    for day_data in weather_data:
        temp = day_data.get("max_temp", 70)
        humidity = day_data.get("humidity", 60)
        rain = day_data.get("rain", 0)
        vpd = calculate_vpd(temp, humidity)
        
        # Evaluate all pests for this crop
        pest_risks = []
        max_risk_score = 0
        primary_pest = "None"
        primary_risk_level = "Low"
        
        for pest_name, conditions in crop_pests.items():
            risk_score, risk_level, factors = evaluate_pest_risk(
                pest_name, conditions, temp, humidity, rain, vpd
            )
            
            if risk_score > max_risk_score:
                max_risk_score = risk_score
                primary_pest = pest_name
                primary_risk_level = risk_level
            
            if risk_score >= 30:  # Only include significant risks
                pest_risks.append({
                    "pest": pest_name,
                    "risk_score": risk_score,
                    "risk_level": risk_level,
                    "factors": factors
                })
        
        # Generate condition description
        if max_risk_score >= 70:
            condition = f"Critical Risk: {primary_pest}"
        elif max_risk_score >= 50:
            condition = f"High Risk: {primary_pest}"
        elif max_risk_score >= 30:
            condition = f"Medium Risk: {primary_pest}"
        else:
            condition = "Low Risk"
        
        forecast.append({
            "Date": day_data.get("date"),
            "Risk Score": max_risk_score,
            "Condition": condition,
            "Pest": primary_pest,
            "Rain (in)": rain,
            "Humidity (%)": humidity,
            "Temp (F)": temp,
            "VPD (kPa)": vpd,
            "All Risks": pest_risks
        })
    
    return forecast
