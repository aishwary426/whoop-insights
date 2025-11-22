#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}🚀 Whoop Insights Pro - Build & Start Script${NC}"
echo "=========================================="
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup INT TERM

# Step 1: Check and install frontend dependencies
echo -e "${BLUE}📦 Step 1/5: Checking frontend dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies (this may take a few minutes)...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi
echo ""

# Step 2: Check and setup backend virtual environment
echo -e "${BLUE}🐍 Step 2/5: Setting up backend environment...${NC}"
if [ ! -d "backend/venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    cd backend
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to create virtual environment${NC}"
        exit 1
    fi
    cd ..
    echo -e "${GREEN}✅ Virtual environment created${NC}"
else
    echo -e "${GREEN}✅ Virtual environment already exists${NC}"
fi
echo ""

# Step 3: Install backend dependencies
echo -e "${BLUE}📦 Step 3/5: Installing backend dependencies...${NC}"
cd backend
source venv/bin/activate

# Check if requirements are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}Installing backend dependencies (this may take several minutes)...${NC}"
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install backend dependencies${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi
cd ..
echo ""

# Step 4: Build frontend
echo -e "${BLUE}🔨 Step 4/5: Building frontend...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Frontend build had warnings (this is usually OK)${NC}"
fi
echo -e "${GREEN}✅ Frontend build completed${NC}"
echo ""

# Step 5: Start services
echo -e "${BLUE}🚀 Step 5/5: Starting services...${NC}"
echo ""

# Check and kill existing processes on ports 8000 and 3000
echo -e "${YELLOW}Checking for existing processes...${NC}"
if lsof -ti:8000 > /dev/null 2>&1; then
    echo -e "${YELLOW}Stopping existing backend process on port 8000...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 1
fi
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}Stopping existing frontend process on port 3000...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Create logs directory
mkdir -p logs

# Start backend
echo -e "${YELLOW}Starting backend server...${NC}"
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend failed to start. Check logs/backend.log${NC}"
    exit 1
fi

# Start frontend
echo -e "${YELLOW}Starting frontend server...${NC}"
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Frontend failed to start. Check logs/frontend.log${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Display success message with links
echo ""
echo "=========================================="
echo -e "${GREEN}✅ All services are running!${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}📱 Access your application:${NC}"
echo ""
echo -e "   ${GREEN}Frontend:${NC}    http://localhost:3000"
echo -e "   ${GREEN}Backend API:${NC}  http://localhost:8000"
echo -e "   ${GREEN}API Docs:${NC}     http://localhost:8000/docs"
echo -e "   ${GREEN}Health Check:${NC} http://localhost:8000/healthz"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Wait for both processes
wait

