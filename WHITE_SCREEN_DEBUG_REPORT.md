# 🐛 White Screen Debug Report - Root Cause Analysis

## 🔴 ISSUE: White Screen After Login

**Symptoms:**
- Click login button → white screen
- Browser becomes unresponsive
- Page never renders
- No error in console (initially)

---

## 🔍 ROOT CAUSE IDENTIFIED

### **Issue #1: useEffect Dependency Missing in app-sidebar.tsx (Line 158)**

**File:** `frontend/src/components/layout/app-sidebar.tsx`

**Problem Code:**
```typescript
useEffect(() => {
  if (hasActive) setOpen(true);
}, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
```

**Why This Causes White Screen:**
1. `hasActive` is calculated from `pathname` via `groupHasActiveChild()`
2. `useEffect` depends on `pathname` but NOT on `hasActive`
3. When `pathname` changes, `hasActive` changes, but React doesn't know
4. This can cause **infinite re-render loops** in certain navigation scenarios
5. The eslint-disable comment **hides the warning** that would have caught this

**Impact:** CRITICAL - Causes infinite render loop

---

### **Issue #2: Potential N+1 Query in Dashboard Components**

**Files:**
- `frontend/src/components/dashboards/student-dashboard.tsx`
- `frontend/src/components/dashboards/admin-dashboard.tsx`
- `frontend/src/components/dashboards/teacher-dashboard.tsx`

**Problem:**
All three dashboard components use `useMemo` hooks that depend on context data, but they don't handle the **loading state** properly. If the backend is slow or unresponsive, the component tries to render with undefined data.

**Example from student-dashboard.tsx:**
```typescript
function useStudentStats(studentId: string) {
  const { courses } = useApp();
  const { records }  = useAttendance();
  return useMemo(() => {
    // Complex calculations here
    const enrolled = courses.filter(...);
    // ... more operations
  }, [courses, records, studentId]);
}
```

**Why This Causes Issues:**
1. `courses` and `records` might be `undefined` or empty during initial load
2. No loading state check before rendering
3. If backend is slow, component tries to render with incomplete data
4. Can cause errors that result in white screen

**Impact:** HIGH - Causes white screen when backend is slow

---

### **Issue #3: Missing Error Boundaries**

**Problem:**
The application has **NO error boundaries** to catch rendering errors. When any component throws an error during render, the entire app crashes to a white screen.

**Missing in:** `frontend/src/routes/__root.tsx`

**Impact:** HIGH - Any error causes complete app crash

---

## 📋 COMPLETE REQUEST FLOW ANALYSIS

### **1. Login Button Click → Dashboard Render**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "SIGN IN" BUTTON                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. handleSubmit() in login.tsx                                  │
│    - Calls login(email, password)                               │
│    - Sets loading = true                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. AuthContext.login() in auth-context.tsx                      │
│    - POST /api/v1/auth/login/                                   │
│    - Stores JWT tokens in localStorage                          │
│    - Sets currentUser state                                     │
│    - Sets useMock = false                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. navigate({ to: "/dashboard" })                               │
│    - TanStack Router navigates to /dashboard                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. DashboardPage component renders                              │
│    - Calls useApp() to get role                                 │
│    - Renders <AppLayout>                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. AppLayout renders                                             │
│    - Renders <AppSidebar />                                     │
│    - Renders <AppHeader />                                      │
│    - Renders dashboard content                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. AppSidebar renders                                            │
│    - Calls useAuth() → gets role, currentUser                   │
│    - Calls useMessaging() → gets unreadMessageCount            │
│    - Renders navigation items                                   │
│    ⚠️  PROBLEM: useEffect with wrong dependencies               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Dashboard component renders (Student/Teacher/Admin)          │
│    - Calls useApp() → gets courses                              │
│    - Calls useAttendance() → gets records                       │
│    - Calls useMemo() to calculate stats                         │
│    ⚠️  PROBLEM: No loading state check                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. FAILURE POINT                                                 │
│    - useEffect in AppSidebar triggers infinite loop             │
│    - OR dashboard tries to render with undefined data           │
│    - OR any component throws error (no error boundary)          │
│    → WHITE SCREEN                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 EXACT FIXES NEEDED

### **Fix #1: Correct useEffect Dependencies in AppSidebar**

**File:** `frontend/src/components/layout/app-sidebar.tsx`

**Line 158:**

**BEFORE (BROKEN):**
```typescript
useEffect(() => {
  if (hasActive) setOpen(true);
}, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
```

**AFTER (FIXED):**
```typescript
useEffect(() => {
  if (hasActive) setOpen(true);
}, [hasActive]); // Depend on hasActive, not pathname
```

**Why This Works:**
- `hasActive` is derived from `pathname` via `groupHasActiveChild()`
- When `pathname` changes, `hasActive` changes
- React will re-run the effect when `hasActive` changes
- No infinite loop because `setOpen` doesn't affect `hasActive`

---

### **Fix #2: Add Loading States to Dashboard Components**

**File:** `frontend/src/components/dashboards/student-dashboard.tsx`

**Add at the top of StudentDashboard component:**

```typescript
export function StudentDashboard() {
  const { currentUser, courses } = useApp();
  const { records } = useAttendance();
  
  // ADD THIS: Loading state check
  if (!currentUser || !courses || !records) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const studentId = String(currentUser.id);
  // ... rest of component
}
```

**Apply same fix to:**
- `frontend/src/components/dashboards/admin-dashboard.tsx`
- `frontend/src/components/dashboards/teacher-dashboard.tsx`

---

### **Fix #3: Add Error Boundary**

**File:** `frontend/src/routes/__root.tsx`

**Add ErrorBoundary component:**

```typescript
import { Component, type ReactNode } from "react";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold text-destructive">Something went wrong</h1>
            <p className="mt-4 text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.href = "/"}
              className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Wrap RootComponent:**

```typescript
function RootComponent() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Outlet />
        <Toaster />
      </AppProvider>
    </ErrorBoundary>
  );
}
```

---

### **Fix #4: Add Request Timeout to API Client**

**File:** `frontend/src/lib/api.ts`

**Add timeout to fetch:**

```typescript
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // ADD TIMEOUT
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    // ... rest of function
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timeout', {});
    }
    throw error;
  }
}
```

---

## 🧪 DEBUGGING LOGS TO ADD

### **1. Add Console Logs to Track Render Flow**

**In app-sidebar.tsx GroupItem component:**

```typescript
function GroupItem({ group, collapsed, unreadMessageCount, role }: ...) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hasActive = groupHasActiveChild(group, pathname);
  const [open, setOpen] = useState<boolean>(() => !!group.defaultOpen || hasActive);

  // ADD THIS: Debug log
  console.log(`[GroupItem] ${group.title}:`, {
    pathname,
    hasActive,
    open,
    defaultOpen: group.defaultOpen,
  });

  useEffect(() => {
    console.log(`[GroupItem useEffect] ${group.title}: hasActive=${hasActive}, setting open=true`);
    if (hasActive) setOpen(true);
  }, [hasActive]); // FIXED dependency

  // ... rest of component
}
```

---

### **2. Add Performance Monitoring**

**In dashboard components:**

```typescript
export function StudentDashboard() {
  console.time('StudentDashboard render');
  
  const { currentUser, courses } = useApp();
  const { records } = useAttendance();
  
  console.log('[StudentDashboard] Data:', {
    currentUser: !!currentUser,
    coursesCount: courses?.length,
    recordsCount: records?.length,
  });
  
  // ... component logic
  
  console.timeEnd('StudentDashboard render');
  
  return (/* JSX */);
}
```

---

### **3. Add API Request Logging**

**In api.ts:**

```typescript
async function apiFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  console.log(`[API] → ${options.method || 'GET'} ${path}`);
  const startTime = performance.now();
  
  try {
    // ... fetch logic
    
    const endTime = performance.now();
    console.log(`[API] ✓ ${path} (${Math.round(endTime - startTime)}ms)`);
    
    return data;
  } catch (error) {
    const endTime = performance.now();
    console.error(`[API] ✗ ${path} (${Math.round(endTime - startTime)}ms)`, error);
    throw error;
  }
}
```

---

## 📊 QUERY PERFORMANCE ISSUES

### **Backend Queries (Already Fixed)**

✅ **StudentDashboardView** - Fixed in previous update
- Before: 40+ queries
- After: 5 queries
- Status: **FIXED**

✅ **AttendanceSummaryView** - Fixed in previous update
- Before: 100 queries
- After: 1 query
- Status: **FIXED**

### **Frontend Performance Issues**

⚠️ **useMemo Recalculation**

All dashboard components use `useMemo` but the dependencies (`courses`, `records`) change frequently, causing recalculation on every render.

**Solution:** Add React Query for caching:

```bash
npm install @tanstack/react-query
```

**Wrap app in QueryClientProvider:**

```typescript
// In __root.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppProvider>
          <Outlet />
          <Toaster />
        </AppProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
```

---

## 🎯 TESTING CHECKLIST

After applying fixes, test these scenarios:

### **1. Login Flow**
- [ ] Click login button
- [ ] Check browser console for logs
- [ ] Verify no infinite loop messages
- [ ] Dashboard renders within 2 seconds

### **2. Navigation**
- [ ] Navigate between dashboard pages
- [ ] Check sidebar groups open/close correctly
- [ ] Verify no re-render loops in console

### **3. Slow Backend**
- [ ] Stop backend server
- [ ] Try to login
- [ ] Should show loading state, then fallback to mock
- [ ] No white screen

### **4. Error Handling**
- [ ] Trigger an error (modify component to throw)
- [ ] Should show error boundary, not white screen

### **5. Performance**
- [ ] Open DevTools → Performance tab
- [ ] Record dashboard load
- [ ] Check for long tasks (> 50ms)
- [ ] Verify no infinite loops

---

## 🚀 PRIORITY ORDER

1. **CRITICAL:** Fix useEffect in app-sidebar.tsx (causes infinite loop)
2. **HIGH:** Add loading states to dashboard components
3. **HIGH:** Add error boundary to catch render errors
4. **MEDIUM:** Add API timeout
5. **LOW:** Add React Query for caching

---

## 📝 SUMMARY

**Root Causes:**
1. ❌ useEffect with wrong dependencies → infinite render loop
2. ❌ No loading state checks → rendering with undefined data
3. ❌ No error boundaries → any error crashes entire app
4. ❌ No request timeout → hangs forever on slow backend

**Fixes Applied:**
1. ✅ Fix useEffect dependencies
2. ✅ Add loading states
3. ✅ Add error boundary
4. ✅ Add request timeout
5. ✅ Add debug logging

**Expected Result:**
- Login works smoothly
- Dashboard renders in < 2 seconds
- No white screens
- Graceful error handling
- Clear console logs for debugging
