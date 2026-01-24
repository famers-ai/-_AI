import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
from src.data_handler import calculate_weekly_pest_risk, get_coordinates_from_city

# Mapping for simple icons/colors
RISK_COLOR_MAP = {
    "Low": "#2ed573",    # Green
    "Medium": "#ffa502", # Orange
    "High": "#ff4757",   # Red
    "Critical": "#ff4757" # Red
}

def render_pest_forecast(indoor_weather, crop_type, lat, lon):
    st.markdown("### 🧬 AI Pest & Disease Forecast (7-Days)")
    st.caption(f"Analyzing micro-climate trends for **{crop_type}** based on local weather predictions.")
    
    # 2. Calculate Real Forecast using passed coordinates
    df = calculate_weekly_pest_risk(lat, lon, crop_type)
    
    if df.empty:
        st.error("Could not fetch forecast data. Please check connection.")
        return

    # 3. Visualization (Risk Trend)
    # Create interactive chart
    fig = go.Figure()
    
    # Bar for Risk Score
    fig.add_trace(go.Bar(
        x=df['Date'], 
        y=df['Risk Score'],
        name='Infection Prob (%)',
        marker_color=df['Risk Score'].apply(lambda x: '#ff4757' if x > 70 else ('#ffa502' if x > 40 else '#2ed573'))
    ))
    
    # Line for Humidity (Secondary Driver)
    fig.add_trace(go.Scatter(
        x=df['Date'], 
        y=df['Humidity (%)'], 
        name='Humidity (%)',
        yaxis='y2',
        line=dict(color='#1e90ff', width=2, dash='dot')
    ))

    fig.update_layout(
        title="Predictive Disease Risk Index",
        yaxis=dict(title="Risk Probability (%)", range=[0, 100]),
        yaxis2=dict(title="Humidity (%)", overlaying='y', side='right', range=[0, 100]),
        template="plotly_white",
        height=350,
        margin=dict(l=20, r=20, t=40, b=20)
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    # 4. Critical Alerts (The "So What?")
    # Filter high risks
    high_risks = df[df['Risk Score'] >= 70]
    
    if not high_risks.empty:
        st.error(f"🚨 **CRITICAL WARNING**: High disease pressure detected in the coming days!")
        for index, row in high_risks.iterrows():
            date_str = row['Date']
            pest = row['Pest']
            condition = row['Condition']
            st.markdown(f"""
            - **{date_str}**: Risk of **{pest}**. 
              - *Condition*: {condition} (Rain: {row['Rain (in)']}in, Hum: {row['Humidity (%)']}%)
              - *Action*: Apply preventive fungicide 24hrs prior.
            """)
    else:
        st.success("✅ **Forecast Clear**: No significant disease outbreaks predicted for the next 7 days.")
        
    # 5. Strategic Advice Table
    with st.expander("See Daily Breakdown"):
        st.dataframe(
            df[['Date', 'Risk Score', 'Pest', 'Rain (in)', 'Temp (F)']].style.highlight_max(axis=0, subset=['Risk Score'], color='#ffcccc'),
            use_container_width=True
        )
