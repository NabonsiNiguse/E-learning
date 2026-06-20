#!/bin/bash

# Test script to verify backend-frontend communication

echo "🧪 Testing Backend-Frontend Communication..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend health
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Backend Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if curl -s http://localhost:8000/api/v1/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on http://localhost:8000${NC}"
else
    echo -e "${RED}❌ Backend is NOT running${NC}"
    echo "   Start it with: cd backend && python manage.py runserver"
fi
echo ""

# Test 2: Frontend health
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Frontend Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if curl -s http://localhost:5173/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running on http://localhost:5173${NC}"
else
    echo -e "${RED}❌ Frontend is NOT running${NC}"
    echo "   Start it with: cd frontend && npm run dev"
fi
echo ""

# Test 3: CORS configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: CORS Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CORS_HEADER=$(curl -s -H "Origin: http://localhost:5173" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -X OPTIONS \
    -I http://localhost:8000/api/v1/auth/login/ 2>/dev/null | grep -i "access-control-allow-origin")

if [ ! -z "$CORS_HEADER" ]; then
    echo -e "${GREEN}✅ CORS is properly configured${NC}"
    echo "   $CORS_HEADER"
else
    echo -e "${RED}❌ CORS headers not found${NC}"
    echo "   Check backend/.env has: CORS_ALLOWED_ORIGINS=http://localhost:5173"
fi
echo ""

# Test 4: API endpoints
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: API Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test /auth/me/ (should return 401 without token)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/auth/me/)
if [ "$STATUS" = "401" ]; then
    echo -e "${GREEN}✅ /api/v1/auth/me/ - Responding correctly (401 without token)${NC}"
else
    echo -e "${YELLOW}⚠️  /api/v1/auth/me/ - Status: $STATUS (expected 401)${NC}"
fi

# Test /dashboard/student/ (should return 401 without token)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/dashboard/student/)
if [ "$STATUS" = "401" ]; then
    echo -e "${GREEN}✅ /api/v1/dashboard/student/ - Responding correctly (401 without token)${NC}"
else
    echo -e "${YELLOW}⚠️  /api/v1/dashboard/student/ - Status: $STATUS (expected 401)${NC}"
fi
echo ""

# Test 5: Database
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 5: Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "backend/db.sqlite3" ]; then
    echo -e "${GREEN}✅ Database file exists${NC}"
    SIZE=$(du -h backend/db.sqlite3 | cut -f1)
    echo "   Size: $SIZE"
else
    echo -e "${RED}❌ Database file not found${NC}"
    echo "   Run: cd backend && python manage.py migrate"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. If servers are not running, start them:"
echo "   ./start-dev.sh  (or start-dev.bat on Windows)"
echo ""
echo "2. Open browser and test:"
echo "   http://localhost:5173/login"
echo ""
echo "3. Check browser console (F12) for any errors"
echo ""
echo "4. Monitor network requests in DevTools → Network tab"
echo ""
