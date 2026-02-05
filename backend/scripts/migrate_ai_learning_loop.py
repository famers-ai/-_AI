#!/usr/bin/env python3
"""
Database Migration Script for AI Learning Loop
Creates new tables for the Sensorless Smart Farm system

New Tables:
- external_weather_logs: Stores weather data from OpenWeatherMap
- virtual_environment_logs: Stores AI predictions
- reality_feedback_logs: Stores user feedback (Ground Truth)
- farm_physics_profiles: Stores learned farm characteristics

Run this script to initialize the new database schema.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import (
    engine, 
    Base,
    ExternalWeatherLog,
    VirtualEnvironmentLog,
    RealityFeedbackLog,
    FarmPhysicsProfile
)

def migrate_database():
    """Create new tables for AI learning loop"""
    print("🔄 Starting database migration...")
    print("=" * 60)
    
    try:
        # Create all tables (will only create new ones, existing tables are safe)
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database migration completed successfully!")
        print("\nNew tables created:")
        print("  - external_weather_logs")
        print("  - virtual_environment_logs")
        print("  - reality_feedback_logs")
        print("  - farm_physics_profiles")
        print("\n" + "=" * 60)
        print("🎉 AI Learning Loop is now ready!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate_database()
