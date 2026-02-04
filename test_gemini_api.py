#!/usr/bin/env python3
"""
Quick test script for Gemini API integration
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_gemini_api():
    """Test Gemini API with a simple request"""
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        print("❌ GEMINI_API_KEY not found in .env")
        return False
    
    print(f"✅ API Key loaded: {api_key[:10]}...{api_key[-4:]}")
    
    try:
        import google.generativeai as genai
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        print("\n🧪 Testing AI response for crop analysis...")
        
        prompt = """
        Analyze this farm data and provide a brief recommendation:
        - Temperature: 75°F
        - Humidity: 60%
        - Crop: Tomato
        
        Provide a one-sentence recommendation.
        """
        
        response = model.generate_content(prompt)
        
        if response and response.text:
            print("\n✅ Gemini API Test SUCCESSFUL!")
            print("\n📊 AI Response:")
            print("-" * 50)
            print(response.text)
            print("-" * 50)
            return True
        else:
            print("❌ Empty response from Gemini API")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔬 Smart Farm AI - Gemini API Quick Test")
    print("=" * 50)
    
    success = test_gemini_api()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed! Gemini API is working correctly.")
        print("\n🚀 You can now start the application:")
        print("   ./start.sh")
    else:
        print("❌ Tests failed. Please check your API key configuration.")
        print("\n📚 See GEMINI_API_SETUP.md for troubleshooting.")
