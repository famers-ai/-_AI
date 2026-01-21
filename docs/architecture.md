# Smart Farm Resource Optimizer - Architecture

## Overview
This application is a minimalist dashboard for farmers to monitor real-time crop conditions and receive AI-driven actionable insights.

## Architecture Components

### 1. Data Layer (`src/data_handler.py`)
- **Open-Meteo API**: Fetches real-time weather data (Temperature, Humidity, Rain).
- **Synthetic Sensor Data**: Generates realistic soil moisture and leaf wetness data for Strawberries based on time of day and weather conditions.

### 2. Reasoning Engine (`src/ai_engine.py`)
- **Google Gemini API**: Analyzes the aggregated data context.
- **Prompt Engineering**: Uses a persona of an "Senior Agronomist" to provide specific, actionable advice (e.g., "Irrigate for 10 minutes").
- **Fallback**: Rule-based logic if API is unavailable.

### 3. Presentation Layer (`app.py`)
- **Streamlit**: Web framework for rendering the dashboard.
- **Plotly**: For interactive charts.
- **Responsiveness**: Layout adapts to mobile screens.

## Data Flow
1. User opens App.
2. App fetches Weather + Generates Sensor Data.
3. Data is passed to AI Engine.
4. AI Engine evaluates "Plant Stress" and "Efficiency".
5. App displays:
   - Live Metrics
   - AI Recommendations (Why? + What to do)
   - Cost Savings Estimation

## Tech Stack
- Python 3.9+
- Streamlit
- Pandas
- Google Generative AI (Gemini)
