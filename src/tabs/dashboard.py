import streamlit as st
import time
from datetime import datetime
from src.ai_engine import analyze_situation
from src.data_handler import calculate_vpd
import src.db_handler as db_handler

def render_dashboard(weather, indoor_weather, selected_loc_name, crop_type):
    
    col_metrics, col_actions = st.columns([1.5, 1])

    with col_metrics:
        st.subheader(f"📍 Condition Overview")
        
        # 1. Indoor Environment (Crucial for Smart Farm)
        st.markdown(f"**🏠 Indoor Growth Environment** (Manual Input)")
        indoor_vpd = calculate_vpd(indoor_weather['temperature'], indoor_weather['humidity'])
        
        # Highlight Indoor VPD
        vpd_color = "#2ed573" # Green
        vpd_status = "Optimal"
        if indoor_vpd < 0.4: 
            vpd_color = "#ffa502" 
            vpd_status = "Too Humid (Risk: Fungal)"
        elif indoor_vpd > 1.6: 
            vpd_color = "#ff4757"
            vpd_status = "Too Dry (Risk: Mites)"

        st.markdown(f"""
        <div class="metric-card" style="border-left: 5px solid {vpd_color}; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="display:flex; justify-content:space-between;">
                <div>
                    <div class="metric-label">Indoor VPD</div>
                    <div class="metric-value">{indoor_vpd} kPa</div>
                    <small>{vpd_status}</small>
                </div>
                <div style="text-align:right;">
                    <div class="metric-label">Indoor Temp: {indoor_weather['temperature']}°F</div>
                    <div class="metric-label">Indoor Humidity: {indoor_weather['humidity']}%</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

        # 2. Outdoor Reference
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown(f"**🌤️ Outdoor Reference** ({selected_loc_name})")
        
        c1, c2, c3 = st.columns(3)
        with c1:
            st.metric("Outdoor Temp", f"{weather['temperature']}°F")
        with c2:
            st.metric("Outdoor Hum", f"{weather['humidity']}%")
        with c3:
            st.metric("Wind / Rain", f"{weather['wind_speed']} mph", f"{weather['rain']} in")
        
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("### 🌱 On-Site Sensors")
        
        # Real Hardware Not Connected - Show Placeholder instead of Fake Data
        st.info("⚠️ No physical sensors connected.")
        st.caption("To view real-time Soil Moisture & EC, please connect a compatible IoT device (Tuya/SmartThings).")
        
    with col_actions:
        st.subheader("🤖 AI Agronomist Action Plan")
        # AI On-Demand to save quota
        if st.button("🤖 Analyze Farm Conditions"):
            with st.spinner("Analyzing Indoor Environment..."):
                # AI should analyze INDOOR conditions for the crop, but knowing outdoor helps for advice (open vents etc)
                # We merge them for context
                full_context_weather = indoor_weather.copy()
                full_context_weather['outdoor_temp'] = weather['temperature']
                full_context_weather['outdoor_humidity'] = weather['humidity']
                
                insight = analyze_situation(full_context_weather, crop_type)
        else:
            insight = "Click the button to get AI insights."
        
        st.markdown(f"""
        <div class="ai-card">
            {insight}
            <hr>
            <small style="color: grey;">Updated: {time.strftime('%H:%M')}</small>
        </div>
        """, unsafe_allow_html=True)
