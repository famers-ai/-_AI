import streamlit as st
import pandas as pd
import plotly.express as px
import random
import time
from PIL import Image
from src.data_handler import fetch_weather_data, calculate_pest_risk, fetch_market_prices
from src.ai_engine import analyze_situation, analyze_crop_image, generate_weekly_report
from src.db_handler import init_db, get_user_pref, set_user_pref, save_labeled_data

# Initialize DB
init_db()

st.set_page_config(page_title="Mars AI", page_icon="🪐", layout="wide")

# --- CSS Styling for "Premium" Feel ---
st.markdown("""
<style>
    .stApp {
        background-color: #f8f9fa;
    }
    .metric-card {
        background-color: white;
        padding: 15px;
        border-radius: 12px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        border-left: 5px solid #2ed573;
    }
    .ai-card {
        background-color: #ffffff;
        padding: 25px;
        border-radius: 15px;
        border: 1px solid #dfe4ea;
        box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    }
    .status-badge {
        display: inline-block;
        padding: 5px 10px;
        border-radius: 15px;
        background: #eccc68;
        color: white;
        font-size: 12px;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

# --- Sidebar ---
st.sidebar.title("Mars AI")
st.sidebar.caption("Future Farming Solutions")

# 1. Load Saved Settings
saved_crop = get_user_pref("crop_type", "Strawberries")
crop_options = ["Strawberries", "Tomatoes", "Peppers"]
try:
    default_index = crop_options.index(saved_crop)
except:
    default_index = 0

# 2. Controls
selected_crop = st.sidebar.selectbox("Select Crop", crop_options, index=default_index)

# Location Selector (Legal Defense: Avoid "Misleading Data" liability)
LOCATIONS = {
    "California (US)": (36.7783, -119.4179),
    "New York (US)": (40.7128, -74.0060),
    "Seoul (KR)": (37.5665, 126.9780),
    "London (UK)": (51.5074, -0.1278),
    "Tokyo (JP)": (35.6762, 139.6503),
}
selected_loc_name = st.sidebar.selectbox("📍 Farm Location", list(LOCATIONS.keys()), index=0)
selected_coords = LOCATIONS[selected_loc_name]

# 3. Auto-Save Settings
if selected_crop != saved_crop:
    set_user_pref("crop_type", selected_crop)
    # Rerun to refresh data immediately not strictly needed as script runs top down, but good to know

crop_type = selected_crop # Alias
    
auto_refresh = st.sidebar.checkbox("Auto-refresh Data", value=True)
st.sidebar.divider()
st.sidebar.info(f"💾 Settings Saved: **{selected_crop}**")

# --- Legal & Disclaimer ---
with st.sidebar.expander("⚖️ Legal & Privacy", expanded=False):
    st.caption("""
    **Disclaimer:** Mars AI provides insights for reference only. It is not a substitute for professional agricultural advice. 
    We are not liable for crop loss or damages resulting from reliance on these results.
    
    **Data Privacy:** Uploaded images are analyzed by Google Gemini. Verification data helps improve the model.
    """)

# Fetch Data (Real-time based on location)
weather = fetch_weather_data(lat=selected_coords[0], lon=selected_coords[1])

st.title(f"Mars AI: Smart Farm Monitor ({crop_type})")
st.caption("Powered by Google Gemini 3 • Open-Meteo Weather API")

# --- TABS LAYOUT ---
tab1, tab2, tab3, tab4, tab5 = st.tabs(["📊 Dashboard", "📸 AI Crop Doctor", "🐛 Pest Forecast", "📈 Market Prices", "📑 Weekly Report"])

# --- TAB 1: DASHBOARD ---
with tab1:
    col_metrics, col_ai = st.columns([1.2, 1])

    with col_metrics:
        st.subheader(f"📍 Weather Station: {selected_loc_name}")
        
        # Custom HTML Metric Cards
        c1, c2 = st.columns(2)
        c3, c4 = st.columns(2)
        
        with c1:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">Temperature</div>
                <div class="metric-value">{weather['temperature']}°F</div>
            </div>
            """, unsafe_allow_html=True)
            
        with c2:
            st.markdown(f"""
            <div class="metric-card" style="border-left-color: #1e90ff;">
                <div class="metric-label">Humidity</div>
                <div class="metric-value">{weather['humidity']}%</div>
            </div>
            """, unsafe_allow_html=True)
            
        with c3:
            st.markdown(f"""<br>
            <div class="metric-card" style="border-left-color: #ffa502;">
                <div class="metric-label">Wind Speed</div>
                <div class="metric-value">{weather['wind_speed']} mph</div>
            </div>
            """, unsafe_allow_html=True)
            
        with c4:
            rain_color = "#ff4757" if weather['rain'] > 1.0 else "#2ed573"
            st.markdown(f"""<br>
            <div class="metric-card" style="border-left-color: {rain_color};">
                <div class="metric-label">Precipitation</div>
                <div class="metric-value">{weather['rain']} in</div>
            </div>
            """, unsafe_allow_html=True)
        
        st.divider()
        st.markdown("### 📡 On-Site Sensors")
        st.info("⚠️ No sensors connected.")
        st.caption("Connect a Tuya/SmartThings sensor to unlock: Real-time Soil Moisture & Auto-Irrigation Alerts.")
        st.button("🔗 Connect Sensor (Pro Feature)")

    with col_ai:
        st.subheader("🤖 AI Agronomist")
        with st.spinner("Analyzing environment..."):
            insight = analyze_situation(weather, crop_type)
        
        st.markdown(f"""
        <div class="ai-card">
            {insight}
            <hr>
            <small style="color: grey;">Updated: {time.strftime('%H:%M')}</small>
        </div>
        """, unsafe_allow_html=True)

# --- TAB 2: AI CROP DOCTOR (Scale AI Mode) ---
with tab2:
    st.subheader("📸 AI Crop Doctor (Beta)")
    st.write("Upload a photo of your crop. Our AI will diagnose it, and you verify it.")
    
    # Session State for Feedback Loop
    if 'diagnosis' not in st.session_state:
        st.session_state.diagnosis = None
    
    uploaded_file = st.file_uploader("Choose an image...", type=["jpg", "png", "jpeg"])
    
    if uploaded_file is not None:
        image = Image.open(uploaded_file)
        st.image(image, caption='Uploaded Crop Image', width=300)
        
        if st.button("🔍 Diagnose Now"):
            with st.spinner("Gemini Vision 3 is analyzing..."):
                st.session_state.diagnosis = analyze_crop_image(image)
    
    # Show Result & Collect Feedback
    if st.session_state.diagnosis:
        st.markdown(f"""
        <div class="ai-card">
            {st.session_state.diagnosis}
        </div>
        """, unsafe_allow_html=True)
        
        st.divider()
        st.write("### 👨‍🌾 Farmer Verification (Human-in-the-Loop)")
        st.write("Is this diagnosis correct? Your feedback improves the system.")
        
        c_yes, c_no = st.columns(2)
        if c_yes.button("✅ Yes, Correct"):
            save_labeled_data("img_001", "Correct", "AI_Prediction")
            st.success("Thank you! Your verified data has been saved to the training set.")
            st.balloons()
            
        if c_no.button("❌ No, Incorrect"):
            correct_label = st.text_input("What is the real disease?")
            if st.button("Submit Correction"):
                save_labeled_data("img_001", "Incorrect", correct_label)
                st.info("Feedback received. We will re-train our model with your input.")

# --- TAB 3: PEST FORECAST ---
with tab3:
    st.subheader("🐛 Pest Risk Radar")
    pest_data = calculate_pest_risk(weather, crop_type)
    
    # Styled Alert
    alert_color = "red" if pest_data['level'] == "High" else "orange" if pest_data['level'] == "Medium" else "green"
    
    st.markdown(f"""
    <div style="background-color: {alert_color}; padding: 15px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
        <h2 style="margin:0;">Risk Level: {pest_data['level']}</h2>
    </div>
    """, unsafe_allow_html=True)
    
    c1, c2 = st.columns(2)
    with c1:
        st.markdown(f"**Target Pest**: {pest_data['pest']}")
        st.progress(pest_data['prob'] / 100)
        st.caption(f"Probability: {pest_data['prob']}%")
    
    with c2:
        st.success("**Actionable Advice**" if pest_data['level'] == "Low" else "**Immediate Action Required**")
        st.write("Apply preventive organic pesticide." if pest_data['prob'] > 50 else "Monitor lower leaves for early signs.")

# --- TAB 4: MARKET PRICES ---
with tab4:
    st.subheader("📈 Wholesale Market Trends")
    st.caption(f"Real-time {crop_type} auction prices (USD/kg)")
    
    df_prices = fetch_market_prices(crop_type)
    
    latest_price = df_prices.iloc[0]['Price ($/kg)']
    delta = round(latest_price - df_prices.iloc[1]['Price ($/kg)'], 2)
    
    st.metric("Today's Avg. Price", f"${latest_price}", f"{delta}")
    
    # Financial Area Chart
    fig_price = px.area(df_prices, x='Date', y='Price ($/kg)', title="7-Day Price Trend", line_shape='spline')
    fig_price.update_layout(xaxis_title="", yaxis_title="Price ($)")
    st.plotly_chart(fig_price, use_container_width=True)

# Footer
st.markdown("---")
st.caption("Powered by Gemini 3 • Open-Meteo • Mars AI v1.1")

# --- TAB 5: WEEKLY REPORT ---
with tab5:
    st.subheader("📑 Weekly Farm Report")
    st.caption("AI-generated performance analysis based on standard data.")
    
    st.markdown("### 📝 AI Agronomist Review")
    with st.spinner("Generating weekly summary..."):
         report_text = generate_weekly_report(crop_type)
     
    st.markdown(f"""
    <div class="ai-card">
        {report_text}
    </div>
    """, unsafe_allow_html=True)
    
    st.divider()
    st.info("ℹ️ Connect sensors to enable Safety Logs and precise Savings Calculation.")
