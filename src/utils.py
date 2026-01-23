import json
import os

def load_config():
    """Loads the configuration from src/config.json"""
    base_path = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(base_path, 'config.json')
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Fallback if file not found (though it should be there)
        return {
            "crop_options": ["Strawberries", "Tomatoes", "Peppers"],
            "locations": {"California (US)": {"lat": 36.7783, "lon": -119.4179}}
        }
