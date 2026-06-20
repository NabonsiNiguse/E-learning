# 🧪 Testing Guide - White Screen Fix

## ✅ Fixes Applied

1. **Fixed infinite render loop** in `app-sidebar.tsx` (useEffect dependency)
2. **Added loading states** to all dashboard components
3. **Added error boundary** to catch and display errors gracefully
4. **Added 10-second timeout** to API requests

---

## 🧪 Test Scenarios

### **Test 1: Normal Login Flow**

**Steps:**
1. Start backend: `cd backend && python manage.py runserver`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser: `http://localhost:5173/login`
4. Click "Student" role card
5. Click "Sign in" button

**Expected Result:**
- ✅ Loading spinner shows briefly
- ✅ Redirects to `/dashboard`
- ✅ Dashboard renders within 2 seconds
- ✅ No white screen
- ✅ No console errors

**Console Output Should Show:**
```
[API] → POST /api/v1/auth/login/
[API] ✓ /api/v1/auth/login/ (XXXms)
```

---

### **Test 2: Backend Offline (Mock Mode)**

**Steps:**
1. **Stop backend server** (Ctrl+C in backend terminal)
2. Open browser: `http://localhost:5173/login`
3. Click "Student" role card
4. Click "Sign in" button

**Expected Result:**
- ✅ Shows toast: "Running in demo mode — backend not connected"
- ✅ Redirects to `/dashboard`
- ✅ Dashboard renders with mock data
- ✅ No white screen
- ✅ No errors

**Console Output Should Show:**
```
[API] → POST /api/v1/auth/login/
[API] ✗ /api/v1/auth/login/ (XXXms) [Error: Failed to fetch]
```

---

### **Test 3: Slow Backend (Timeout)**

**Steps:**
1. Add artificial delay to backend view:
   ```python
   # In backend/dashboard/views.py
   import time
   
   def get(self, request):
       time.sleep(15)  # 15 seconds (exceeds 10s timeout)
       # ... rest of code
   ```
2. Start backend
3. Login as student
4. Navigate to dashboard

**Expected Result:**
- ✅ Shows loading spinner for 10 seconds
- ✅ After 10 seconds, shows error or falls back to mock
- ✅ No infinite hanging
- ✅ No white screen

**Console Output Should Show:**
```
[API] → GET /api/v1/dashboard/student/
[API] ✗ /api/v1/dashboard/student/ (10000ms) [Error: Request timeout]
```

---

### **Test 4: Navigation Between Pages**

**Steps:**
1. Login successfully
2. Click "Courses" in sidebar
3. Click "Dashboard" in sidebar
4. Click "Messages" in sidebar
5. Repeat 5 times

**Expected Result:**
- ✅ All pages render correctly
- ✅ Sidebar groups open/close smoothly
- ✅ No white screens
- ✅ No console errors about infinite loops

**Console Should NOT Show:**
```
❌ Warning: Maximum update depth exceeded
❌ Too many re-renders
```

---

### **Test 5: Error Boundary**

**Steps:**
1. Temporarily break a component to trigger error:
   ```typescript
   // In student-dashboard.tsx, add at top of component:
   throw new Error("Test error boundary");
   ```
2. Login as student
3. Navigate to dashboard

**Expected Result:**
- ✅ Shows error boundary page with message
- ✅ "Go home" button works
- ✅ No white screen
- ✅ Error logged to console

**Should Display:**
```
┌─────────────────────────────────┐
│  Something went wrong           │
│  Test error boundary            │
│  [Go home] button               │
└─────────────────────────────────┘
```

---

### **Test 6: Role Switching (Demo Mode)**

**Steps:**
1. Stop backend
2. Login (will use mock mode)
3. Use role switcher in header: Admin → Teacher → Student
4. Check dashboard updates for each role

**Expected Result:**
- ✅ Dashboard changes for each role
- ✅ Sidebar items update based on role
- ✅ No white screens
- ✅ Smooth transitions

---

### **Test 7: Sidebar Group Accordion**

**Steps:**
1. Login successfully
2. Click "Learning" group header in sidebar
3. Should close
4. Click again
5. Should open
6. Navigate to a page inside "Learning" (e.g., Courses)
7. Group should auto-open

**Expected Result:**
- ✅ Groups open/close on click
- ✅ Active group auto-opens when navigating to child
- ✅ Smooth animation
- ✅ No flickering or infinite loops

---

## 🔍 Browser DevTools Checks

### **Console Tab**

**Should NOT see:**
- ❌ `Warning: Maximum update depth exceeded`
- ❌ `Too many re-renders. React limits...`
- ❌ `Uncaught Error:`
- ❌ Infinite loop of same log messages

**Should see (normal):**
- ✅ `[API] → GET /api/v1/...`
- ✅ `[API] ✓ /api/v1/... (XXXms)`
- ✅ Component render logs (if added)

---

### **Network Tab**

**Filter: Fetch/XHR**

**Should see:**
- ✅ `POST /api/v1/auth/login/` → 200 OK
- ✅ `GET /api/v1/auth/me/` → 200 OK (or 401 if backend offline)
- ✅ `GET /api/v1/dashboard/student/` → 200 OK
- ✅ Request times < 1 second (with backend running)

**Should NOT see:**
- ❌ Same request repeated 100+ times
- ❌ Requests stuck in "pending" forever
- ❌ All requests showing "failed" (unless backend is offline)

---

### **Performance Tab**

**Steps:**
1. Open DevTools → Performance
2. Click "Record"
3. Login and navigate to dashboard
4. Stop recording

**Check for:**
- ✅ No long tasks > 500ms
- ✅ No infinite loops (repeating patterns)
- ✅ Total load time < 3 seconds
- ✅ Frame rate stays above 30 FPS

**Red flags:**
- ❌ Long task > 1 second
- ❌ Repeating pattern of same function calls
- ❌ Frame drops to 0 FPS

---

## 📊 Performance Benchmarks

### **Expected Timings (with backend running)**

| Action | Expected Time | Max Acceptable |
|--------|---------------|----------------|
| Login request | < 500ms | 1s |
| Dashboard load | < 1s | 2s |
| Page navigation | < 200ms | 500ms |
| Sidebar toggle | < 100ms | 200ms |

### **Expected Query Counts**

| Page | API Requests | Database Queries (Backend) |
|------|--------------|----------------------------|
| Login | 1 | 2 |
| Dashboard (Student) | 1 | 5 |
| Dashboard (Admin) | 1 | 4 |
| Dashboard (Teacher) | 1 | 6 |

---

## 🐛 Debugging Commands

### **Check for Infinite Loops**

Open browser console and run:
```javascript
// Count renders
let renderCount = 0;
const originalLog = console.log;
console.log = function(...args) {
  if (args[0]?.includes?.('render')) {
    renderCount++;
    if (renderCount > 100) {
      console.error('INFINITE LOOP DETECTED!', renderCount, 'renders');
    }
  }
  originalLog.apply(console, args);
};
```

---

### **Monitor API Calls**

```javascript
// Track API calls
const apiCalls = [];
const originalFetch = window.fetch;
window.fetch = function(...args) {
  apiCalls.push({ url: args[0], time: Date.now() });
  console.log(`[Fetch] ${args[0]}`);
  return originalFetch.apply(this, args);
};

// Check for repeated calls
setTimeout(() => {
  const counts = {};
  apiCalls.forEach(call => {
    counts[call.url] = (counts[call.url] || 0) + 1;
  });
  console.table(counts);
}, 10000);
```

---

### **Check Component Render Count**

Add to any component:
```typescript
import { useEffect, useRef } from 'react';

function useRenderCount(componentName: string) {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current++;
    console.log(`[${componentName}] Render #${renderCount.current}`);
  });
  
  return renderCount.current;
}

// Usage in component:
const renderCount = useRenderCount('StudentDashboard');
```

---

## ✅ Success Criteria

All tests pass if:

1. ✅ No white screens in any scenario
2. ✅ No infinite render loops
3. ✅ No console errors (except expected ones in test scenarios)
4. ✅ Dashboard loads in < 2 seconds
5. ✅ Navigation is smooth and responsive
6. ✅ Error boundary catches and displays errors
7. ✅ API timeout prevents infinite hanging
8. ✅ Mock mode works when backend is offline

---

## 🚨 Failure Indicators

Report as bug if you see:

- ❌ White screen that lasts > 5 seconds
- ❌ Console error: "Maximum update depth exceeded"
- ❌ Console error: "Too many re-renders"
- ❌ Network request stuck in "pending" > 10 seconds
- ❌ Browser tab becomes unresponsive
- ❌ CPU usage spikes to 100%
- ❌ Same API request called 10+ times in a row

---

## 📝 Test Results Template

```
## Test Results - [Date]

### Environment
- Browser: Chrome/Firefox/Safari [version]
- Backend: Running / Offline
- Frontend: Dev mode / Production build

### Test 1: Normal Login
- Status: ✅ Pass / ❌ Fail
- Time to dashboard: XXXms
- Notes:

### Test 2: Backend Offline
- Status: ✅ Pass / ❌ Fail
- Fallback to mock: Yes / No
- Notes:

### Test 3: Slow Backend
- Status: ✅ Pass / ❌ Fail
- Timeout triggered: Yes / No
- Notes:

### Test 4: Navigation
- Status: ✅ Pass / ❌ Fail
- Infinite loops: Yes / No
- Notes:

### Test 5: Error Boundary
- Status: ✅ Pass / ❌ Fail
- Error displayed: Yes / No
- Notes:

### Test 6: Role Switching
- Status: ✅ Pass / ❌ Fail
- All roles work: Yes / No
- Notes:

### Test 7: Sidebar Accordion
- Status: ✅ Pass / ❌ Fail
- Smooth animation: Yes / No
- Notes:

### Overall Result: ✅ All Pass / ❌ Some Failures
```

---

## 🎯 Next Steps After Testing

If all tests pass:
1. Remove test error throws
2. Remove debug console.logs (optional)
3. Deploy to staging
4. Run tests again in staging
5. Deploy to production

If tests fail:
1. Check `WHITE_SCREEN_DEBUG_REPORT.md` for detailed analysis
2. Review console errors
3. Check Network tab for failed requests
4. Add more debug logging
5. Report issue with test results
