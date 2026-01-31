import math
from datetime import datetime

class GreenhousePhysicsModel:
    """
    A deterministic physics model to estimate internal greenhouse environment
    based on external weather and facility parameters.
    """

    def __init__(self, facility_params=None):
        # Default facility parameters if none provided
        self.params = facility_params or {
            "type": "vinyl", # vinyl, glass, open
            "area_m2": 330,  # Standard 100-pyung
            "insulation_score": 0.5, # 0.0 (Open) to 1.0 (Hermetic)
            "ventilation_score": 0.7 # 0.0 (Closed) to 1.0 (Fully Open)
        }

    def calibrate_model(self, actual_internal_temp, external_weather):
        """
        Self-Improvement: Adjust insulation score based on Ground Truth.
        If actual temp > estimated, we might have better insulation (or greenhouse effect) than thought.
        """
        # 1. Run current estimation
        est = self.estimate_microclimate(external_weather)
        est_temp = est['temperature']
        
        error = actual_internal_temp - est_temp
        
        # 2. Adjust Insulation Score (Simple Heuristic Learning)
        # If Error > 0 (Actual is hotter), increase insulation/heat retention.
        # If Error < 0 (Actual is cooler), decrease it.
        
        correction_factor = 0.05 # slow learning rate
        
        if error > 2.0: # Significant underestimation
             self.params['insulation_score'] = min(0.9, self.params['insulation_score'] + correction_factor)
        elif error < -2.0: # Significant overestimation
             self.params['insulation_score'] = max(0.1, self.params['insulation_score'] - correction_factor)
             
        return {
            "previous_error": round(error, 2),
            "new_insulation_score": round(self.params['insulation_score'], 3),
            "status": "Calibrated"
        }

    def simulate_action(self, action_type, current_microclimate):
        """
        Simulates the IMMEDIATE effect of a control action on the environment.
        Used for the Virtual Controller UI.
        
        Args:
            action_type (str): 'irrigate', 'ventilate', 'shade', 'warm'
            current_microclimate (dict): Current temp/humidity/vpd state
            
        Returns:
            dict: The modified microclimate state (visual feedback)
        """
        # Create a copy so we don't mutate the original state persistently yet
        # (In a full twin, we would mutate self.state, but here we just return the 'next' frame)
        new_state = current_microclimate.copy()
        temp = new_state['temperature']
        hum = new_state['humidity']
        
        if action_type == 'irrigate':
            # Irrigation increases humidity significantly, drops temp slightly (evaporative cooling)
            new_state['humidity'] = min(100, hum + 15.0) 
            new_state['temperature'] = max(0, temp - 1.5)
            new_state['action_feedback'] = "Sprinklers Active: Humidity Rising..."
            
        elif action_type == 'ventilate':
            # Ventilation brings conditions closer to outside default (assuming cooler/drier usually)
            # For visual feedback, just drop hum and temp
            new_state['humidity'] = max(20, hum - 10.0)
            new_state['temperature'] = max(0, temp - 2.0)
            new_state['action_feedback'] = "Vents Open: Air exchange in progress..."
            
        elif action_type == 'warm':
            # Heater active
            new_state['temperature'] = temp + 3.0
            new_state['humidity'] = max(10, hum - 5.0) # Heating dries air
            new_state['action_feedback'] = "Heater On: Temperature rising..."
            
        # Re-calc VPD
        new_state['vpd'] = round(self.calculate_vpd(new_state['temperature'], new_state['humidity']), 2)
        new_state['temperature'] = round(new_state['temperature'], 1)
        new_state['humidity'] = round(new_state['humidity'], 1)
        
        return new_state

    def estimate_microclimate(self, external_weather):
        """
        Estimates internal temperature and humidity based on external conditions.
        
        Args:
            external_weather (dict):
                - temperature (float): Celsius
                - humidity (float): %
                - wind_speed (float): m/s
                - rain (float): mm
                - is_day (bool): True if daytime
        
        Returns:
            dict: Estimated { "temperature": float, "humidity": float, "vpd": float }
        """
        ext_temp = external_weather.get('temperature', 20)
        ext_hum = external_weather.get('humidity', 50)
        wind = external_weather.get('wind_speed', 0)
        is_day = external_weather.get('is_day', True)
        
        # 1. Temperature Estimation
        # Greenhouse Effect: Solar radiation adds heat during day
        # Wind Chill / Ventilation: Wind reduces the temperature difference
        
        solar_gain = 0
        if is_day:
            # Simplified solar gain model based on facility type
            base_gain = 5.0 if self.params['type'] == 'vinyl' else 7.0
            solar_gain = base_gain * (1 - self.params['ventilation_score'] * 0.5)
            
            # Reduce gain if cloudy/rainy (simplified by assuming rain implies clouds)
            if external_weather.get('rain', 0) > 0:
                solar_gain *= 0.2
        
        # Ventilation cooling effect
        wind_cooling = wind * self.params['ventilation_score'] * 0.5
        
        # Final estimated internal temp
        int_temp = ext_temp + solar_gain - wind_cooling
        
        # Night time heat retention (Insulation)
        if not is_day:
            # If it's colder outside, insulation keeps it warmer inside
            temp_diff = 3.0 * self.params['insulation_score']
            int_temp = ext_temp + temp_diff

        # 2. Humidity Estimation
        # Plants transpire, increasing humidity. Ventilation reduces it towards external levels.
        transpiration_add = 10 if is_day else 5 # Base humidity increase from plants
        vent_effect = (ext_hum - (ext_hum + transpiration_add)) * self.params['ventilation_score']
        
        int_hum = ext_hum + transpiration_add + vent_effect
        int_hum = max(0, min(100, int_hum)) # Clamp 0-100

        # 3. VPD Calculation
        vpd = self.calculate_vpd(int_temp, int_hum)

        return {
            "temperature": round(int_temp, 1),
            "humidity": round(int_hum, 1),
            "vpd": round(vpd, 2),
            "source": "physics_engine_v1"
        }

    def calculate_vpd(self, temp_c, humidity_percent):
        """
        Calculates Vapor Pressure Deficit (kPa)
        """
        # Saturation Vapor Pressure (SVP)
        svp = 0.61078 * math.exp((17.27 * temp_c) / (temp_c + 237.3))
        
        # Actual Vapor Pressure (AVP)
        avp = svp * (humidity_percent / 100.0)
        
        return svp - avp

    def get_safety_limits(self, crop_type="tomato"):
        """
        Returns hard safety limits for a crop to avoid AI Hallucination.
        """
        # Simplistic database
        limits = {
            "tomato": {"temp_min": 10, "temp_max": 35, "vpd_min": 0.3, "vpd_max": 1.5},
            "strawberry": {"temp_min": 5, "temp_max": 30, "vpd_min": 0.2, "vpd_max": 1.2},
            "default": {"temp_min": 0, "temp_max": 40, "vpd_min": 0.2, "vpd_max": 1.8}
        }
        return limits.get(crop_type.lower(), limits["default"])

# Singleton instance for simple usage
physics_engine = GreenhousePhysicsModel()
