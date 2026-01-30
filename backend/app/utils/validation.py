"""
Data Validation Utilities
Ensures all sensor and user input data is within realistic bounds
"""
from typing import Optional, Tuple

class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass

def validate_temperature(temp: float, unit: str = "F") -> Tuple[bool, Optional[str]]:
    """
    Validate temperature is within realistic bounds
    Returns (is_valid, error_message)
    """
    if unit == "F":
        min_temp, max_temp = -50, 150
    else:  # Celsius
        min_temp, max_temp = -45, 65
    
    if temp < min_temp or temp > max_temp:
        return False, f"Temperature {temp}°{unit} is outside realistic range ({min_temp}°{unit} to {max_temp}°{unit})"
    
    return True, None

def validate_humidity(humidity: float) -> Tuple[bool, Optional[str]]:
    """
    Validate humidity is within 0-100%
    Returns (is_valid, error_message)
    """
    if humidity < 0 or humidity > 100:
        return False, f"Humidity {humidity}% is outside valid range (0-100%)"
    
    return True, None

def validate_vpd(vpd: float) -> Tuple[bool, Optional[str]]:
    """
    Validate VPD is within realistic bounds
    Returns (is_valid, error_message)
    """
    if vpd < 0 or vpd > 5:
        return False, f"VPD {vpd} kPa is outside realistic range (0-5 kPa)"
    
    # Warning for suspicious values
    if vpd > 3:
        return True, f"Warning: VPD {vpd} kPa is unusually high"
    
    return True, None

def validate_rain(rain: float) -> Tuple[bool, Optional[str]]:
    """
    Validate rainfall amount
    Returns (is_valid, error_message)
    """
    if rain < 0:
        return False, f"Rainfall cannot be negative: {rain}"
    
    if rain > 20:  # 20 inches in a day is extremely rare
        return True, f"Warning: Rainfall {rain} inches is unusually high"
    
    return True, None

def validate_wind_speed(wind: float) -> Tuple[bool, Optional[str]]:
    """
    Validate wind speed
    Returns (is_valid, error_message)
    """
    if wind < 0:
        return False, f"Wind speed cannot be negative: {wind}"
    
    if wind > 200:  # mph - hurricane force
        return False, f"Wind speed {wind} mph is unrealistic"
    
    return True, None

def validate_coordinates(lat: float, lon: float) -> Tuple[bool, Optional[str]]:
    """
    Validate latitude and longitude
    Returns (is_valid, error_message)
    """
    if lat < -90 or lat > 90:
        return False, f"Latitude {lat} is outside valid range (-90 to 90)"
    
    if lon < -180 or lon > 180:
        return False, f"Longitude {lon} is outside valid range (-180 to 180)"
    
    return True, None

def sanitize_text_input(text: str, max_length: int = 1000) -> str:
    """
    Sanitize user text input to prevent XSS and other attacks
    """
    if not text:
        return ""
    
    # Truncate to max length
    text = text[:max_length]
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', '\x00']
    for char in dangerous_chars:
        text = text.replace(char, '')
    
    # Remove control characters except newlines and tabs
    text = ''.join(char for char in text if char.isprintable() or char in ['\n', '\t'])
    
    return text.strip()

def validate_crop_type(crop: str) -> Tuple[bool, Optional[str]]:
    """
    Validate crop type is in allowed list
    Returns (is_valid, error_message)
    """
    allowed_crops = [
        "Strawberries", "Tomatoes", "Peppers", "Lettuce",
        "Cucumbers", "Spinach", "Carrots", "Broccoli"
    ]
    
    if crop not in allowed_crops:
        return False, f"Crop '{crop}' is not supported. Allowed: {', '.join(allowed_crops)}"
    
    return True, None

def validate_sensor_data(data: dict) -> Tuple[bool, list]:
    """
    Validate all sensor data at once
    Returns (is_valid, list_of_errors)
    """
    errors = []
    
    # Temperature
    if 'temperature' in data:
        is_valid, error = validate_temperature(data['temperature'])
        if not is_valid:
            errors.append(error)
    
    # Humidity
    if 'humidity' in data:
        is_valid, error = validate_humidity(data['humidity'])
        if not is_valid:
            errors.append(error)
    
    # VPD
    if 'vpd' in data:
        is_valid, error = validate_vpd(data['vpd'])
        if not is_valid:
            errors.append(error)
    
    # Rain
    if 'rain' in data:
        is_valid, error = validate_rain(data['rain'])
        if not is_valid:
            errors.append(error)
    
    # Wind
    if 'wind_speed' in data:
        is_valid, error = validate_wind_speed(data['wind_speed'])
        if not is_valid:
            errors.append(error)
    
    return len(errors) == 0, errors
