import streamlit as st
import time
from src.utils import load_config
from src.data_handler import fetch_weather_data, get_coordinates_from_city
from src.db_handler import init_db, get_user_pref, set_user_pref

# Import Tab Components
from src.tabs.dashboard import render_dashboard
from src.tabs.ai_doctor import render_ai_doctor
from src.tabs.pest_forecast import render_pest_forecast
from src.tabs.market_prices import render_market_prices
from src.tabs.weekly_report import render_weekly_report

# Initialize DB
init_db()

# Load Config
config = load_config()
APP_SETTINGS = config.get("app_settings", {})
CROP_OPTIONS = config.get("crop_options", [])
LOCATIONS = config.get("locations", {})

# Load Logo if available
logo_path = "assets/logo.png"
try:
    from PIL import Image
    page_icon = Image.open(logo_path)
except:
    page_icon = APP_SETTINGS.get("icon", "🪐")

st.set_page_config(
    page_title=APP_SETTINGS.get("title", "ForHuman AI"),
    page_icon=page_icon,
    layout="wide"
)

# DEBUG: show which secret keys are available
# try:
#     keys = list(st.secrets.keys())
    # st.warning(f"🔑 Available Streamlit secret keys: {keys}") # Commented out for production feel
# except Exception as e:
#     pass


# --- CSS Styling for "Premium" Feel ---
st.markdown("""
<style>
    /* Global Settings */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
        color: #1e293b;
    }
    
    .stApp {
        background-color: #f8f9fa;
        margin-top: -80px; /* Counteract padding if header is hidden poorly */
    }

    /* --- NUCLEAR OPTION: HIDE STREAMLIT UI ELEMENTS --- */
    
    /* 1. Header & Decoration Bars */
    header, [data-testid="stHeader"], [data-testid="stDecoration"] {
        visibility: hidden !important;
        display: none !important;
        height: 0px !important;
    }
    
    /* 2. Main Menu (Hamburger) & Toolbar */
    #MainMenu, [data-testid="stToolbar"], [data-testid="stStatusWidget"] {
        visibility: hidden !important;
        display: none !important;
    }
    
    /* 3. Footer (Built with Streamlit) */
    footer, [data-testid="stFooter"] {
        visibility: hidden !important;
        display: none !important;
        height: 0px !important;
    }
    
    /* 4. Sidebar specific footer (Built with Streamlit balloon) */
    /* This targets the container that usually holds the footer in the sidebar */
    section[data-testid="stSidebar"] > div > div:last-child {
        display: none !important; 
    }
    /* Specific classes found in recent versions for the sidebar footer */
    .st-emotion-cache-164nlkn, .st-emotion-cache-1l1l072, .viewerBadge_container__1QSob, .viewerBadge_link__1S137 {
        display: none !important;
    }
    
    /* 5. "Fullscreen" Button (Floating action in some deployments) */
    button[title="View fullscreen"], [data-testid="StyledFullScreenButton"] {
        visibility: hidden !important;
        display: none !important;
    }
    
    /* 6. Deploy Button (Top right) */
    .stDeployButton {
        display: none !important;
    }

    /* Force body to top since header is gone */
    .block-container {
        padding-top: 0rem !important;
        padding-bottom: 2rem !important;
    }
    
    /* Custom Metric Card */
    .metric-card {
        background-color: white;
        padding: 20px;
        border-radius: 16px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border-left: 5px solid #2ed573;
        transition: transform 0.2s;
    }
    .metric-card:hover {
        transform: translateY(-2px);
    }
    .metric-label {
        color: #64748b;
        font-size: 0.875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .metric-value {
        color: #0f172a;
        font-size: 1.5rem;
        font-weight: 700;
        margin-top: 8px;
    }

    /* AI Insight Card */
    .ai-card {
        background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
        padding: 24px;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        margin-top: 20px;
    }
    
    /* Tabs styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 10px;
        background-color: transparent;
    }
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        white-space: pre-wrap;
        background-color: white;
        border-radius: 10px;
        color: #64748b;
        font-weight: 600;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        border: 1px solid #e2e8f0;
    }
    .stTabs [aria-selected="true"] {
        background-color: #2ed573;
        color: white;
        border: none;
    }
    
</style>
""", unsafe_allow_html=True)

# --- Sidebar ---
st.sidebar.title(APP_SETTINGS.get("title", "ForHuman AI"))
st.sidebar.caption("Future Farming Solutions")

# 1. Load Saved Settings
saved_crop = get_user_pref("crop_type", APP_SETTINGS.get("default_crop", "Strawberries"))
try:
    default_index = CROP_OPTIONS.index(saved_crop)
except:
    default_index = 0

# 2. Controls
selected_crop = st.sidebar.selectbox("Select Crop", CROP_OPTIONS, index=default_index)

# Location Selector
loc_mode = st.sidebar.radio("📍 Farm Location Mode", ["Preset", "Custom Search"])

if loc_mode == "Preset":
    selected_loc_name = st.sidebar.selectbox("Select Region", list(LOCATIONS.keys()), index=0)
    loc_data = LOCATIONS[selected_loc_name]
    selected_coords = (loc_data["lat"], loc_data["lon"])
else:
    city_query = st.sidebar.text_input("Enter City Name", "Paris")
    if city_query:
        lat, lon, name = get_coordinates_from_city(city_query)
        if lat:
            selected_coords = (lat, lon)
            selected_loc_name = name
            st.sidebar.success(f"Found: {name}")
        else:
            st.sidebar.error("City not found")
            first_loc = list(LOCATIONS.values())[0]
            selected_loc_name = list(LOCATIONS.keys())[0]
            selected_coords = (first_loc["lat"], first_loc["lon"])
    else:
        first_loc = list(LOCATIONS.values())[0]
        selected_loc_name = list(LOCATIONS.keys())[0]
        selected_coords = (first_loc["lat"], first_loc["lon"])

# 3. Auto-Save Settings
if selected_crop != saved_crop:
    set_user_pref("crop_type", selected_crop)
    # st.experimental_rerun() # Optional: Force refresh

app_crop_type = selected_crop # Alias

auto_refresh = st.sidebar.checkbox("Auto-refresh Data", value=False)

# Fetch Data (Real-time based on location) - MOVED UP for Virtual Sensor Logic
weather = fetch_weather_data(lat=selected_coords[0], lon=selected_coords[1])

st.sidebar.divider()
st.sidebar.subheader("🌡️ Indoor Environment")
st.sidebar.caption("Auto-estimated from outdoor weather (Virtual Sensor). Adjust if needed.")

# Virtual Sensor Logic: Estimate Indoor mostly based on Outdoor
# Greenhouse Effect: +10F during day, +5F at night (simplified to +8F avg)
# Transpiration: +10% higher humidity than outside
# Clamp values to valid range to prevent StreamlitValueBelowMinError
estimated_temp = max(32.0, min(120.0, weather['temperature'] + 8.0))
estimated_hum = max(10.0, min(100.0, weather['humidity'] + 10.0))

indoor_temp = st.sidebar.number_input("Indoor Temp (°F)", min_value=32.0, max_value=120.0, value=float(estimated_temp), step=0.5)
indoor_humidity = st.sidebar.number_input("Indoor Humidity (%)", min_value=10.0, max_value=100.0, value=float(estimated_hum), step=1.0)

indoor_weather = {
    "temperature": indoor_temp,
    "humidity": indoor_humidity,
    "rain": 0.0,  # Indoor, so no rain
    "wind_speed": 0.0 # Assume calm indoors
}

st.title(f"ForHuman AI: Smart Farm Monitor ({app_crop_type})")
st.caption("Powered by Google Gemini 3 • Open-Meteo Weather API")

from src.tabs.voice_log import render_voice_log

# --- TABS LAYOUT ---
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs(["📊 Dashboard", "📸 AI Crop Doctor", "🐛 Pest Forecast", "📈 Market Prices", "📑 Weekly Report", "🗣️ Voice Log"])

# --- TAB 1: DASHBOARD ---
with tab1:
    render_dashboard(weather, indoor_weather, selected_loc_name, app_crop_type)

# --- TAB 2: AI CROP DOCTOR (Scale AI Mode) ---
with tab2:
    render_ai_doctor()

# --- TAB 3: PEST FORECAST ---
with tab3:
    # Pass lat/lon for 7-day forecast
    render_pest_forecast(indoor_weather, app_crop_type, selected_coords[0], selected_coords[1])

# --- TAB 4: MARKET PRICES ---
with tab4:
    render_market_prices(app_crop_type)

# --- TAB 5: WEEKLY REPORT ---
with tab5:
    render_weekly_report(app_crop_type)

# --- TAB 6: VOICE LOG ---
with tab6:
    render_voice_log()
