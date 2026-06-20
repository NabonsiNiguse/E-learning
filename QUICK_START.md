# 🚀 Quick Start Guide - E-Learning Platform

## Prerequisites

- Python 3.8+ installed
- Node.js 18+ installed
- Git Bash or WSL (for running .sh scripts on Windows)

---

## 🎯 Start Development Servers

### Option 1: Automatic (Recommended)

**Windows:**
```bash
start-dev.bat
```

**Linux/Mac:**
```bash
./start-dev.sh
```

This will start both backend and frontend servers automatically.

---

### Option 2: Manual

**Terminal 1 - Backend:**
```bash
cd backend
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🧪 Test Connection

**Windows (PowerShell):**
```powershell
# Test backend
curl http://localhost:8000/api/v1/

# Test frontend
curl http://localhost:5173/
```

**Linux/Mac:**
```bash
./test-connection.sh
```

---

## 🌐 Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173/ | Main application |
| **Backend API** | http://localhost:8000/api/v1/ | REST API |
| **Admin Panel** | http://localhost:8000/admin/ | Django admin |

---

## 🔐 Default Login Credentials

After running `python manage.py seed`:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@elearn.com | admin123 |
| **Teacher** | alice.morgan@example.com | teacher123 |
| **Student** | dan.smith@example.com | student123 |

---

## 📋 First Time Setup

### 1. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Seed database with sample data
python manage.py seed

# Start server
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## ✅ Verify Everything Works

### 1. Check Backend
Open: http://localhost:8000/api/v1/

**Expected:** JSON response or 404 page (means server is running)

### 2. Check Frontend
Open: http://localhost:5173/

**Expected:** Login page loads

### 3. Test Login
1. Go to http://localhost:5173/login
2. Enter: `admin@elearn.com` / `admin123`
3. Should redirect to dashboard

### 4. Check Browser Console
Press F12 → Console tab

**Expected:** No CORS errors, no network errors

### 5. Check Network Requests
Press F12 → Network tab → Filter: Fetch/XHR

**Expected:** Requests to `http://localhost:8000/api/v1/...` with status 200

---

## 🐛 Troubleshooting

### Backend won't start

**Error:** `Port 8000 is already in use`
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

**Error:** `No module named 'rest_framework'`
```bash
cd backend
pip install -r requirements.txt
```

**Error:** `django.db.utils.OperationalError: no such table`
```bash
cd backend
python manage.py migrate
python manage.py seed
```

---

### Frontend won't start

**Error:** `Port 5173 is already in use`
```bash
# Kill process on port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

**Error:** `Cannot find module`
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

### CORS Errors

**Error:** `Access to fetch at 'http://localhost:8000' has been blocked by CORS policy`

**Solution:**
1. Check `backend/.env` has:
   ```
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```
2. Restart Django server
3. Clear browser cache (Ctrl+Shift+Delete)

---

### Login doesn't work

**Error:** `401 Unauthorized` or `Invalid credentials`

**Solution:**
1. Make sure you ran migrations:
   ```bash
   cd backend
   python manage.py migrate
   ```

2. Seed the database:
   ```bash
   python manage.py seed
   ```

3. Or create a superuser manually:
   ```bash
   python manage.py createsuperuser
   ```

---

### Backend is slow/unresponsive

**Solution:** ✅ Already fixed in performance update!

If still slow:
1. Check `PERFORMANCE_FIX_SUMMARY.md`
2. Enable query logging (see `DEBUG_PERFORMANCE.md`)
3. Check for N+1 queries

---

## 📚 Documentation

- **Backend-Frontend Communication:** `BACKEND_FRONTEND_COMMUNICATION.md`
- **Performance Fixes:** `PERFORMANCE_FIX_SUMMARY.md`
- **Debug Performance:** `DEBUG_PERFORMANCE.md`
- **API Examples:** `backend/API_EXAMPLES.md`
- **Setup Guide:** `backend/SETUP.md`

---

## 🎓 Development Workflow

### 1. Start servers
```bash
# Windows
start-dev.bat

# Linux/Mac
./start-dev.sh
```

### 2. Make changes
- Backend: Edit files in `backend/`
- Frontend: Edit files in `frontend/src/`

### 3. Test changes
- Backend: Django auto-reloads on file changes
- Frontend: Vite hot-reloads automatically

### 4. Check for errors
- Backend: Check terminal output
- Frontend: Check browser console (F12)

---

## 🔧 Useful Commands

### Backend
```bash
# Create new app
python manage.py startapp myapp

# Make migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test

# Shell
python manage.py shell
```

### Frontend
```bash
# Install new package
npm install package-name

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

---

## 📊 Project Structure

```
.
├── backend/                 # Django REST API
│   ├── users/              # User management
│   ├── courses/            # Course management
│   ├── enrollments/        # Student enrollments
│   ├── progress/           # Learning progress
│   ├── payments/           # Payment processing
│   ├── notifications/      # Notifications & messages
│   ├── dashboard/          # Dashboard views
│   ├── attendance/         # Attendance tracking
│   └── myproject/          # Django settings
│
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities (API client)
│   │   └── routes/        # TanStack Router pages
│   └── package.json
│
├── start-dev.bat          # Windows startup script
├── start-dev.sh           # Linux/Mac startup script
└── test-connection.sh     # Connection test script
```

---

## 🎉 You're Ready!

1. Start servers: `start-dev.bat` (Windows) or `./start-dev.sh` (Linux/Mac)
2. Open browser: http://localhost:5173/
3. Login with: `admin@elearn.com` / `admin123`
4. Start building! 🚀

---

## 💡 Tips

- Use **Django Admin** (http://localhost:8000/admin/) to manage data
- Check **Network tab** in DevTools to debug API calls
- Use **React DevTools** extension for component debugging
- Enable **Django Debug Toolbar** for query optimization
- Read `BACKEND_FRONTEND_COMMUNICATION.md` for detailed setup

---

## 🆘 Need Help?

1. Check documentation files in project root
2. Check browser console for errors (F12)
3. Check terminal output for backend errors
4. Run `./test-connection.sh` to diagnose issues
5. Review `BACKEND_FRONTEND_COMMUNICATION.md`
