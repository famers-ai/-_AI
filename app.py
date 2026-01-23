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
    }

    /* Hide Streamlit Branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .stDeployButton {display:none;}
    
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
    
    /* Remove padding at top */
    .block-container {
        padding-top: 2rem;
        padding-bottom: 2rem;
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
st.sidebar.divider()
st.sidebar.info(f"💾 Settings Saved: **{selected_crop}**")

# --- Legal & Disclaimer ---
with st.sidebar.expander("⚖️ Legal & Privacy", expanded=False):
    st.caption("""
    **Disclaimer:** ForHuman AI provides insights for reference only. It is not a substitute for professional agricultural advice. 
    We are not liable for crop loss or damages resulting from reliance on these results.
    
    **Data Privacy:** Uploaded images are analyzed by Google Gemini. Verification data helps improve the model.
    """)

# Fetch Data (Real-time based on location)
weather = fetch_weather_data(lat=selected_coords[0], lon=selected_coords[1])

st.title(f"ForHuman AI: Smart Farm Monitor ({app_crop_type})")
st.caption("Powered by Google Gemini 3 • Open-Meteo Weather API")

# --- TABS LAYOUT ---
tab1, tab2, tab3, tab4, tab5 = st.tabs(["📊 Dashboard", "📸 AI Crop Doctor", "🐛 Pest Forecast", "📈 Market Prices", "📑 Weekly Report"])

# --- TAB 1: DASHBOARD ---
with tab1:
    render_dashboard(weather, selected_loc_name, app_crop_type)

# --- TAB 2: AI CROP DOCTOR (Scale AI Mode) ---
with tab2:
    render_ai_doctor()

# --- TAB 3: PEST FORECAST ---
with tab3:
    render_pest_forecast(weather, app_crop_type)

# --- TAB 4: MARKET PRICES ---
with tab4:
    render_market_prices(app_crop_type)

# --- TAB 5: WEEKLY REPORT ---
with tab5:
    render_weekly_report(app_crop_type)
