import streamlit as st
import time
from src.ai_engine import analyze_situation

def render_dashboard(weather, selected_loc_name, crop_type):
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
        # AI On-Demand to save quota
        if st.button("🤖 Analyze Farm Conditions"):
            with st.spinner("Analyzing..."):
                insight = analyze_situation(weather, crop_type)
        else:
            insight = "Click the button to get AI insights."
        
        st.markdown(f"""
        <div class="ai-card">
            {insight}
            <hr>
            <small style="color: grey;">Updated: {time.strftime('%H:%M')}</small>
        </div>
        """, unsafe_allow_html=True)
