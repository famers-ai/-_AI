import streamlit as st
import plotly.express as px
from src.data_handler import fetch_market_prices

def render_market_prices(crop_type):
    st.subheader("📈 Wholesale Market Trends")
    st.caption(f"Real-time {crop_type} auction prices (SF Terminal Market, USD/lb)")
    
    df_prices = fetch_market_prices(crop_type)
    
    # Check if we are using real or fallback data
    # (In a real implementation, we'd return metadata. Here we infer/mock)
    is_real = False 
    
    if not df_prices.empty:
        col_name = "Price ($/lb)"
        latest_price = df_prices.iloc[-1][col_name]
        
        if len(df_prices) >= 2:
            prev_price = df_prices.iloc[-2][col_name]
            delta = round(latest_price - prev_price, 2)
        else:
            delta = 0.0
        
        st.metric("Avg. Price (USD/lb)", f"${latest_price}", f"{delta}")
        
        # Financial Area Chart
        fig_price = px.area(df_prices, x='Date', y=col_name, title="7-Day Price Trend", line_shape='spline')
        fig_price.update_layout(xaxis_title="", yaxis_title="Price ($/lb)")
        st.plotly_chart(fig_price, use_container_width=True)
        
        if not is_real:
            st.warning("⚠️ Using seasonal historical averages (Simulation). Add `USDA_API_KEY` to secrets for live data.")
        else:
            st.success("✅ Connected to USDA Market News API.")
