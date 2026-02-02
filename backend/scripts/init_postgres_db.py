#!/usr/bin/env python3
"""
PostgreSQL Database Initialization Script
Creates all tables and adds sample data for testing
"""

import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import init_db, SessionLocal, User

def main():
    print("🔄 Initializing PostgreSQL database...")
    
    try:
        # Create all tables
        init_db()
        
        # Create a session
        db = SessionLocal()
        
        try:
            # Check if test user already exists
            existing_user = db.query(User).filter(User.email == "test@forhumanai.net").first()
            
            if not existing_user:
                # Create sample user
                test_user = User(
                    id="test_user_001",
                    email="test@forhumanai.net",
                    name="Test User",
                    crop_type="Strawberries",
                    farm_size=2.5,
                    location="Seoul, South Korea",
                    latitude=37.5665,
                    longitude=126.9780,
                    created_at=datetime.utcnow()
                )
                db.add(test_user)
                db.commit()
                print("✅ Sample user created: test@forhumanai.net")
            else:
                print("ℹ️  Sample user already exists")
            
            # Verify tables
            user_count = db.query(User).count()
            print(f"\n📊 Database Statistics:")
            print(f"   - Users: {user_count} records")
            
            print("\n✅ PostgreSQL database initialization complete!")
            print(f"   Database: Connected successfully")
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"\n❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
