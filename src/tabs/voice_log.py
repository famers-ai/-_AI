import streamlit as st
import sqlite3
from datetime import datetime
import pandas as pd
from audio_recorder_streamlit import audio_recorder
from src.ai_engine import get_api_key
import google.generativeai as genai
import time

DB_NAME = "farm_data.db"

def init_voice_db():
    conn = sqlite3.connect(DB_NAME, timeout=30)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS voice_logs
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  timestamp TEXT, 
                  audio_summary TEXT,
                  action_taken TEXT,
                  category TEXT)''')
    conn.commit()
    conn.close()

def save_log(summary, action, category):
    conn = sqlite3.connect(DB_NAME, timeout=30)
    c = conn.cursor()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute("INSERT INTO voice_logs (timestamp, audio_summary, action_taken, category) VALUES (?, ?, ?, ?)",
              (timestamp, summary, action, category))
    conn.commit()
    conn.close()

def get_logs():
    conn = sqlite3.connect(DB_NAME, timeout=30)
    df = pd.read_sql_query("SELECT timestamp, category, action_taken, audio_summary FROM voice_logs ORDER BY timestamp DESC", conn)
    conn.close()
    return df

def process_audio_text(text):
    """
    Uses Gemini to extract structured data from raw transcribed text.
    In a real app, we would use Speech-to-Text API first. 
    Here we simulate STT or assume user provides text if audio fails.
    For this 'Voice Log' demo, we will accept Text Input as fallback 
    or use Gemini to process a mock transcription if we can't do real STT in browser easily without Keys.
    
    Actually, let's use Gemini Flash to structure the input.
    """
    api_key = get_api_key()
    if not api_key:
        return "N/A", "Please add Gemini Key", "Error"

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
        Extract farming action data from this log: "{text}"
        
        Output format (JSON-like):
        Category: [Pest Control / Irrigation / Harvest / Fertilizer]
        Action: [Short summary of what was done]
        """
        response = model.generate_content(prompt)
        content = response.text
        
        # Simple parsing (robust enough for demo)
        category = "General"
        action = text
        
        for line in content.split('\n'):
            if "Category:" in line:
                category = line.split(":", 1)[1].strip()
            if "Action:" in line:
                action = line.split(":", 1)[1].strip()
                
        return category, action
    except Exception as e:
        return "Error", f"AI Processing Failed: {e}"

def render_voice_log():
    st.subheader("🗣️ AI Voice Farming Log")
    st.caption("Don't type. Just say what you did today.")
    
    init_voice_db()
    
    # 1. Input Section
    col1, col2 = st.columns([1, 2])
    
    with col1:
        st.markdown("**Option A: Record**")
        audio_bytes = audio_recorder(text="", icon_size="2x")
        
    with col2:
        st.markdown("**Option B: Text Fallback**")
        text_input = st.text_input("Or type here...", placeholder="Ex: Sprayed pesticide on 3rd row for aphids")
        
    if audio_bytes:
        st.info("🎤 Audio recorded! (Transcribing feature requires Google STT key, using text fallback for demo)")
        # In full production, send audio_bytes to OpenAI Whisper or Google STT.
        # Here we simulate for the user to see the flow.
    
    if st.button("💾 Save Log") and (text_input or audio_bytes):
        # processing
        raw_text = text_input if text_input else "Audio Transcript Simulation: Sprayed antifungal on strawberries."
        
        with st.spinner("AI is organizing your log..."):
            cat, action = process_audio_text(raw_text)
            save_log(raw_text, action, cat)
            
        st.success("✅ Log Saved!")
        time.sleep(1)
        st.rerun()

    # 2. Display Logs
    st.divider()
    st.subheader("📋 Recent Activity")
    
    df = get_logs()
    if not df.empty:
        st.dataframe(df, use_container_width=True)
    else:
        st.info("No logs yet. Try recording one!")
