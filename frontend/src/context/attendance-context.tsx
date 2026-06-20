/**
 * AttendanceContext — manages attendance state.
 *
 * Calls backend API:
 *   GET  /api/v1/attendance/?course=&date=&student=
 *   POST /api/v1/attendance/bulk/
 *   PATCH /api/v1/attendance/<id>/
 *   GET  /api/v1/attendance/summary/?course=
 *
 * Falls back to mock data when the backend is unreachable.
 */
import {
  createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode,
} from "react";
import {
  mockAttendanceRecords,
  type AttendanceRecord, type AttendanceStatus,
} from "@/lib/mock-data";
import { attendanceApi, getAccessToken } from "@/lib/api";

interface AttendanceContextValue {
  records: AttendanceRecord[];
  loading: boolean;
  error: string | null;
  /** Teacher: upsert a single record */
  upsertRecord: (record: Omit<AttendanceRecord, "id" | "marked_by">) => void;
  /** Teacher: bulk-save a full session */
  bulkSave: (
    courseId: string,
    courseTitle: string,
    date: string,
    entries: { student_id: string; student_name: string; student_avatar: string; student_email: string; status: AttendanceStatus; notes: string }[]
  ) => void;
}

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // Only fetch from API if a token exists — avoids 401 redirect loop
  useEffect(() => {
    if (hasFetched.current) return;
    if (!getAccessToken()) return; // no token → stay on mock data
    hasFetched.current = true;

    const loadRecords = async () => {
      try {
        setLoading(true);
        const response = await attendanceApi.list();
        if (response.results && response.results.length > 0) {
          const apiRecords: AttendanceRecord[] = response.results.map((r) => ({
            id:             String(r.id),
            student_id:     String(r.student),                     // FK id field
            student_name:   r.student_detail?.full_name ?? "",     // nested detail
            student_avatar: (r.student_detail?.full_name ?? "")
                              .split(" ").map((w: string) => w[0]).join("").toUpperCase(),
            student_email:  r.student_detail?.email ?? "",
            course_id:      String(r.course),                      // FK id field
            course_title:   r.course_title,                        // method field
            date:           r.date,
            status:         r.status,
            notes:          r.notes,
            marked_by:      r.marked_by_name ?? "",
          }));
          setRecords(apiRecords);
        }
      } catch (err) {
        console.warn("Attendance API unavailable, using mock data:", err);
        setError(err instanceof Error ? err.message : "Failed to load attendance");
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, []);

  const upsertRecord = useCallback(
    (incoming: Omit<AttendanceRecord, "id" | "marked_by">) => {
      setRecords((prev) => {
        const idx = prev.findIndex(
          (r) =>
            r.student_id === incoming.student_id &&
            r.course_id  === incoming.course_id &&
            r.date       === incoming.date
        );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...incoming };
          return updated;
        }
        return [
          ...prev,
          { ...incoming, id: `r-${Date.now()}-${Math.random()}`, marked_by: "You" },
        ];
      });
    },
    []
  );

  const bulkSave = useCallback(
    async (
      courseId: string,
      courseTitle: string,
      date: string,
      entries: { student_id: string; student_name: string; student_avatar: string; student_email: string; status: AttendanceStatus; notes: string }[]
    ) => {
      try {
        // Try to save to API — use correct field names matching BulkAttendanceSerializer
        await attendanceApi.bulk(
          parseInt(courseId, 10),
          date,
          entries.map((e) => ({
            student: parseInt(e.student_id, 10),  // backend expects "student" not "student_id"
            status:  e.status,
            notes:   e.notes,
          }))
        );
      } catch (err) {
        console.warn("Failed to save attendance to API, saving locally:", err);
      }

      // Always update local state
      entries.forEach((e) =>
        upsertRecord({ ...e, course_id: courseId, course_title: courseTitle, date })
      );
    },
    [upsertRecord]
  );

  return (
    <AttendanceContext.Provider value={{ records, loading, error, upsertRecord, bulkSave }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error("useAttendance must be used within AttendanceProvider");
  return ctx;
}
