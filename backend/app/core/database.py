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
