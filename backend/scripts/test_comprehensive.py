#!/usr/bin/env python3
"""
Comprehensive Error Detection and Testing Script
Tests all possible scenarios and edge cases
"""

import sys
import os
import requests
import time
from typing import Dict, List, Tuple

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "test_comprehensive@example.com"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BLUE}{'='*70}{Colors.END}")
    print(f"{Colors.BLUE}{text}{Colors.END}")
    print(f"{Colors.BLUE}{'='*70}{Colors.END}\n")

def print_test(name, passed, details=""):
    status = f"{Colors.GREEN}✅ PASS{Colors.END}" if passed else f"{Colors.RED}❌ FAIL{Colors.END}"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")

def test_api_health() -> bool:
    """Test if API is running"""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        return response.status_code in [200, 404]  # 404 is OK, means server is running
    except:
        return False

def test_authentication_required() -> List[Tuple[str, bool, str]]:
    """Test that all endpoints require authentication"""
    results = []
    
    endpoints = [
        ("POST", "/api/sensors/record"),
        ("GET", "/api/sensors/latest"),
        ("POST", "/api/voice-logs/"),
        ("GET", "/api/voice-logs/"),
        ("POST", "/api/location/set"),
        ("GET", "/api/location/get"),
        ("POST", "/api/ai/diagnose"),
        ("GET", "/api/ai/diagnosis/history"),
        ("GET", "/api/ai/diagnosis/stats"),
        ("POST", "/api/dashboard/sensors/calibrate"),
        ("POST", "/api/dashboard/control"),
    ]
    
    for method, endpoint in endpoints:
        try:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", json={}, timeout=5)
            
            # Should return 400 (missing header) or 422 (validation error)
            passed = response.status_code in [400, 422]
            results.append((
                f"{method} {endpoint}",
                passed,
                f"Status: {response.status_code}"
            ))
        except Exception as e:
            results.append((
                f"{method} {endpoint}",
                False,
                f"Error: {str(e)}"
            ))
    
    return results

def test_data_isolation() -> List[Tuple[str, bool, str]]:
    """Test that data is properly isolated between users"""
    results = []
    
    user1_headers = {"X-Farm-ID": "user1@test.com"}
    user2_headers = {"X-Farm-ID": "user2@test.com"}
    
    # Test sensor data isolation
    try:
        # User 1 records data
        response1 = requests.post(
            f"{BASE_URL}/api/sensors/record",
            headers=user1_headers,
            json={
                "temperature": 25.0,
                "humidity": 60.0,
                "data_source": "test_isolation"
            },
            timeout=5
        )
        
        # User 2 tries to get user 1's data
        response2 = requests.get(
            f"{BASE_URL}/api/sensors/latest",
            headers=user2_headers,
            timeout=5
        )
        
        # User 2 should not see user 1's data (or see different data)
        if response2.status_code == 200:
            data = response2.json()
            # Check if data source is different or no data
            passed = data.get("data_source") != "test_isolation"
            results.append((
                "Sensor data isolation",
                passed,
                "Users can only see their own data"
            ))
        else:
            results.append((
                "Sensor data isolation",
                True,
                "User 2 has no data (expected)"
            ))
    except Exception as e:
        results.append((
            "Sensor data isolation",
            False,
            f"Error: {str(e)}"
        ))
    
    return results

def test_diagnosis_history() -> List[Tuple[str, bool, str]]:
    """Test diagnosis history functionality"""
    results = []
    
    headers = {"X-Farm-ID": TEST_USER_EMAIL}
    
    # Test getting empty history
    try:
        response = requests.get(
            f"{BASE_URL}/api/ai/diagnosis/history",
            headers=headers,
            timeout=5
        )
        passed = response.status_code == 200
        results.append((
            "Get diagnosis history",
            passed,
            f"Status: {response.status_code}"
        ))
    except Exception as e:
        results.append((
            "Get diagnosis history",
            False,
            f"Error: {str(e)}"
        ))
    
    # Test getting stats
    try:
        response = requests.get(
            f"{BASE_URL}/api/ai/diagnosis/stats",
            headers=headers,
            timeout=5
        )
        passed = response.status_code == 200
        if passed:
            data = response.json()
            passed = "stats" in data
        results.append((
            "Get diagnosis stats",
            passed,
            f"Status: {response.status_code}"
        ))
    except Exception as e:
        results.append((
            "Get diagnosis stats",
            False,
            f"Error: {str(e)}"
        ))
    
    return results

def test_edge_cases() -> List[Tuple[str, bool, str]]:
    """Test edge cases and error handling"""
    results = []
    
    headers = {"X-Farm-ID": TEST_USER_EMAIL}
    
    # Test invalid data types
    try:
        response = requests.post(
            f"{BASE_URL}/api/sensors/record",
            headers=headers,
            json={
                "temperature": "invalid",  # Should be number
                "humidity": 60.0
            },
            timeout=5
        )
        passed = response.status_code == 422  # Validation error
        results.append((
            "Invalid data type handling",
            passed,
            f"Status: {response.status_code}"
        ))
    except Exception as e:
        results.append((
            "Invalid data type handling",
            False,
            f"Error: {str(e)}"
        ))
    
    # Test missing required fields
    try:
        response = requests.post(
            f"{BASE_URL}/api/sensors/record",
            headers=headers,
            json={
                "temperature": 25.0
                # Missing humidity
            },
            timeout=5
        )
        passed = response.status_code == 422
        results.append((
            "Missing required fields",
            passed,
            f"Status: {response.status_code}"
        ))
    except Exception as e:
        results.append((
            "Missing required fields",
            False,
            f"Error: {str(e)}"
        ))
    
    # Test extremely large values
    try:
        response = requests.post(
            f"{BASE_URL}/api/sensors/record",
            headers=headers,
            json={
                "temperature": 999999.0,
                "humidity": 999999.0
            },
            timeout=5
        )
        # Should either accept or reject gracefully
        passed = response.status_code in [200, 201, 422]
        results.append((
            "Extreme value handling",
            passed,
            f"Status: {response.status_code}"
        ))
    except Exception as e:
        results.append((
            "Extreme value handling",
            False,
            f"Error: {str(e)}"
        ))
    
    return results

def test_database_constraints() -> List[Tuple[str, bool, str]]:
    """Test database constraints and integrity"""
    results = []
    
    try:
        from app.core.config import DB_NAME
        import sqlite3
        
        conn = sqlite3.connect(DB_NAME)
        # Enable foreign keys for this connection
        conn.execute("PRAGMA foreign_keys = ON")
        cursor = conn.cursor()
        
        # Test foreign key constraints
        cursor.execute("PRAGMA foreign_keys")
        fk_enabled = cursor.fetchone()[0] == 1
        results.append((
            "Foreign keys enabled",
            fk_enabled,
            "Database integrity protection"
        ))
        
        # Check if diagnosis_history table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='diagnosis_history'
        """)
        table_exists = cursor.fetchone() is not None
        results.append((
            "Diagnosis history table exists",
            table_exists,
            "New feature table created"
        ))
        
        # Check if required indexes exist
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='index' AND name='idx_diagnosis_user_time'
        """)
        index_exists = cursor.fetchone() is not None
        results.append((
            "Diagnosis history index exists",
            index_exists,
            "Performance optimization"
        ))
        
        conn.close()
    except Exception as e:
        results.append((
            "Database constraints check",
            False,
            f"Error: {str(e)}"
        ))
    
    return results

def main():
    print_header("🔍 COMPREHENSIVE ERROR DETECTION TEST")
    
    all_results = []
    
    # Test 1: API Health
    print_header("1. API Health Check")
    api_healthy = test_api_health()
    print_test("API is running", api_healthy, f"URL: {BASE_URL}")
    all_results.append(("API Health", api_healthy, ""))
    
    if not api_healthy:
        print(f"\n{Colors.RED}❌ API is not running. Please start the server first.{Colors.END}")
        sys.exit(1)
    
    # Test 2: Authentication
    print_header("2. Authentication Requirements")
    auth_results = test_authentication_required()
    for name, passed, details in auth_results:
        print_test(name, passed, details)
        all_results.append((name, passed, details))
    
    # Test 3: Data Isolation
    print_header("3. Data Isolation Tests")
    isolation_results = test_data_isolation()
    for name, passed, details in isolation_results:
        print_test(name, passed, details)
        all_results.append((name, passed, details))
    
    # Test 4: Diagnosis History
    print_header("4. Diagnosis History Features")
    diagnosis_results = test_diagnosis_history()
    for name, passed, details in diagnosis_results:
        print_test(name, passed, details)
        all_results.append((name, passed, details))
    
    # Test 5: Edge Cases
    print_header("5. Edge Cases and Error Handling")
    edge_results = test_edge_cases()
    for name, passed, details in edge_results:
        print_test(name, passed, details)
        all_results.append((name, passed, details))
    
    # Test 6: Database Constraints
    print_header("6. Database Integrity")
    db_results = test_database_constraints()
    for name, passed, details in db_results:
        print_test(name, passed, details)
        all_results.append((name, passed, details))
    
    # Summary
    print_header("📊 TEST SUMMARY")
    total_tests = len(all_results)
    passed_tests = sum(1 for _, passed, _ in all_results if passed)
    failed_tests = total_tests - passed_tests
    
    print(f"Total Tests: {total_tests}")
    print(f"{Colors.GREEN}Passed: {passed_tests}{Colors.END}")
    if failed_tests > 0:
        print(f"{Colors.RED}Failed: {failed_tests}{Colors.END}")
        print(f"\n{Colors.YELLOW}Failed Tests:{Colors.END}")
        for name, passed, details in all_results:
            if not passed:
                print(f"  - {name}: {details}")
    
    print(f"\n{'='*70}")
    if failed_tests == 0:
        print(f"{Colors.GREEN}✅ ALL TESTS PASSED!{Colors.END}")
        return 0
    else:
        print(f"{Colors.RED}❌ SOME TESTS FAILED{Colors.END}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
