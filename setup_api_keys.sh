#!/bin/bash

# Smart Farm AI - API Key Setup Script
# This script helps you configure API keys for local development

set -e

echo "🔑 Smart Farm AI - API Key Setup"
echo "=================================="
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to update it? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    # Backup existing .env
    cp .env .env.backup
    echo "✅ Backed up existing .env to .env.backup"
fi

# Copy template
if [ ! -f ".env.example" ]; then
    echo "❌ Error: .env.example not found!"
    exit 1
fi

cp .env.example .env
echo "✅ Created .env file from template"
echo ""

# Prompt for Gemini API Key
echo "📝 Please enter your API keys:"
echo ""
echo "1️⃣  Gemini API Key"
echo "   Get it from: https://makersuite.google.com/app/apikey"
read -p "   Enter your Gemini API key: " GEMINI_KEY

if [ -z "$GEMINI_KEY" ]; then
    echo "⚠️  Warning: No Gemini API key provided. You can add it later in .env"
else
    # Update .env file with actual key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/GEMINI_API_KEY=your_gemini_api_key_here/GEMINI_API_KEY=$GEMINI_KEY/" .env
    else
        # Linux
        sed -i "s/GEMINI_API_KEY=your_gemini_api_key_here/GEMINI_API_KEY=$GEMINI_KEY/" .env
    fi
    echo "✅ Gemini API key configured"
fi

echo ""
echo "2️⃣  OpenWeather API Key (Optional)"
echo "   Get it from: https://openweathermap.org/api"
read -p "   Enter your OpenWeather API key (or press Enter to skip): " WEATHER_KEY

if [ ! -z "$WEATHER_KEY" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/OPENWEATHER_API_KEY=your_openweather_api_key_here/OPENWEATHER_API_KEY=$WEATHER_KEY/" .env
    else
        sed -i "s/OPENWEATHER_API_KEY=your_openweather_api_key_here/OPENWEATHER_API_KEY=$WEATHER_KEY/" .env
    fi
    echo "✅ OpenWeather API key configured"
fi

echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo ""
echo "Your .env file has been configured with:"
if [ ! -z "$GEMINI_KEY" ]; then
    echo "  ✓ Gemini API Key"
fi
if [ ! -z "$WEATHER_KEY" ]; then
    echo "  ✓ OpenWeather API Key"
fi
echo ""
echo "Next steps:"
echo "  1. Review your .env file: cat .env"
echo "  2. Start the application: ./start.sh"
echo "  3. Test AI features in the dashboard"
echo ""
echo "📚 For more information, see GEMINI_API_SETUP.md"
