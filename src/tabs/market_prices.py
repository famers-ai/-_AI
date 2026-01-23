import streamlit as st
import plotly.express as px
from src.data_handler import fetch_market_prices

def render_market_prices(crop_type):
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
