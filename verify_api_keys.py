#!/usr/bin/env python3
"""
Smart Farm AI - API Key Verification Script
Tests if API keys are properly configured and working
"""

import os
import sys
from dotenv import load_dotenv

def check_env_file():
    """Check if .env file exists"""
    if os.path.exists('.env'):
        print("✅ .env file found")
        return True
    else:
        print("❌ .env file not found")
        print("   Run: cp .env.example .env")
        return False

def check_api_keys():
    """Check if API keys are configured"""
    load_dotenv()
    
    results = {
        'GEMINI_API_KEY': os.getenv('GEMINI_API_KEY'),
        'OPENWEATHER_API_KEY': os.getenv('OPENWEATHER_API_KEY'),
    }
    
    print("\n📋 Environment Variables Status:")
    print("-" * 50)
    
    all_configured = True
    for key, value in results.items():
        if value and value != f"your_{key.lower()}_here":
            # Mask the key for security
            masked = value[:8] + "..." + value[-4:] if len(value) > 12 else "***"
            print(f"✅ {key}: {masked}")
        else:
            print(f"❌ {key}: Not configured")
            all_configured = False
    
    return all_configured, results

def test_gemini_api(api_key):
    """Test Gemini API connection"""
    if not api_key or api_key.startswith("your_"):
        print("\n⚠️  Skipping Gemini API test (key not configured)")
        return False
    
    print("\n🧪 Testing Gemini API connection...")
    try:
        import google.generativeai as genai
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')  # Updated to latest model
        
        # Simple test prompt
        response = model.generate_content("Say 'API connection successful' in one sentence.")
        
        if response and response.text:
            print("✅ Gemini API connection successful!")
            print(f"   Response: {response.text[:100]}")
            return True
        else:
            print("❌ Gemini API returned empty response")
            return False
            
    except ImportError:
        print("❌ google-generativeai package not installed")
        print("   Run: pip install google-generativeai")
        return False
    except Exception as e:
        print(f"❌ Gemini API test failed: {str(e)}")
        return False

def test_openweather_api(api_key):
    """Test OpenWeather API connection"""
    if not api_key or api_key.startswith("your_"):
        print("\n⚠️  Skipping OpenWeather API test (key not configured)")
        return False
    
    print("\n🧪 Testing OpenWeather API connection...")
    try:
        import requests
        
        # Test with New York coordinates
        url = f"https://api.openweathermap.org/data/2.5/weather?lat=40.7128&lon=-74.0060&appid={api_key}&units=imperial"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ OpenWeather API connection successful!")
            print(f"   Test location: {data.get('name', 'Unknown')}")
            print(f"   Temperature: {data.get('main', {}).get('temp', 'N/A')}°F")
            return True
        else:
            print(f"❌ OpenWeather API test failed: HTTP {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except ImportError:
        print("❌ requests package not installed")
        print("   Run: pip install requests")
        return False
    except Exception as e:
        print(f"❌ OpenWeather API test failed: {str(e)}")
        return False

def main():
    print("🔍 Smart Farm AI - API Key Verification")
    print("=" * 50)
    
    # Check .env file
    if not check_env_file():
        sys.exit(1)
    
    # Check API keys
    all_configured, keys = check_api_keys()
    
    # Test APIs
    gemini_ok = test_gemini_api(keys.get('GEMINI_API_KEY'))
    weather_ok = test_openweather_api(keys.get('OPENWEATHER_API_KEY'))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Verification Summary:")
    print("-" * 50)
    
    if gemini_ok:
        print("✅ Gemini API: Working")
    else:
        print("❌ Gemini API: Not working or not configured")
    
    if weather_ok:
        print("✅ OpenWeather API: Working")
    else:
        print("⚠️  OpenWeather API: Not working or not configured (optional)")
    
    print("\n" + "=" * 50)
    
    if gemini_ok:
        print("✅ Core functionality ready!")
        print("\nNext steps:")
        print("  1. Start the application: ./start.sh")
        print("  2. Open browser: http://localhost:8501")
        print("  3. Test AI features in the dashboard")
        return 0
    else:
        print("⚠️  Gemini API is required for AI features")
        print("\nTo fix:")
        print("  1. Get API key: https://makersuite.google.com/app/apikey")
        print("  2. Run setup script: ./setup_api_keys.sh")
        print("  3. Or manually edit .env file")
        return 1

if __name__ == "__main__":
    sys.exit(main())
