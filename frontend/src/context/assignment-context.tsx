import {
  createContext, useContext, useState, useCallback, type ReactNode,
} from "react";
import {
  mockAssignments, mockSubmissions,
  type Assignment, type AssignmentSubmission, type AssignmentStatus,
} from "@/lib/mock-data";

interface AssignmentContextValue {
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  addAssignment: (a: Omit<Assignment, "id" | "created_at">) => void;
  deleteAssignment: (id: string) => void;
  submitAssignment: (s: Omit<AssignmentSubmission, "id" | "submitted_at" | "status" | "score" | "feedback" | "graded_at" | "graded_by">) => void;
  gradeSubmission: (submissionId: string, score: number, feedback: string, gradedBy: string) => void;
  getSubmissionsByAssignment: (assignmentId: string) => AssignmentSubmission[];
  getSubmissionByStudent: (assignmentId: string, studentId: string) => AssignmentSubmission | undefined;
}

const AssignmentContext = createContext<AssignmentContextValue | null>(null);

export function AssignmentProvider({ children }: { children: ReactNode }) {
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(mockSubmissions);

  const addAssignment = useCallback((a: Omit<Assignment, "id" | "created_at">) => {
    setAssignments((prev) => [{
      ...a,
      id:         `asgn-${Date.now()}`,
      created_at: new Date().toISOString(),
    }, ...prev]);
  }, []);

  const deleteAssignment = useCallback((id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const submitAssignment = useCallback(
    (s: Omit<AssignmentSubmission, "id" | "submitted_at" | "status" | "score" | "feedback" | "graded_at" | "graded_by">) => {
      const now = new Date().toISOString();
      const assignment = assignments.find((a) => a.id === s.assignment_id);
      const isLate = assignment ? new Date() > new Date(assignment.due_date) : false;
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
    (submissionId: string, score: number, feedback: string, gradedBy: string) => {
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
