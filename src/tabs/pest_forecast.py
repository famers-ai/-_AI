import streamlit as st
from src.data_handler import calculate_pest_risk

def render_pest_forecast(weather, crop_type):
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
