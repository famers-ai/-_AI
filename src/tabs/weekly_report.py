import streamlit as st
from src.ai_engine import generate_weekly_report

def render_weekly_report(crop_type):
    st.subheader("📑 Weekly Farm Report")
    st.caption("AI-generated performance analysis based on standard data.")
    
    st.markdown("### 📝 AI Agronomist Review")
    if st.button("📑 Generate Report"):
        with st.spinner("Generating weekly summary..."):
             report_text = generate_weekly_report(crop_type)
    else:
        report_text = "Click button to generate report."
     
    st.markdown(f"""
    <div class="ai-card">
        {report_text}
    </div>
    """, unsafe_allow_html=True)
    
    st.divider()
    st.info("ℹ️ Connect sensors to enable Safety Logs and precise Savings Calculation.")
