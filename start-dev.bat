@echo off
REM Development startup script for E-Learning Platform (Windows)
REM Starts both backend (Django) and frontend (Vite) servers

echo.
echo ========================================
echo  E-Learning Platform - Dev Servers
echo ========================================
echo.

REM Check if backend directory exists
if not exist "backend" (
    echo [ERROR] backend directory not found
    exit /b 1
)

REM Check if frontend directory exists
if not exist "frontend" (
    echo [ERROR] frontend directory not found
    exit /b 1
)

REM Start backend in new window
echo [1/2] Starting Django backend on http://localhost:8000...
start "Django Backend" cmd /k "cd backend && python manage.py runserver"

REM Wait for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend in new window
echo [2/2] Starting Vite frontend on http://localhost:5173...
start "Vite Frontend" cmd /k "cd frontend && npm run dev"

REM Wait for frontend to start
timeout /t 3 /nobreak > nul

echo.
echo ========================================
echo  Servers Started Successfully!
echo ========================================
echo.
echo  Frontend:  http://localhost:5173/
echo  Backend:   http://localhost:8000/
echo  Admin:     http://localhost:8000/admin/
echo.
echo  Close the terminal windows to stop servers
echo ========================================
echo.

pause
