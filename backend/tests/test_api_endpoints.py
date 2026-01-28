from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import app carefully
try:
    from app.main import app
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

client = TestClient(app)

def print_pass(msg):
    print(f"✅ PASS: {msg}")

def print_fail(msg):
    print(f"❌ FAIL: {msg}")

def test_sensor_lifecycle():
    print("\n--- Testing Sensor API Lifecycle (Create -> Update -> Delete) ---")
    
    # 1. Record Data
    payload = {
        "temperature": 72.5,
        "humidity": 45.0,
        "soil_moisture": 30.0,
        "data_source": "manual",
        "notes": "Integration Test"
    }
    
    try:
        response = client.post("/api/sensors/record", json=payload)
        if response.status_code != 200:
            print_fail(f"Create failed: {response.text}")
            return
            
        data = response.json()
        reading_id = data["reading_id"]
        print_pass(f"Created Reading ID: {reading_id}")
        
    except Exception as e:
        print_fail(f"Request Error: {e}")
        return

    # 2. Update Data (PUT)
    update_payload = {
        "temperature": 99.9, # Extreme value to easily verify
        "humidity": 50.0,
        "soil_moisture": 35.0, # Changed
        "data_source": "manual_edit",
        "notes": "Edited via API"
    }
    
    response = client.put(f"/api/sensors/reading/{reading_id}", json=update_payload)
    if response.status_code == 200:
        print_pass(f"Updated Reading ID: {reading_id}")
        print(f"   Response: {response.json()}")
    else:
        print_fail(f"Update failed: {response.status_code} - {response.text}")

    # 3. Verification (Get Latest)
    response = client.get("/api/sensors/latest")
    if response.status_code == 200:
        latest = response.json()
        if latest['temperature'] == 99.9 and latest['notes'] == 'Edited via API':
            print_pass("Verification Successful: Values match update")
        else:
            print_fail(f"Verification Mismatch: Got {latest['temperature']}")
    
    # 4. Delete Data
    response = client.delete(f"/api/sensors/delete/{reading_id}")
    if response.status_code == 200:
        print_pass("Deleted Reading")
    else:
        print_fail("Delete failed")

def test_user_terms_api():
    print("\n--- Testing User Terms API ---")
    # 1. Agree
    response = client.post("/api/users/me/terms", json={"agreed": True})
    if response.status_code == 200:
        print_pass("Terms Agreed API Success")
    else:
        print_fail(f"Terms Agree Failed: {response.text}")
        
    # 2. Check Profile
    response = client.get("/api/users/me")
    if response.status_code == 200:
        profile = response.json()
        if profile.get('is_terms_agreed') == 1:
            print_pass("Profile confirms agreement")
        else:
            print_fail(f"Profile mismatch: {profile}")

if __name__ == "__main__":
    test_sensor_lifecycle()
    test_user_terms_api()
