import {
  createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode,
} from "react";
import {
  mockAssignments, mockSubmissions,
  type Assignment, type AssignmentSubmission, type AssignmentStatus,
} from "@/lib/mock-data";
import { assignmentsApi, getAccessToken } from "@/lib/api";

interface AssignmentContextValue {
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  addAssignment: (a: Omit<Assignment, "id" | "created_at">) => void;
  deleteAssignment: (id: string) => void;
  submitAssignment: (s: Omit<AssignmentSubmission, "id" | "submitted_at" | "status" | "score" | "feedback" | "graded_at" | "graded_by"> & { file?: File | null }) => Promise<void>;
  gradeSubmission: (submissionId: string, score: number, feedback: string, gradedBy: string) => Promise<void>;
  getSubmissionsByAssignment: (assignmentId: string) => AssignmentSubmission[];
  getSubmissionByStudent: (assignmentId: string, studentId: string) => AssignmentSubmission | undefined;
}

const AssignmentContext = createContext<AssignmentContextValue | null>(null);

export function AssignmentProvider({ children }: { children: ReactNode }) {
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(mockSubmissions);
  const hasFetched = useRef(false);

  // Fetch from API when authenticated
  useEffect(() => {
    if (hasFetched.current) return;
    if (!getAccessToken()) return; // no token → keep mock data
    hasFetched.current = true;

    (async () => {
      try {
        const res = await assignmentsApi.list();
        if (res.results && res.results.length > 0) {
          const apiAssignments: Assignment[] = res.results.map((a: any) => ({
            id: String(a.id),
            course_title: a.course_title ?? a.course_detail?.title ?? "",
            title: a.title,
            description: a.description ?? "",
            due_date: a.due_date ?? new Date().toISOString(),
            max_score: a.max_score ?? 100,
            allow_text_response: a.allow_text_response ?? true,
            allow_file_upload: a.allow_file_upload ?? true,
            attachments: a.attachments ?? [],
            created_at: a.created_at ?? new Date().toISOString(),
          }));
          setAssignments(apiAssignments);
        }
      } catch (err) {
        console.warn("assignmentsApi.list failed, using mocks:", err);
      }

      try {
        const sres = await assignmentsApi.submissions.list();
        if (sres.results && sres.results.length > 0) {
          const apiSubs: AssignmentSubmission[] = sres.results.map((s: any) => ({
            id: String(s.id),
            assignment_id: String(s.assignment ?? s.assignment_id ?? s.assignment_detail?.id),
            student_id: String(s.student ?? s.student_id),
            student_name: s.student_detail?.full_name ?? s.student_name ?? "",
            student_avatar: (s.student_detail?.full_name ?? "").split(" ").map((w: string) => w[0]).join("").toUpperCase(),
            submitted_at: s.submitted_at ?? s.created_at ?? new Date().toISOString(),
            status: s.status ?? (s.score != null ? "graded" : "submitted"),
            score: s.score ?? null,
            feedback: s.feedback ?? "",
            graded_at: s.graded_at ?? null,
            graded_by: s.graded_by ?? null,
            is_late: s.is_late ?? false,
            file_url: s.file_url ?? null,
            file_name: s.file_name ?? null,
          }));
          setSubmissions(apiSubs);
        }
      } catch (err) {
        console.warn("assignmentsApi.submissions.list failed, using mocks:", err);
      }
    })();
  }, []);

  const addAssignment = useCallback((a: Omit<Assignment, "id" | "created_at">) => {
    setAssignments((prev) => [{
      ...a,
      id:         `asgn-${Date.now()}`,
      created_at: new Date().toISOString(),
    }, ...prev]);
  }, []);

  const deleteAssignment = useCallback((id: string) => {
    if (getAccessToken() && !String(id).startsWith("local-")) {
      assignmentsApi.delete(Number(id)).catch(() => {});
    }
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const submitAssignment = useCallback(
    async (s: Omit<AssignmentSubmission, "id" | "submitted_at" | "status" | "score" | "feedback" | "graded_at" | "graded_by"> & { file?: File | null }) => {
      const now = new Date().toISOString();
      const assignment = assignments.find((a) => a.id === s.assignment_id);
      const isLate = assignment ? new Date() > new Date(assignment.due_date) : false;

      // Try API if authenticated
      if (getAccessToken()) {
        try {
          await assignmentsApi.submit(Number(s.assignment_id), {
            text_response: s.text_response ?? undefined,
            file: s.file ?? null,
            student_id: Number(s.student_id),
            student_name: s.student_name,
          });
        } catch (err) {
          console.warn("Failed to submit assignment via API, saving locally:", err);
        }
      }

      // Always update local state so UI reflects submission immediately
      setSubmissions((prev) => [{
        ...s,
        id:           `sub-${Date.now()}`,
        submitted_at: now,
        status:       isLate ? "late" : "submitted",
        score:        null,
        feedback:     "",
        graded_at:    null,
        graded_by:    null,
        is_late:      isLate,
      }, ...prev]);
    },
    [assignments]
  );

  const gradeSubmission = useCallback(
    async (submissionId: string, score: number, feedback: string, gradedBy: string) => {
      if (getAccessToken() && !String(submissionId).startsWith("local-")) {
        try {
          await assignmentsApi.submissions.grade(Number(submissionId), { score, feedback });
        } catch (err) {
          console.warn("Failed to grade via API, updating locally:", err);
        }
      }
      setSubmissions((prev) => prev.map((s) =>
        s.id === submissionId
          ? { ...s, score, feedback, status: "graded" as AssignmentStatus, graded_at: new Date().toISOString(), graded_by: gradedBy }
          : s
      ));
    },
    []
  );

  const getSubmissionsByAssignment = useCallback(
    (assignmentId: string) => submissions.filter((s) => s.assignment_id === assignmentId),
    [submissions]
  );

  const getSubmissionByStudent = useCallback(
    (assignmentId: string, studentId: string) =>
      submissions.find((s) => s.assignment_id === assignmentId && s.student_id === studentId),
    [submissions]
  );

  return (
    <AssignmentContext.Provider value={{
      assignments, submissions,
      addAssignment, deleteAssignment, submitAssignment, gradeSubmission,
      getSubmissionsByAssignment, getSubmissionByStudent,
    }}>
      {children}
    </AssignmentContext.Provider>
  );
}

export function useAssignment() {
  const ctx = useContext(AssignmentContext);
  if (!ctx) throw new Error("useAssignment must be used within AssignmentProvider");
  return ctx;
}
