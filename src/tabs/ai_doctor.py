import streamlit as st
from PIL import Image
import plotly.express as px
from src.ai_engine import analyze_crop_image
import src.db_handler as db_handler

def render_ai_doctor():
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
            db_handler.save_labeled_data("img_001", "Correct", "AI_Prediction")
            st.success("Thank you! Your verified data has been saved to the training set.")
            st.balloons()
            
        if c_no.button("❌ No, Incorrect"):
            correct_label = st.text_input("What is the real disease?")
            if st.button("Submit Correction"):
                db_handler.save_labeled_data("img_001", "Incorrect", correct_label)
                st.info("Feedback received. We will re-train our model with your input.")

    # Show Community Stats
    st.divider()
    st.caption("📊 Community Data Contribution")
    stats_df = db_handler.get_training_data_stats()
    if not stats_df.empty:
        # Simple bar chart
        fig_stats = px.bar(stats_df, x='label', y='count', title="User Validations", color='label', color_discrete_map={"Correct": "#2ed573", "Incorrect": "#ff4757"})
        fig_stats.update_layout(height=250)
        st.plotly_chart(fig_stats, use_container_width=True)
