# Backend-Frontend Communication Setup Guide

## ✅ Current Configuration Status

Your backend and frontend are **properly configured** to communicate. Here's what's already set up:

### Backend Configuration (Django)
- **URL**: `http://localhost:8000`
- **API Base**: `http://localhost:8000/api/v1`
- **CORS Enabled**: ✅ Allows `http://localhost:5173` and `http://localhost:3000`
- **JWT Authentication**: ✅ Configured with SimpleJWT
- **Credentials**: ✅ `CORS_ALLOW_CREDENTIALS = True`

### Frontend Configuration (React + Vite)
- **URL**: `http://localhost:5173`
- **API Client**: ✅ Custom fetch wrapper in `frontend/src/lib/api.ts`
- **Base URL**: `http://localhost:8000/api/v1`
- **JWT Handling**: ✅ Automatic token refresh on 401
- **Fallback**: ✅ Mock data when backend is offline

---

## 🚀 How to Start Both Servers

### 1. Start Backend (Django)
```bash
cd backend
python manage.py runserver
```
**Expected output:**
```
Starting development server at http://127.0.0.1:8000/
```

### 2. Start Frontend (Vite)
```bash
cd frontend
npm run dev
```
**Expected output:**
```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

## 🔍 How to Test Communication

### Test 1: Backend Health Check
```bash
curl http://localhost:8000/api/v1/auth/me/
```
**Expected**: `{"detail":"Authentication credentials were not provided."}`
✅ This means backend is running and responding

### Test 2: Login from Frontend
1. Open browser: `http://localhost:5173/login`
2. Enter credentials:
   - Email: `admin@elearn.com`
   - Password: (your admin password)
3. Check browser console (F12) for network requests
4. Should see: `POST http://localhost:8000/api/v1/auth/login/` → Status 200

### Test 3: Check CORS Headers
```bash
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:8000/api/v1/auth/login/
```
**Expected headers in response:**
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Symptoms:**
```
Access to fetch at 'http://localhost:8000/api/v1/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solution:**
1. Check backend is running: `curl http://localhost:8000/api/v1/`
2. Verify `.env` file has:
   ```
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```
3. Restart Django server

---

### Issue 2: "Network Error" or "Failed to fetch"

**Symptoms:**
- Frontend shows "Backend unreachable" or falls back to mock data
- Console shows: `TypeError: Failed to fetch`

**Solution:**
1. **Check backend is running:**
   ```bash
   curl http://localhost:8000/api/v1/auth/me/
   ```
   If this fails, start Django: `python manage.py runserver`

2. **Check firewall/antivirus** isn't blocking port 8000

3. **Verify API base URL** in `frontend/src/lib/api.ts`:
   ```typescript
   const BASE = "http://localhost:8000/api/v1";
   ```

---

### Issue 3: "401 Unauthorized" on every request

**Symptoms:**
- Login works but subsequent requests fail with 401
- Token refresh loop

**Solution:**
1. **Check JWT configuration** in `backend/myproject/settings.py`:
   ```python
   SIMPLE_JWT = {
       'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
       'AUTH_HEADER_TYPES': ('Bearer',),
   }
   ```

2. **Clear browser storage:**
   - Open DevTools (F12) → Application → Local Storage
   - Delete `learnly_access` and `learnly_refresh`
   - Login again

3. **Check token in request headers:**
   - DevTools → Network → Select any API request
   - Headers tab → Request Headers
   - Should see: `Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...`

---

### Issue 4: Backend becomes unresponsive (FIXED)

**Symptoms:**
- Page loads forever
- Backend doesn't respond
- High CPU usage

**Solution:**
✅ **Already fixed** in the performance optimization update!
- StudentDashboardView: 40+ queries → 5 queries
- AttendanceSummaryView: 100 queries → 1 query
- See `PERFORMANCE_FIX_SUMMARY.md` for details

---

## 📡 API Request Flow

### Successful Request Flow
```
1. Frontend: fetch('http://localhost:8000/api/v1/dashboard/student/')
   ↓
2. Browser: Adds Authorization: Bearer <token>
   ↓
3. Django CORS Middleware: Checks origin → ✅ Allowed
   ↓
4. Django JWT Auth: Validates token → ✅ Valid
   ↓
5. View: Processes request → Returns JSON
   ↓
6. Frontend: Receives data → Updates UI
```

### Failed Request Flow (401)
```
1. Frontend: fetch() → 401 Unauthorized
   ↓
2. api.ts: Detects 401 → Calls tryRefresh()
   ↓
3. tryRefresh(): POST /auth/token/refresh/ with refresh token
   ↓
4a. Success: Updates access token → Retries original request
4b. Failure: Clears tokens → Redirects to /login
```

---

## 🔐 Authentication Flow

### Login Process
```typescript
// 1. User submits login form
const { access, refresh, user } = await authApi.login(email, password);

// 2. Store tokens in localStorage
localStorage.setItem('learnly_access', access);
localStorage.setItem('learnly_refresh', refresh);

// 3. All subsequent requests include token
headers: { Authorization: `Bearer ${access}` }
```

### Token Refresh (Automatic)
```typescript
// When access token expires (after 60 minutes):
// 1. Request fails with 401
// 2. Frontend automatically calls /auth/token/refresh/
// 3. Gets new access token
// 4. Retries original request
// 5. User doesn't notice anything
```

---

## 🧪 Testing Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Can access `http://localhost:8000/admin/`
- [ ] Can access `http://localhost:5173/`
- [ ] Login works and stores tokens
- [ ] Dashboard loads data from backend
- [ ] Network tab shows successful API calls
- [ ] No CORS errors in console
- [ ] Token refresh works automatically
- [ ] Logout clears tokens

---

## 📝 Environment Variables

### Backend `.env` (Required)
```env
SECRET_KEY=django-insecure-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
ACCESS_TOKEN_LIFETIME_MINUTES=60
REFRESH_TOKEN_LIFETIME_DAYS=7
```

### Frontend (No .env needed)
API base URL is hardcoded in `frontend/src/lib/api.ts`:
```typescript
const BASE = "http://localhost:8000/api/v1";
```

**For production**, change to:
```typescript
const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
```

Then create `frontend/.env.production`:
```env
VITE_API_BASE_URL=https://your-production-api.com/api/v1
```

---

## 🔧 Advanced Configuration

### Add Proxy in Vite (Optional)
If you want to use relative URLs like `/api/v1/...` instead of full URLs:

**frontend/vite.config.ts:**
```typescript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

**frontend/src/lib/api.ts:**
```typescript
const BASE = "/api/v1";  // Remove http://localhost:8000
```

**Benefits:**
- No CORS issues in development
- Easier to switch between environments
- Matches production setup (usually behind same domain)

---

## 📊 Monitoring Communication

### Enable Request Logging in Backend
**backend/myproject/settings.py:**
```python
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'loggers': {
        'django.server': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}
```

### Monitor in Browser DevTools
1. Open DevTools (F12)
2. Network tab
3. Filter: `Fetch/XHR`
4. Watch for:
   - Request URL
   - Status code
   - Response time
   - Request/Response headers

---

## ✅ Verification Commands

Run these to verify everything is working:

```bash
# 1. Check backend is running
curl http://localhost:8000/api/v1/

# 2. Check frontend is running
curl http://localhost:5173/

# 3. Test login endpoint
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@elearn.com","password":"your_password"}'

# 4. Test authenticated endpoint (replace TOKEN)
curl http://localhost:8000/api/v1/dashboard/student/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🎯 Summary

Your backend and frontend are **already configured correctly**:

✅ CORS is enabled for `http://localhost:5173`  
✅ JWT authentication is working  
✅ Token refresh is automatic  
✅ API client handles errors gracefully  
✅ Fallback to mock data when backend is offline  
✅ Performance issues have been fixed  

**Just start both servers and it should work!**

```bash
# Terminal 1
cd backend && python manage.py runserver

# Terminal 2  
cd frontend && npm run dev
```

Then open `http://localhost:5173/` in your browser.
