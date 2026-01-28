#!/bin/bash

# Smart Farm AI - Development Server Startup Script
# This script starts both backend and frontend servers

echo "🚜 Starting Smart Farm AI Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Backend directory not found!${NC}"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Frontend directory not found!${NC}"
    exit 1
fi

# Function to check if port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Check if backend port 8000 is already in use
if check_port 8000; then
    echo -e "${BLUE}ℹ️  Port 8000 is already in use. Killing existing process...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Check if frontend port 3000 is already in use
if check_port 3000; then
    echo -e "${BLUE}ℹ️  Port 3000 is already in use. Killing existing process...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Start backend server
echo -e "${GREEN}🔧 Starting Backend Server (Port 8000)...${NC}"
cd backend
python3 -m uvicorn app.main:app --reload --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Check if backend started successfully
if check_port 8000; then
    echo -e "${GREEN}✅ Backend server started successfully!${NC}"
    echo -e "${BLUE}   Backend PID: $BACKEND_PID${NC}"
    echo -e "${BLUE}   Backend URL: http://localhost:8000${NC}"
else
    echo -e "${RED}❌ Failed to start backend server!${NC}"
    echo -e "${RED}   Check backend.log for details${NC}"
    exit 1
fi

# Start frontend server
echo ""
echo -e "${GREEN}🎨 Starting Frontend Server (Port 3000)...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 5

# Check if frontend started successfully
if check_port 3000; then
    echo -e "${GREEN}✅ Frontend server started successfully!${NC}"
    echo -e "${BLUE}   Frontend PID: $FRONTEND_PID${NC}"
    echo -e "${BLUE}   Frontend URL: http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Failed to start frontend server!${NC}"
    echo -e "${RED}   Check frontend.log for details${NC}"
    # Kill backend if frontend failed
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Save PIDs to file for easy cleanup
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

echo ""
echo -e "${GREEN}🎉 Smart Farm AI is now running!${NC}"
echo ""
echo -e "${BLUE}📱 Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}🔧 Backend:  http://localhost:8000${NC}"
echo -e "${BLUE}📊 API Docs: http://localhost:8000/docs${NC}"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "${BLUE}   Backend:  tail -f backend.log${NC}"
echo -e "${BLUE}   Frontend: tail -f frontend.log${NC}"
echo ""
echo -e "${BLUE}🛑 To stop servers: ./stop.sh${NC}"
echo ""
