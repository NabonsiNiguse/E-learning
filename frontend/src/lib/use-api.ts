/**
 * Cached API hooks — every data fetch goes through React Query.
 * Import these instead of calling API functions directly in components.
 *
 * Benefits:
 *  - Instant navigation (cached data shown immediately)
 *  - Background revalidation
 *  - Deduplication (same query called from multiple components = 1 request)
 *  - Automatic retry on network errors
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { QK } from "./query-client";
import {
  dashboardApi, coursesApi, lessonsApi, enrollmentsApi,
  progressApi, paymentsApi, attendanceApi, usersApi,
  notificationsApi, messagesApi, authApi,
  type UserRole,
} from "./api";
import { getResults, updateResultScore, submitResult, approveResult, unlockResult,
  getGradingScales, createGradingScale, updateGradingScale,
  getGradeAppeals, createGradeAppeal, type GradingScale } from "./api-results";
import { apiClient } from "./api-client";

// ─── Auth ─────────────────────────────────────────────────────────────────
export function useMe() {
  return useQuery({
    queryKey: QK.me(),
    queryFn:  () => authApi.me(),
    staleTime: 1000 * 60 * 10, // 10 min
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────
export function useAdminDashboard() {
  return useQuery({
    queryKey:        QK.dashboard.admin(),
    queryFn:         () => dashboardApi.admin().then(r => r.data),
    staleTime:       1000 * 60 * 5,
    gcTime:          1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });
}

export function useTeacherDashboard() {
  return useQuery({
    queryKey:        QK.dashboard.teacher(),
    queryFn:         () => dashboardApi.teacher().then(r => r.data),
    staleTime:       1000 * 60 * 5,   // 5 min — show cached instantly, refresh in bg
    gcTime:          1000 * 60 * 30,  // keep in memory 30 min
    placeholderData: keepPreviousData, // never flash a spinner on re-visit
  });
}

export function useStudentDashboard() {
  return useQuery({
    queryKey:        QK.dashboard.student(),
    queryFn:         () => dashboardApi.student().then(r => r.data),
    staleTime:       1000 * 60 * 5,
    gcTime:          1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });
}

// Unified role-aware dashboard stats endpoint
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard","stats"],
    queryFn:  () => dashboardApi.stats().then((r) => r),
    staleTime: 1000 * 30, // 30s
  });
}

// ─── Courses ──────────────────────────────────────────────────────────────
export function useCourses(params?: { search?: string; category?: string; status?: string }) {
  return useQuery({
    queryKey: QK.courses(params),
    queryFn:  () => coursesApi.list(params),
  });
}

export function useCourse(id: number) {
  return useQuery({
    queryKey: QK.course(id),
    queryFn:  () => coursesApi.detail(id),
    enabled:  !!id,
  });
}

export function useLessons(courseId: number) {
  return useQuery({
    queryKey: QK.lessons(courseId),
    queryFn:  () => lessonsApi.list(courseId),
    enabled:  !!courseId,
  });
}

// ─── Enrollments ──────────────────────────────────────────────────────────
export function useEnrollments(params?: { status?: string }) {
  return useQuery({
    queryKey: QK.enrollments(params),
    queryFn:  () => enrollmentsApi.list(params),
  });
}

// ─── Progress ─────────────────────────────────────────────────────────────
export function useCourseProgress(courseId: number) {
  return useQuery({
    queryKey: QK.progress(courseId),
    queryFn:  () => progressApi.courseProgress(courseId),
    enabled:  !!courseId,
  });
}

// ─── Results ──────────────────────────────────────────────────────────────
export function useResults(params?: { year?: number; semester?: string; status?: string }) {
  return useQuery({
    queryKey: QK.results(params),
    queryFn:  () => getResults(params),
    staleTime: 1000 * 60 * 3,
  });
}

export function useGradingScales() {
  return useQuery({
    queryKey: QK.gradingScales(),
    queryFn:  getGradingScales,
    staleTime: 1000 * 60 * 10, // scales rarely change
  });
}

export function useAppeals() {
  return useQuery({
    queryKey: QK.appeals(),
    queryFn:  getGradeAppeals,
  });
}

// ─── Attendance ───────────────────────────────────────────────────────────
export function useAttendanceRecords(params?: { course?: number; date?: string; student?: number }) {
  return useQuery({
    queryKey: QK.attendance(params),
    queryFn:  () => attendanceApi.list(params),
  });
}

// ─── Users ────────────────────────────────────────────────────────────────
export function useUsers(params?: { role?: UserRole; search?: string }) {
  return useQuery({
    queryKey: QK.users(params),
    queryFn:  () => usersApi.list(params),
  });
}

// ─── Notifications ────────────────────────────────────────────────────────
export function useNotifications() {
  return useQuery({
    queryKey: QK.notifications(),
    queryFn:  () => notificationsApi.list(),
    staleTime: 1000 * 30, // 30 sec — notifications should be fresh
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────
export function useMessages() {
  return useQuery({
    queryKey: QK.messages(),
    queryFn:  () => messagesApi.inbox(),
    staleTime: 1000 * 30,
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────
export function usePayments() {
  return useQuery({
    queryKey: QK.payments(),
    queryFn:  () => paymentsApi.list(),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────
export function useUpdateScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, score }: { id: number; score: number }) => updateResultScore(id, score),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["results"] }),
  });
}

export function useSubmitResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => submitResult(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["results"] }),
  });
}

export function useApproveResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => approveResult(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["results"] }),
  });
}

export function useUnlockResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => unlockResult(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["results"] }),
  });
}

export function useCreateAppeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { result: number; reason: string }) => createGradeAppeal(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appeals"] }),
  });
}

export function useCreateGradingScale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createGradingScale>[0]) => createGradingScale(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.gradingScales() }),
  });
}

export function useUpdateGradingScale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateGradingScale>[1] }) =>
      updateGradingScale(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.gradingScales() }),
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof coursesApi.create>[0]) => coursesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => coursesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function usePublishCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: "publish" | "unpublish" | "archive" | "reactivate" }) =>
      coursesApi.publish(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useInitiatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof paymentsApi.initiate>[0]) => paymentsApi.initiate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrollments"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.notifications() }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.notifications() }),
  });
}

// ─── Progress mutation: mark a lesson complete ─────────────────────────────
export function useMarkComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: number) => progressApi.markComplete(lessonId),
    onSuccess: () => {
      // Invalidate any queries that may depend on progress/lessons
      qc.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && ["lessons","progress","course"].includes(String(q.queryKey[0])) });
    },
  });
}

