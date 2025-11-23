#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

clear
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║     🚀 Whoop Insights Pro - Build & Start Script     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup INT TERM

# Check and kill existing processes
echo -e "${YELLOW}🔍 Checking for existing processes...${NC}"
if lsof -ti:8000 > /dev/null 2>&1; then
    echo -e "${YELLOW}   Stopping existing backend on port 8000...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 1
fi
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}   Stopping existing frontend on port 3000...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 1
fi
echo ""

# Quick dependency check
echo -e "${BLUE}📦 Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}   Installing frontend dependencies...${NC}"
    npm install --silent
fi
if [ ! -d "backend/venv" ]; then
    echo -e "${YELLOW}   Creating Python virtual environment...${NC}"
    cd backend && python3 -m venv venv && cd ..
fi
if [ ! -d "backend/venv" ] || ! bash -c "source backend/venv/bin/activate && python3 -c 'import fastapi'" 2>/dev/null; then
    echo -e "${YELLOW}   Installing backend dependencies...${NC}"
    cd backend
    ./venv/bin/python3 -m pip install -q -r requirements.txt
    cd ..
fi
echo -e "${GREEN}✅ Dependencies ready${NC}"
echo ""


# Start backend
echo -e "${BLUE}🚀 Starting backend server...${NC}"
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 > /dev/null 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3

# Start frontend
echo -e "${BLUE}🚀 Starting frontend server...${NC}"
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

# Wait for frontend
sleep 5

# Verify services
BACKEND_OK=false
FRONTEND_OK=false

for i in {1..10}; do
    if curl -s http://localhost:8000/healthz > /dev/null 2>&1; then
        BACKEND_OK=true
    fi
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        FRONTEND_OK=true
    fi
    if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
        break
    fi
    sleep 1
done

# Display results
clear
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║              ✅ Services Are Running!                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

if [ "$BACKEND_OK" = true ]; then
    echo -e "${GREEN}✅ Backend API${NC}"
else
    echo -e "${YELLOW}⚠️  Backend starting...${NC}"
fi

if [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}✅ Frontend${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend starting...${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📱 Access your application:${NC}"
echo ""
echo -e "   ${GREEN}Frontend:${NC}    ${CYAN}http://localhost:3000${NC}"
echo -e "   ${GREEN}Backend API:${NC}  ${CYAN}http://localhost:8000${NC}"
echo -e "   ${GREEN}API Docs:${NC}     ${CYAN}http://localhost:8000/docs${NC}"
echo -e "   ${GREEN}Health Check:${NC} ${CYAN}http://localhost:8000/healthz${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Wait for both processes
wait

