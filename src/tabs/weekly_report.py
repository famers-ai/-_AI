import streamlit as st
import time
from fpdf import FPDF
from src.ai_engine import generate_weekly_report
import src.db_handler as db_handler

def render_weekly_report(crop_type):
    st.subheader("📑 Weekly Farm Report")
    st.caption("AI-generated performance analysis based on standard data.")
    
    # Store report in session state to persist after button click
    if "weekly_report_text" not in st.session_state:
        st.session_state.weekly_report_text = ""
        
    st.markdown("### 📝 AI Agronomist Review")
    
    col_btn, col_down = st.columns([1, 1])
    
    with col_btn:
        if st.button("📑 Generate Report"):
            with st.spinner("Generating weekly summary..."):
                 st.session_state.weekly_report_text = generate_weekly_report(crop_type)
    
    report_text = st.session_state.weekly_report_text if st.session_state.weekly_report_text else "Click button to generate report."

    st.markdown(f"""
    <div class="ai-card">
        {report_text}
    </div>
    """, unsafe_allow_html=True)
    
    # PDF Generation Logic
    if st.session_state.weekly_report_text and st.session_state.weekly_report_text != "Click button to generate report.":
        with col_down:
            stats = db_handler.get_weekly_stats(crop_type) # Get raw stats for PDF header
            if not stats: stats = {"avg_temp": 0, "avg_moisture": 0, "data_points": 0}
            
            pdf_data = create_pdf_report(crop_type, report_text, stats)
            st.download_button(
                label="📥 Download PDF",
                data=pdf_data,
                file_name=f"Weekly_Farm_Report_{crop_type}.pdf",
                mime="application/pdf"
            )
    
    st.divider()
    st.info("ℹ️ Connect sensors to enable Safety Logs and precise Savings Calculation.")

    st.info("ℹ️ Connect sensors to enable Safety Logs and precise Savings Calculation.")

def sanitize_text(text):
    """
    Removes characters not supported by Latin-1 encoding (e.g. Emojis)
    to prevent PDF generation crashes with standard FPDF.
    """
    return text.encode('latin-1', 'ignore').decode('latin-1')

def create_pdf_report(crop_type, ai_text, stats):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    
    # Header
    pdf.set_font("Arial", "B", 16)
    pdf.cell(200, 10, txt=sanitize_text(f"Weekly Farm Report: {crop_type}"), ln=1, align="C")
    
    # Meta Info
    pdf.set_font("Arial", size=10)
    pdf.cell(200, 10, txt=sanitize_text(f"Generated: {time.strftime('%Y-%m-%d %H:%M')}"), ln=1, align="C")
    pdf.ln(10)
    
    # Stats Section
    pdf.set_font("Arial", "B", 12)
    pdf.cell(200, 10, txt="Key Metrics Summary", ln=1)
    pdf.set_font("Arial", size=11)
    pdf.cell(200, 8, txt=sanitize_text(f"- Avg Temp: {stats.get('avg_temp', 'N/A')} F"), ln=1)
    pdf.cell(200, 8, txt=sanitize_text(f"- Avg Moisture: {stats.get('avg_moisture', 'N/A')} %"), ln=1)
    pdf.cell(200, 8, txt=sanitize_text(f"- Data Points: {stats.get('data_points', 0)}"), ln=1)
    pdf.ln(10)
    
    # AI Report Section
    pdf.set_font("Arial", "B", 12)
    pdf.cell(200, 10, txt="AI Agronomist Insights", ln=1)
    pdf.set_font("Arial", size=11)
    
    # Simple markdown stripping for PDF (very basic)
    # Also sanitize the AI text which likely contains Emojis
    clean_text = ai_text.replace("**", "").replace("#", "")
    pdf.multi_cell(0, 8, txt=sanitize_text(clean_text))
    
    return pdf.output(dest="S").encode("latin-1", errors="replace")
