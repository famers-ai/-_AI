#!/bin/bash

# Smart Farm AI - Stop Development Servers Script

echo "🛑 Stopping Smart Farm AI Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to kill process by PID file
kill_by_pid_file() {
    if [ -f "$1" ]; then
        PID=$(cat "$1")
        if ps -p $PID > /dev/null 2>&1; then
            kill $PID 2>/dev/null
            echo -e "${GREEN}✅ Stopped process (PID: $PID)${NC}"
        else
            echo -e "${BLUE}ℹ️  Process (PID: $PID) already stopped${NC}"
        fi
        rm "$1"
    else
        echo -e "${BLUE}ℹ️  No PID file found: $1${NC}"
    fi
}

# Function to kill process by port
kill_by_port() {
    if lsof -i :$1 > /dev/null 2>&1; then
        echo -e "${BLUE}🔧 Killing process on port $1...${NC}"
        lsof -ti:$1 | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✅ Port $1 cleared${NC}"
    else
        echo -e "${BLUE}ℹ️  No process running on port $1${NC}"
    fi
}

# Stop backend
echo -e "${BLUE}🔧 Stopping Backend Server...${NC}"
kill_by_pid_file ".backend.pid"
kill_by_port 8000

# Stop frontend
echo ""
echo -e "${BLUE}🎨 Stopping Frontend Server...${NC}"
kill_by_pid_file ".frontend.pid"
kill_by_port 3000

# Clean up log files (optional)
echo ""
read -p "Do you want to delete log files? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f backend.log frontend.log
    echo -e "${GREEN}✅ Log files deleted${NC}"
fi

echo ""
echo -e "${GREEN}🎉 All servers stopped successfully!${NC}"
echo ""
