# import pytest (Removed)
from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)

def test_dashboard_real_data_empty_state():
    """
    Verify that the dashboard returns specific 'No Data' indicators when no sensor data exists,
    instead of generating simulated/virtual data.
    """
    # Use a user_id that definitely has no data
    response = client.get("/api/dashboard?city=San%20Francisco&user_id=non_existent_user_999")
    
    if response.status_code != 200:
        print(f"Server Error Output: {response.text}")
    assert response.status_code == 200
    data = response.json()
    
    # 1. Weather should be real (not None, assuming External API works or Mocked to work)
    # Note: If External API fails, it might return None, which is also valid for "Real Data Only" policy
    # But here we focus on INDOOR data specifically.
    
    # 2. Indoor data MUST be null/empty, NOT random numbers
    indoor = data["indoor"]
    print(f"Indoor Data Response: {indoor}")
    
    assert indoor["temperature"] is None, "Temperature should be None for new user, not simulated"
    assert indoor["humidity"] is None, "Humidity should be None for new user, not simulated"
    assert indoor["vpd"] is None, "VPD should be None for new user, not simulated"
    assert indoor["vpd_status"] == "No Data - Please Record" or indoor["vpd_status"] == "No Data"
    
    print("✅ Dashboard Real Data Compliance Test Passed: No virtual data generated.")

if __name__ == "__main__":
    test_dashboard_real_data_empty_state()
