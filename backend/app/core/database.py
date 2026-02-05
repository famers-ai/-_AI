from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# Database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String)
    crop_type = Column(String)
    farm_size = Column(Float)
    location = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    temperature = Column(Float)
    humidity = Column(Float)
    soil_moisture = Column(Float)
    light_level = Column(Float)
    ph_level = Column(Float)

class PestIncident(Base):
    __tablename__ = "pest_incidents"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    pest_type = Column(String)
    severity = Column(String)
    location = Column(String)
    image_path = Column(String)
    notes = Column(Text)

class CropDiagnosis(Base):
    __tablename__ = "crop_diagnoses"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    diagnosis = Column(Text)
    confidence = Column(Float)
    recommendations = Column(Text)
    image_path = Column(String)

class VoiceLog(Base):
    __tablename__ = "voice_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    transcription = Column(Text)
    audio_path = Column(String)
    analysis = Column(Text)

class MarketPriceCache(Base):
    __tablename__ = "market_price_cache"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    crop_type = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    price_data = Column(Text)
    source = Column(String)

class PestForecast(Base):
    __tablename__ = "pest_forecasts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    location = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    pest_type = Column(String)
    risk_level = Column(String)
    forecast_data = Column(Text)

class UserPreference(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, unique=True, nullable=False)
    notifications_enabled = Column(Boolean, default=True)
    language = Column(String, default="en")
    timezone = Column(String)
    preferences_json = Column(Text)

class DataReminder(Base):
    __tablename__ = "data_reminders"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    reminder_type = Column(String)
    scheduled_time = Column(DateTime)
    message = Column(Text)
    is_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# --- New Models for Sensorless AI Learning Loop ---

class ExternalWeatherLog(Base):
    """Stores external weather conditions from OpenWeatherMap API"""
    __tablename__ = "external_weather_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    location = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    temp_out = Column(Float)  # External Temperature
    humi_out = Column(Float)  # External Humidity
    condition = Column(String) # Weather condition (e.g., "Clear", "Rain")
    wind_speed = Column(Float)

class VirtualEnvironmentLog(Base):
    """Stores AI-predicted internal environmental data"""
    __tablename__ = "virtual_environment_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    predicted_temp = Column(Float)
    predicted_humi = Column(Float)
    predicted_vpd = Column(Float)
    model_version = Column(String, default="v1.0") # To track model performance over time

class RealityFeedbackLog(Base):
    """
    Stores 'Ground Truth' feedback from users.
    This is the most critical data for training the AI.
    Types:
    - EXACT: User measured with a thermometer (e.g., "It's 24.0°C")
    - SENSORY: User's feeling (e.g., "Feels Hot", "Feels Dry")
    - OBSERVATION: Plant obs (e.g., "Leaves wilting")
    """
    __tablename__ = "reality_feedback_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    feedback_type = Column(String, nullable=False) # EXACT, SENSORY, OBSERVATION
    feedback_value = Column(String, nullable=False) # "24.5", "HOT", "WILTING"
    ai_prediction_ref_id = Column(Integer) # Optional link to what AI predicted at that time

class FarmPhysicsProfile(Base):
    """
    Stores the learned physical characteristics of a specific farm.
    AI updates these parameters based on RealityFeedbackLog.
    """
    __tablename__ = "farm_physics_profiles"
    
    user_id = Column(String, primary_key=True) # One profile per user
    insulation_score = Column(Float, default=0.5) # 0.0 (Tent) ~ 1.0 (Bunker)
    moisture_retention = Column(Float, default=0.5) # How long humidity stays
    thermal_lag = Column(Float, default=1.0) # Hours delay for temp changes
    last_updated = Column(DateTime, default=datetime.utcnow)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize database tables
def init_db():
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")
