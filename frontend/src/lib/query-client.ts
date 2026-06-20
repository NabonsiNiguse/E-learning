/**
 * Global React Query client with sensible cache settings.
 *
 * staleTime  — data is fresh for this long; no refetch on window focus
 * gcTime     — unused cache entries are garbage-collected after this
 * retry      — don't retry 401/403/404 errors; retry network errors once
 */
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          1000 * 60 * 5,   // 5 min — data stays fresh
      gcTime:             1000 * 60 * 10,  // 10 min — keep in memory
      refetchOnWindowFocus: false,          // don't refetch when tab regains focus
      retry: (failureCount, error) => {
        // Never retry auth/permission/not-found errors
        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) return false;
        // Retry network errors once
        if (error instanceof ApiError && error.status === 0) return failureCount < 1;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

// ─── Query key factory — centralised, type-safe ───────────────────────────
export const QK = {
  dashboard: {
    admin:   () => ["dashboard", "admin"]   as const,
    teacher: () => ["dashboard", "teacher"] as const,
    student: () => ["dashboard", "student"] as const,
  },
  courses:     (params?: object) => ["courses",     params ?? {}] as const,
  course:      (id: number)      => ["course",      id]           as const,
  lessons:     (courseId: number)=> ["lessons",     courseId]     as const,
  enrollments: (params?: object) => ["enrollments", params ?? {}] as const,
  results:     (params?: object) => ["results",     params ?? {}] as const,
  gradingScales:                 () => ["grading-scales"]          as const,
  appeals:                       () => ["appeals"]                 as const,
  attendance:  (params?: object) => ["attendance",  params ?? {}] as const,
  users:       (params?: object) => ["users",       params ?? {}] as const,
  notifications:                 () => ["notifications"]           as const,
  messages:                      () => ["messages"]                as const,
  payments:                      () => ["payments"]                as const,
  progress:    (courseId?: number)=> ["progress",   courseId]     as const,
  me:                            () => ["me"]                      as const,
};
