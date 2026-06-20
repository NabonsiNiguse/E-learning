#!/bin/bash

# Development startup script for E-Learning Platform
# Starts both backend (Django) and frontend (Vite) servers

echo "🚀 Starting E-Learning Platform Development Servers..."
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "📦 Starting Django backend on http://localhost:8000..."
cd backend
python manage.py runserver > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Check if backend started successfully
if ! curl -s http://localhost:8000/api/v1/ > /dev/null 2>&1; then
    echo "⚠️  Backend may not have started properly. Check backend.log"
else
    echo "✅ Backend is running"
fi

# Start frontend
echo "⚡ Starting Vite frontend on http://localhost:5173..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a bit for frontend to start
sleep 3

# Check if frontend started successfully
if ! curl -s http://localhost:5173/ > /dev/null 2>&1; then
    echo "⚠️  Frontend may not have started properly. Check frontend.log"
else
    echo "✅ Frontend is running"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Development servers are running!"
echo ""
echo "📱 Frontend:  http://localhost:5173/"
echo "🔧 Backend:   http://localhost:8000/"
echo "🔐 Admin:     http://localhost:8000/admin/"
echo ""
echo "📋 Logs:"
echo "   Backend:   tail -f backend.log"
echo "   Frontend:  tail -f frontend.log"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Keep script running
wait
