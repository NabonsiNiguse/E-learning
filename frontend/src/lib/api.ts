/**
 * Learnly API client — production-hardened
 *
 * Security model
 * ──────────────
 * • credentials: "include"  → browser automatically sends the httpOnly
 *   learnly_access cookie with every request.  No token is readable by JS.
 * • The Authorization: Bearer header is NO LONGER used for browser clients.
 *   It remains available as a fallback for Postman / mobile / automated tests
 *   but only when an explicit `bearerToken` option is passed to apiFetch.
 * • Token refresh is triggered server-side via the /auth/token/refresh/
 *   endpoint which reads the httpOnly learnly_refresh cookie.
 * • localStorage / sessionStorage are NEVER touched for auth tokens.
 */

const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------
export type UserRole = "super_admin" | "admin" | "teacher" | "student";

/** Mirrors UserDetailSerializer */
export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  avatar: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  teacher_profile: { bio: string; expertise: string; website: string } | null;
  student_profile: { bio: string } | null;
}

/** Mirrors UserListSerializer */
export interface ApiUserListItem {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access: string;   // also set as httpOnly cookie by the server
  refresh: string;  // also set as httpOnly cookie by the server
  user: AuthUser;
}

/** Mirrors NotificationSerializer */
export interface ApiNotification {
  id: number;
  notification_type:
    | "enrollment" | "payment_success" | "payment_failed"
    | "course_update" | "announcement" | "system";
  title: string;
  message: string;
  is_read: boolean;
  related_object_id: number | null;
  created_at: string;
}

export interface UnreadCountResponse { unread_count: number; }

/** Mirrors MessageSerializer */
export interface ApiMessage {
  id: number;
  sender: number;
  sender_detail: { id: number; email: string; full_name: string; role: UserRole };
  recipient: number | null;
  recipient_detail: { id: number; email: string; full_name: string; role: UserRole } | null;
  course: number | null;
  message_type: "direct" | "announcement" | "course_update";
  subject: string;
  body: string;
  is_read: boolean;
  parent: number | null;
  reply_count: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---------------------------------------------------------------------------
// Token helpers — kept only for non-browser / legacy fallback.
// Browser clients MUST use cookies; do NOT call setTokens/getAccessToken
// in normal application code.
// ---------------------------------------------------------------------------

/** @deprecated Use cookie-based auth. Only for non-browser Postman/test flows. */
export const TOKEN_KEY   = "learnly_access";
/** @deprecated Use cookie-based auth. Only for non-browser Postman/test flows. */
export const REFRESH_KEY = "learnly_refresh";

/** @deprecated Cookie-based auth is now primary. */
export function getAccessToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
}
/** @deprecated Cookie-based auth is now primary. */
export function getRefreshToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null;
}
/** @deprecated Cookie-based auth is now primary. */
export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}
/** Clears any legacy localStorage tokens (call on logout for belt-and-suspenders). */
export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string[]> = {}
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---------------------------------------------------------------------------
// Silent token refresh via httpOnly cookie
// The server reads learnly_refresh cookie and sets a new learnly_access cookie.
// ---------------------------------------------------------------------------
async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/auth/token/refresh/`, {
      method:      "POST",
      credentials: "include",          // sends the httpOnly refresh cookie
      headers:     { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------
export async function apiFetch<T>(
  path: string,
  options: RequestInit & { bearerToken?: string } = {},
  retry = true
): Promise<T> {
  const { bearerToken, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Non-browser fallback only (Postman, automated tests).
  // Normal browser requests rely entirely on the httpOnly cookie.
  if (bearerToken) {
    headers["Authorization"] = `Bearer ${bearerToken}`;
  }

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...fetchOptions,
      headers,
      signal:      controller.signal,
      credentials: "include",   // ← sends httpOnly cookies on every request
    });
    clearTimeout(timeoutId);

    if (res.status === 401 && retry) {
      const refreshed = await tryRefresh();
      if (refreshed) return apiFetch<T>(path, options, false);
      // Refresh also failed — clear any legacy tokens and let auth context redirect
      clearTokens();
      throw new ApiError(401, "Session expired — please log in again");
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(
        res.status,
        body?.message ?? body?.detail ?? "Request failed",
        body?.errors ?? {}
      );
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(408, "Request timeout — server not responding");
    }
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new ApiError(
        0,
        "Cannot connect to server. Make sure the backend is running on http://localhost:8000"
      );
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Auth  —  /api/v1/auth/
// ---------------------------------------------------------------------------
export const authApi = {
  /**
   * Login — server sets httpOnly cookies AND returns tokens in JSON body.
   * After this call the browser automatically sends the access cookie on all
   * subsequent requests.  The returned tokens are only needed for in-memory
   * state (e.g., displaying the user object) — they must NOT be persisted to
   * localStorage.
   */
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/auth/login/", {
      method: "POST",
      body:   JSON.stringify({ email, password }),
    }),

  me: () => apiFetch<AuthUser>("/auth/me/"),

  updateMe: (data: {
    first_name?: string;
    last_name?: string;
    teacher_profile?: { bio?: string; expertise?: string; website?: string };
    student_profile?: { bio?: string };
  }) =>
    apiFetch<AuthUser>("/auth/me/", { method: "PATCH", body: JSON.stringify(data) }),

  /**
   * Logout — server blacklists the refresh token and clears both cookies
   * via Set-Cookie with max-age=0.  Pass the refresh token from the JSON
   * response body (if you saved it in React state); the server also reads
   * the httpOnly cookie as a fallback.
   */
  logout: (refresh?: string) =>
    apiFetch<{ success: boolean; message: string }>("/auth/logout/", {
      method: "POST",
      body:   JSON.stringify(refresh ? { refresh } : {}),
    }),

  register: (data: {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    password2: string;
    role: "teacher" | "student";
  }) =>
    apiFetch<{ success: boolean; message: string; user: AuthUser }>("/auth/register/", {
      method: "POST",
      body:   JSON.stringify(data),
    }),

  changePassword: (old_password: string, new_password: string) =>
    apiFetch<{ success: boolean; message: string }>("/auth/change-password/", {
      method: "POST",
      body:   JSON.stringify({ old_password, new_password }),
    }),
};

// ---------------------------------------------------------------------------
// Users  —  /api/v1/users/  (admin only)
// ---------------------------------------------------------------------------
export const usersApi = {
  list: (params?: { role?: UserRole; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.role)   q.set("role", params.role);
    if (params?.search) q.set("search", params.search);
    const qs = q.toString();
    return apiFetch<PaginatedResponse<ApiUserListItem>>(`/users/${qs ? `?${qs}` : ""}`);
  },
  detail: (id: number) => apiFetch<AuthUser>(`/users/${id}/`),
  create: (data: { email: string; first_name: string; last_name: string; password: string; role: UserRole }) =>
    apiFetch<{ success: boolean; message: string; user: AuthUser }>("/users/", {
      method: "POST", body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Pick<AuthUser, "first_name" | "last_name" | "is_active">>) =>
    apiFetch<AuthUser>(`/users/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) =>
    apiFetch<{ success: boolean; message: string }>(`/users/${id}/`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Notifications  —  /api/v1/notifications/
// ---------------------------------------------------------------------------
export const notificationsApi = {
  list:       ()        => apiFetch<PaginatedResponse<ApiNotification>>("/notifications/"),
  unreadCount:()        => apiFetch<UnreadCountResponse>("/notifications/unread-count/"),
  markRead:   (id: number) =>
    apiFetch<{ success: boolean }>(`/notifications/${id}/read/`, { method: "PATCH" }),
  markAllRead:()        =>
    apiFetch<{ success: boolean }>("/notifications/read-all/", { method: "POST" }),
};

// ---------------------------------------------------------------------------
// Messages  —  /api/v1/notifications/messages/
// ---------------------------------------------------------------------------
export const messagesApi = {
  inbox:       ()           => apiFetch<PaginatedResponse<ApiMessage>>("/notifications/messages/"),
  sent:        ()           => apiFetch<PaginatedResponse<ApiMessage>>("/notifications/messages/sent/"),
  unreadCount: ()           => apiFetch<UnreadCountResponse>("/notifications/messages/unread-count/"),
  replies:     (id: number) => apiFetch<PaginatedResponse<ApiMessage>>(`/notifications/messages/${id}/replies/`),
  send: (data: {
    recipient?: number; course?: number;
    message_type: "direct" | "announcement" | "course_update";
    subject: string; body: string; parent?: number;
  }) =>
    apiFetch<{ success: boolean; data: ApiMessage }>("/notifications/messages/send/", {
      method: "POST", body: JSON.stringify(data),
    }),
  announce: (data: { subject: string; body: string }) =>
    apiFetch<{ success: boolean; data: ApiMessage }>("/notifications/messages/announce/", {
      method: "POST", body: JSON.stringify(data),
    }),
  markRead: (id: number) =>
    apiFetch<{ success: boolean }>(`/notifications/messages/${id}/read/`, { method: "PATCH" }),
};

// ---------------------------------------------------------------------------
// Dashboard  —  /api/v1/dashboard/
// ---------------------------------------------------------------------------
export interface AdminDashboardData {
  totals: {
    users: number; teachers: number; students: number; courses: number;
    published_courses: number; enrollments: number; active_enrollments: number;
    successful_payments: number;
  };
  last_30_days: { new_users: number; new_enrollments: number; new_payments: number };
  top_courses: Array<{ id: number; title: string; enroll_count: number }>;
}
export interface TeacherDashboardData {
  total_courses: number; total_students: number; total_lessons: number;
  courses: Array<{ id: number; title: string; status: string; is_premium: boolean; student_count: number; lesson_count: number }>;
}
export interface StudentDashboardData {
  total_enrolled: number; active_courses: number; locked_courses: number; completed_courses: number;
  enrollments: Array<{
    enrollment_id: number; enrollment_status: "pending"|"active"|"completed"|"locked";
    course_id: number; course_title: string; is_premium: boolean;
    total_lessons: number; completed_lessons: number; completion_percentage: number;
    next_lesson: { id: number; title: string; order: number } | null;
  }>;
}
export const dashboardApi = {
  admin:   () => apiFetch<{ success: boolean; data: AdminDashboardData }>("/dashboard/admin/"),
  teacher: () => apiFetch<{ success: boolean; data: TeacherDashboardData }>("/dashboard/teacher/"),
  student: () => apiFetch<{ success: boolean; data: StudentDashboardData }>("/dashboard/student/"),
};

// ---------------------------------------------------------------------------
// Courses  —  /api/v1/courses/
// ---------------------------------------------------------------------------
export interface ApiCourseListItem {
  id: number; title: string; slug: string; teacher_name: string;
  thumbnail: string | null; status: "draft"|"published"|"archived";
  is_premium: boolean; price: string; category: string;
  lesson_count: number; enrolled_count: number; created_at: string;
}
export interface ApiLesson {
  id: number; course?: number; title: string; description?: string;
  video_url: string; file_url: string; order: number;
  status: "draft"|"published"; duration_min: number;
  created_at?: string; updated_at?: string;
}
export interface ApiCourse extends ApiCourseListItem {
  teacher: number; description: string; tags: string;
  updated_at: string; lessons: ApiLesson[];
}
export const coursesApi = {
  list: (params?: { search?: string; category?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.search)   q.set("search", params.search);
    if (params?.category) q.set("category", params.category);
    if (params?.status)   q.set("status", params.status);
    const qs = q.toString();
    return apiFetch<PaginatedResponse<ApiCourseListItem>>(`/courses/${qs ? `?${qs}` : ""}`);
  },
  detail:  (id: number) => apiFetch<ApiCourse>(`/courses/${id}/`),
  create:  (data: { title: string; description: string; category?: string; tags?: string; is_premium?: boolean; price?: number; teacher?: number }) =>
    apiFetch<{ success: boolean; message: string; course: ApiCourse }>("/courses/", { method: "POST", body: JSON.stringify(data) }),
  update:  (id: number, data: Partial<Pick<ApiCourse, "title"|"description"|"category"|"tags"|"is_premium"> & { price: number }>) =>
    apiFetch<ApiCourse>(`/courses/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete:  (id: number) =>
    apiFetch<{ success: boolean; message: string }>(`/courses/${id}/`, { method: "DELETE" }),
  publish: (id: number, action: "publish"|"unpublish"|"archive"|"reactivate") =>
    apiFetch<{ success: boolean; message: string; course_id: number; status: string }>(
      `/courses/${id}/publish/`, { method: "POST", body: JSON.stringify({ action }) }),
};

// ---------------------------------------------------------------------------
// Lessons  —  /api/v1/courses/<courseId>/lessons/
// ---------------------------------------------------------------------------
export const lessonsApi = {
  list:   (courseId: number) => apiFetch<PaginatedResponse<ApiLesson>>(`/courses/${courseId}/lessons/`),
  detail: (courseId: number, lessonId: number) => apiFetch<ApiLesson>(`/courses/${courseId}/lessons/${lessonId}/`),
  create: (courseId: number, data: { title: string; description?: string; video_url?: string; file_url?: string; order?: number; duration_min?: number }) =>
    apiFetch<{ success: boolean; message: string; lesson: ApiLesson }>(`/courses/${courseId}/lessons/`, {
      method: "POST", body: JSON.stringify({ ...data, course: courseId }),
    }),
  update: (courseId: number, lessonId: number, data: Partial<ApiLesson>) =>
    apiFetch<ApiLesson>(`/courses/${courseId}/lessons/${lessonId}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (courseId: number, lessonId: number) =>
    apiFetch<{ success: boolean; message: string }>(`/courses/${courseId}/lessons/${lessonId}/`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Enrollments / Progress / Payments / Attendance  (signatures unchanged)
// ---------------------------------------------------------------------------
export interface ApiEnrollment {
  id: number; student: number; student_detail: ApiUserListItem; course: number;
  course_detail: ApiCourseListItem; status: "pending"|"active"|"completed"|"locked";
  enrolled_at: string; updated_at: string; completed_at: string | null;
}
export const enrollmentsApi = {
  list:   (params?: { status?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    return apiFetch<PaginatedResponse<ApiEnrollment>>(`/enrollments/${q.toString() ? `?${q}` : ""}`);
  },
  detail: (id: number) => apiFetch<ApiEnrollment>(`/enrollments/${id}/`),
  create: (courseId: number, studentId?: number) =>
    apiFetch<ApiEnrollment>("/enrollments/", { method: "POST", body: JSON.stringify({ course: courseId, ...(studentId ? { student: studentId } : {}) }) }),
  updateStatus: (id: number, enrollmentStatus: "active"|"completed"|"locked") =>
    apiFetch<ApiEnrollment>(`/enrollments/${id}/`, { method: "PATCH", body: JSON.stringify({ status: enrollmentStatus }) }),
  complete: (id: number) =>
    apiFetch<{ success: boolean; message: string }>(`/enrollments/${id}/complete/`, { method: "POST" }),
};

export interface ApiProgress {
  id: number; student: number; lesson: number; lesson_detail: ApiLesson;
  completed: boolean; completed_at: string | null; created_at: string; updated_at: string;
}
export interface ApiCourseProgress {
  success: boolean; course_id: number; enrollment_status: string;
  total_lessons: number; completed_lessons: number; completion_percentage: number;
  lessons: Array<{ lesson_id: number; title: string; order: number; completed: boolean; completed_at: string | null }>;
}
export const progressApi = {
  list: () => apiFetch<PaginatedResponse<ApiProgress>>("/progress/"),
  markComplete: (lessonId: number) =>
    apiFetch<{ success: boolean; message: string; progress: ApiProgress; course_completion_percentage: number }>(
      "/progress/complete/", { method: "POST", body: JSON.stringify({ lesson_id: lessonId }) }),
  courseProgress: (courseId: number) => apiFetch<ApiCourseProgress>(`/progress/course/${courseId}/`),
};

export interface ApiPayment {
  id: number; student: number; course: number; amount: string;
  status: "pending"|"success"|"failed"; reference: string;
  payment_method: string; failure_reason: string; created_at: string; updated_at: string;
}
export const paymentsApi = {
  list:   () => apiFetch<PaginatedResponse<ApiPayment>>("/payments/"),
  detail: (id: number) => apiFetch<ApiPayment>(`/payments/${id}/`),
  initiate: (data: { course_id: number; payment_method?: "mock_card"|"mock_bank"|"mock_wallet"; simulate?: "success"|"fail" }) =>
    apiFetch<{ success: boolean; message: string; payment?: ApiPayment; enrollment?: ApiEnrollment }>(
      "/payments/initiate/", { method: "POST", body: JSON.stringify({ payment_method: "mock_card", simulate: "success", ...data }) }),
};

export interface ApiAttendanceRecord {
  id: number; student: number; student_detail: ApiUserListItem; course: number;
  course_title: string; marked_by: number | null; marked_by_name: string | null;
  date: string; status: "present"|"absent"|"late"|"excused"; notes: string;
  created_at: string; updated_at: string;
}
export interface ApiAttendanceSummary {
  success: boolean; course: { id: number; title: string };
  summaries: Array<{ student_id: number; student_name: string; student_email: string;
    total: number; present: number; absent: number; late: number; excused: number; percentage: number }>;
}
export const attendanceApi = {
  list: (params?: { course?: number; date?: string; student?: number }) => {
    const q = new URLSearchParams();
    if (params?.course)  q.set("course",  String(params.course));
    if (params?.date)    q.set("date",    params.date);
    if (params?.student) q.set("student", String(params.student));
    return apiFetch<PaginatedResponse<ApiAttendanceRecord>>(`/attendance/${q.toString() ? `?${q}` : ""}`);
  },
  detail: (id: number) => apiFetch<ApiAttendanceRecord>(`/attendance/${id}/`),
  create: (data: { student: number; course: number; date: string; status: "present"|"absent"|"late"|"excused"; notes?: string }) =>
    apiFetch<{ success: boolean; message: string; data: ApiAttendanceRecord }>("/attendance/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { status?: "present"|"absent"|"late"|"excused"; notes?: string }) =>
    apiFetch<ApiAttendanceRecord>(`/attendance/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) =>
    apiFetch<{ success: boolean; message: string }>(`/attendance/${id}/`, { method: "DELETE" }),
  bulk: (courseId: number, date: string, records: Array<{ student: number; status: "present"|"absent"|"late"|"excused"; notes?: string }>) =>
    apiFetch<{ success: boolean; message: string; errors: unknown[] }>(
      "/attendance/bulk/", { method: "POST", body: JSON.stringify({ course: courseId, date, records }) }),
  summary: (courseId: number) => apiFetch<ApiAttendanceSummary>(`/attendance/summary/?course=${courseId}`),
};
