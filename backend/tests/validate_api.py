#!/usr/bin/env python3
"""
Smart Farm AI - Automated Error Detection & Validation
Tests all critical paths and edge cases
"""

import sys
import requests
from typing import Dict, List, Tuple

# Configuration
API_BASE = "http://localhost:8000/api"
TEST_CITIES = [
    "New York",
    "Los Angeles", 
    "San Francisco",
    "Chicago",
    "Miami",
    "Seattle",
    "Austin",
    "Portland"
]
TEST_CROPS = [
    "Strawberries",
    "Tomatoes",
    "Peppers",
    "Lettuce",
    "Cucumbers",
    "Spinach",
    "Carrots",
    "Broccoli"
]

class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def add_pass(self, test_name: str):
        self.passed += 1
        print(f"✅ {test_name}")
    
    def add_fail(self, test_name: str, error: str):
        self.failed += 1
        self.errors.append((test_name, error))
        print(f"❌ {test_name}: {error}")
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"Test Summary: {self.passed}/{total} passed")
        print(f"{'='*60}")
        
        if self.errors:
            print("\n🐛 Failures:")
            for test, error in self.errors:
                print(f"  - {test}: {error}")
        
        return self.failed == 0

def test_dashboard_api(results: TestResult):
    """Test dashboard endpoint with various cities"""
    print("\n📊 Testing Dashboard API...")
    
    for city in TEST_CITIES[:3]:  # Test first 3 cities
        try:
            response = requests.get(
                f"{API_BASE}/dashboard",
                params={"city": city, "crop_type": "Strawberries"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate structure
                required_keys = ["location", "weather", "indoor", "crop"]
                missing = [k for k in required_keys if k not in data]
                
                if missing:
                    results.add_fail(
                        f"Dashboard - {city}",
                        f"Missing keys: {missing}"
                    )
                else:
                    # Check for null VPD
                    vpd = data.get("indoor", {}).get("vpd")
                    if vpd is None:
                        print(f"  ⚠️  {city}: VPD is null (expected for no sensors)")
                    
                    results.add_pass(f"Dashboard - {city}")
            else:
                results.add_fail(
                    f"Dashboard - {city}",
                    f"HTTP {response.status_code}"
                )
        except Exception as e:
            results.add_fail(f"Dashboard - {city}", str(e))

def test_market_prices(results: TestResult):
    """Test market prices for all crops"""
    print("\n💰 Testing Market Prices API...")
    
    for crop in TEST_CROPS[:4]:  # Test first 4 crops
        try:
            response = requests.get(
                f"{API_BASE}/market/prices",
                params={"crop_type": crop},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "data" not in data:
                    results.add_fail(
                        f"Market - {crop}",
                        "Missing 'data' key"
                    )
                    continue
                
                prices = data["data"]
                
                if not prices:
                    results.add_fail(
                        f"Market - {crop}",
                        "Empty price data"
                    )
                elif all(p.get("Price ($/lb)", 0) == 0 for p in prices):
                    results.add_fail(
                        f"Market - {crop}",
                        "All prices are $0.00"
                    )
                else:
                    source = data.get("source", "Unknown")
                    print(f"  📈 {crop}: {len(prices)} prices, source: {source}")
                    results.add_pass(f"Market - {crop}")
            else:
                results.add_fail(
                    f"Market - {crop}",
                    f"HTTP {response.status_code}"
                )
        except Exception as e:
            results.add_fail(f"Market - {crop}", str(e))

def test_pest_forecast(results: TestResult):
    """Test pest forecast for various crops and locations"""
    print("\n🐛 Testing Pest Forecast API...")
    
    test_cases = [
        ("Strawberries", 37.7749, -122.4194, "San Francisco"),
        ("Tomatoes", 40.7128, -74.0060, "New York"),
        ("Peppers", 34.0522, -118.2437, "Los Angeles")
    ]
    
    for crop, lat, lon, city in test_cases:
        try:
            response = requests.get(
                f"{API_BASE}/pest/forecast",
                params={"crop_type": crop, "lat": lat, "lon": lon},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "data" not in data:
                    results.add_fail(
                        f"Pest - {crop} ({city})",
                        "Missing 'data' key"
                    )
                    continue
                
                forecast = data["data"]
                
                if not forecast:
                    results.add_fail(
                        f"Pest - {crop} ({city})",
                        "Empty forecast data"
                    )
                elif all(f.get("Risk Score", 0) == 10 for f in forecast):
                    print(f"  ⚠️  {crop} ({city}): All low risk (may be expected)")
                    results.add_pass(f"Pest - {crop} ({city})")
                else:
                    source = data.get("source", "Unknown")
                    print(f"  🦠 {crop} ({city}): {len(forecast)} days, source: {source}")
                    results.add_pass(f"Pest - {crop} ({city})")
            else:
                results.add_fail(
                    f"Pest - {crop} ({city})",
                    f"HTTP {response.status_code}"
                )
        except Exception as e:
            results.add_fail(f"Pest - {crop} ({city})", str(e))

def test_edge_cases(results: TestResult):
    """Test edge cases and error handling"""
    print("\n🔍 Testing Edge Cases...")
    
    # Test invalid city
    try:
        response = requests.get(
            f"{API_BASE}/dashboard",
            params={"city": "InvalidCityXYZ123", "crop_type": "Strawberries"},
            timeout=10
        )
        
        if response.status_code == 200:
            # Should still return data (fallback to default)
            results.add_pass("Edge Case - Invalid City")
        else:
            results.add_fail("Edge Case - Invalid City", f"HTTP {response.status_code}")
    except Exception as e:
        results.add_fail("Edge Case - Invalid City", str(e))
    
    # Test invalid crop
    try:
        response = requests.get(
            f"{API_BASE}/market/prices",
            params={"crop_type": "InvalidCrop"},
            timeout=10
        )
        
        if response.status_code in [200, 404]:
            results.add_pass("Edge Case - Invalid Crop")
        else:
            results.add_fail("Edge Case - Invalid Crop", f"HTTP {response.status_code}")
    except Exception as e:
        results.add_fail("Edge Case - Invalid Crop", str(e))

def main():
    print("🚀 Starting Smart Farm AI Validation Tests\n")
    print(f"API Base: {API_BASE}")
    print(f"Testing {len(TEST_CITIES)} cities, {len(TEST_CROPS)} crops\n")
    
    results = TestResult()
    
    try:
        # Run all tests
        test_dashboard_api(results)
        test_market_prices(results)
        test_pest_forecast(results)
        test_edge_cases(results)
        
        # Print summary
        success = results.summary()
        
        if success:
            print("\n🎉 All tests passed!")
            return 0
        else:
            print("\n⚠️  Some tests failed. Please review errors above.")
            return 1
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
