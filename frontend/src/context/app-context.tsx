/**
 * AppContext — thin wrapper that wires AuthContext + MessagingProvider
 * together and exposes the course/unlock helpers used by existing pages.
 *
 * Role and currentUser now come from AuthContext (real API or mock fallback).
 * Courses are fetched from API with fallback to mock data.
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react";
import { mockCourses, type Course } from "@/lib/mock-data";
import { MessagingProvider } from "./messaging-context";
import { AuthProvider, useAuth } from "./auth-context";
import { AttendanceProvider } from "./attendance-context";
import { MaterialsProvider } from "./materials-context";
import { QuizProvider } from "./quiz-context";
import { AssignmentProvider } from "./assignment-context";
import { QAProvider } from "./qa-context";
import type { UserRole } from "@/lib/api";
import { coursesApi } from "@/lib/api";

// Re-export Role type so existing imports keep working
export type { UserRole as Role };

interface AppContextValue {
  courses: Course[];
  unlockCourse: (id: string) => void;
  deleteCourse: (id: string) => void;
  loading: boolean;
  error: string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

function AppContextInner({ children }: { children: ReactNode }) {
  const { role, isAuthenticated } = useAuth();
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // Fetch courses once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    if (hasFetched.current) return;
    hasFetched.current = true;

    const loadCourses = async () => {
      try {
        setLoading(true);
        const response = await coursesApi.list();
        if (response.results) {
          const apiCourses: Course[] = response.results.map((c) => ({
            id: String(c.id),
            title: c.title,
            description: c.description,
            category: c.category,
            level: "Intermediate" as const,
            thumbnail: c.thumbnail || "from-blue-400 to-indigo-500",
            thumbnailImg: c.thumbnail || undefined,
            lessons: c.lesson_count,
            rating: 4.8,
            students: c.enrolled_count,
            price: parseFloat(c.price),
            progress: 0,
            locked: c.status !== "published",
            duration: "8 weeks",
            instructor: c.teacher_name,
            tags: c.tags ? c.tags.split(",") : [],
          }));
          setCourses(apiCourses);
        }
      } catch (err) {
        console.warn("Courses API unavailable:", err);
        setError(err instanceof Error ? err.message : "Failed to load courses");
        // Fall back to mock courses so the UI isn't empty
        setCourses(mockCourses);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [isAuthenticated]);

  const processedCourses = useMemo(() => courses.map((c) => ({
    ...c,
    locked: role === "admin" || role === "teacher"
      ? false
      : c.locked && !unlocked.includes(c.id),
  })), [courses, role, unlocked]);

  const unlockCourse = useCallback((id: string) => setUnlocked((prev) => [...prev, id]), []);
  
  const deleteCourse = useCallback(async (id: string) => {
    try {
      await coursesApi.delete(parseInt(id, 10));
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete course:", err);
      throw err;
    }
  }, []);

  const ctxValue = useMemo(() => ({
    courses: processedCourses, unlockCourse, deleteCourse, loading, error,
  }), [processedCourses, unlockCourse, deleteCourse, loading, error]);

  return (
    <AppContext.Provider value={ctxValue}>
      <MessagingProvider role={role}>
        <AttendanceProvider>
          <MaterialsProvider>
            <QuizProvider>
              <AssignmentProvider>
                <QAProvider>
                  {children}
                </QAProvider>
              </AssignmentProvider>
            </QuizProvider>
          </MaterialsProvider>
        </AttendanceProvider>
      </MessagingProvider>
    </AppContext.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppContextInner>{children}</AppContextInner>
    </AuthProvider>
  );
}

/**
 * useApp — returns role, currentUser, courses, unlockCourse.
 * Merges AuthContext + AppContext so call sites don't need to change.
 */
export function useApp() {
  const auth = useAuth();
  const ctx  = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");

  return {
    role:            auth.role,
    setRole:         (_r: UserRole) => {},  // no-op — role comes from real JWT
    currentUser:     auth.currentUser,
    isAuthenticated: auth.isAuthenticated,
    isLoading:       auth.isLoading,
    login:           auth.login,
    logout:          auth.logout,
    courses:         ctx.courses,
    unlockCourse:    ctx.unlockCourse,
    deleteCourse:    ctx.deleteCourse,
    loading:         ctx.loading,
    error:           ctx.error,
  };
}

export { MessagingProvider } from "./messaging-context";
export { useAuth } from "./auth-context";
export { useAttendance } from "./attendance-context";
export { useMaterials } from "./materials-context";
export { useQuiz } from "./quiz-context";
export { useAssignment } from "./assignment-context";
