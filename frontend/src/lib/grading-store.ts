/**
 * Grading Store — shared in-memory state for the university-level grading system.
 *
 * Criteria-based weighted grading:
 *   Teacher defines criteria (Quiz, Midterm, Final, Project, Attendance, etc.)
 *   with weights that sum to 100. Marks are entered per student per criterion.
 *   Final score = Σ (mark / maxMark) * weight.
 *
 * Result release:
 *   Teacher sets releaseMode: "immediate" | "scheduled" | "manual"
 *   Admin can approve (flip approved=true) but cannot change marks.
 *   Students cannot see results until released AND approved.
 */

export type ReleaseMode = "immediate" | "scheduled" | "manual";

export interface GradingCriterion {
  id: string;
  name: string;       // e.g. "Quiz", "Midterm", "Final Exam", "Project"
  weight: number;     // 0-100, all criteria weights must sum to 100
  maxMark: number;    // e.g. 100, 50, 30
}

export interface StudentMark {
  criterionId: string;
  mark: number | null;  // null = not yet graded
}

export interface GradedStudent {
  studentId: string;
  studentName: string;
  studentAvatar: string;
  marks: StudentMark[];
  feedback: string;
  gradedAt: string | null;
  status: "pending" | "graded";
}

export interface CourseGradebook {
  courseId: string;
  courseTitle: string;
  teacherName: string;
  criteria: GradingCriterion[];
  students: GradedStudent[];
  releaseMode: ReleaseMode;
  releaseAt: string | null;   // ISO datetime for scheduled release
  approved: boolean;           // Admin approval
  approvedAt: string | null;
  approvedBy: string | null;
}

// ─── Letter grade helper ──────────────────────────────────────────────────────
export function letterGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "B+";
  if (score >= 80) return "B";
  if (score >= 75) return "C+";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function gradeColor(letter: string): string {
  if (letter === "A+" || letter === "A")  return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
  if (letter === "B+" || letter === "B")  return "text-sky-600 bg-sky-500/10 border-sky-500/20";
  if (letter === "C+" || letter === "C")  return "text-amber-600 bg-amber-500/10 border-amber-500/20";
  if (letter === "D")                     return "text-orange-600 bg-orange-500/10 border-orange-500/20";
  return "text-red-600 bg-red-500/10 border-red-500/20";
}

// ─── Compute final score from marks + criteria ────────────────────────────────
export function computeFinalScore(
  marks: StudentMark[],
  criteria: GradingCriterion[],
): number | null {
  let total = 0;
  let weightUsed = 0;
  for (const c of criteria) {
    const m = marks.find((x) => x.criterionId === c.id);
    if (m?.mark == null) continue;
    total += (m.mark / c.maxMark) * c.weight;
    weightUsed += c.weight;
  }
  if (weightUsed === 0) return null;
  // Scale to 100 if not all criteria are graded yet
  return Math.round((total / weightUsed) * 100) / 1;
}

// ─── Release check ────────────────────────────────────────────────────────────
export function isResultReleased(gb: CourseGradebook): boolean {
  if (!gb.approved) return false;
  if (gb.releaseMode === "immediate") return true;
  if (gb.releaseMode === "manual") return false;
  if (gb.releaseMode === "scheduled" && gb.releaseAt) {
    return new Date() >= new Date(gb.releaseAt);
  }
  return false;
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const DEFAULT_CRITERIA: GradingCriterion[] = [
  { id: "cr1", name: "Quiz",       weight: 20, maxMark: 100 },
  { id: "cr2", name: "Midterm",    weight: 30, maxMark: 100 },
  { id: "cr3", name: "Final Exam", weight: 40, maxMark: 100 },
  { id: "cr4", name: "Project",    weight: 10, maxMark: 100 },
];

const _store: CourseGradebook[] = [
  {
    courseId: "c1",
    courseTitle: "Modern Web Development",
    teacherName: "Nabonsi Niguse",
    criteria: DEFAULT_CRITERIA,
    students: [
      {
        studentId: "u3", studentName: "Keab Niguse", studentAvatar: "KN",
        marks: [
          { criterionId: "cr1", mark: 82 },
          { criterionId: "cr2", mark: 75 },
          { criterionId: "cr3", mark: null },
          { criterionId: "cr4", mark: 90 },
        ],
        feedback: "Strong quiz performance. Midterm needs improvement in async concepts.",
        gradedAt: new Date(Date.now() - 86400000).toISOString(),
        status: "graded",
      },
      {
        studentId: "u4", studentName: "Eyob Haile", studentAvatar: "EH",
        marks: [
          { criterionId: "cr1", mark: 95 },
          { criterionId: "cr2", mark: 88 },
          { criterionId: "cr3", mark: 91 },
          { criterionId: "cr4", mark: 96 },
        ],
        feedback: "Excellent work across all criteria. Outstanding project submission.",
        gradedAt: new Date(Date.now() - 172800000).toISOString(),
        status: "graded",
      },
      {
        studentId: "u6", studentName: "Mikiyas Niguse", studentAvatar: "MN",
        marks: [
          { criterionId: "cr1", mark: 55 },
          { criterionId: "cr2", mark: null },
          { criterionId: "cr3", mark: null },
          { criterionId: "cr4", mark: 60 },
        ],
        feedback: "",
        gradedAt: null,
        status: "pending",
      },
    ],
    releaseMode: "scheduled",
    releaseAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    approved: false,
    approvedAt: null,
    approvedBy: null,
  },
  {
    courseId: "c2",
    courseTitle: "UI/UX Design Foundations",
    teacherName: "Lemi Melkamu",
    criteria: [
      { id: "cr5", name: "Quiz",       weight: 15, maxMark: 100 },
      { id: "cr6", name: "Midterm",    weight: 25, maxMark: 100 },
      { id: "cr7", name: "Final Exam", weight: 35, maxMark: 100 },
      { id: "cr8", name: "Project",    weight: 25, maxMark: 100 },
    ],
    students: [
      {
        studentId: "u3", studentName: "Keab Niguse", studentAvatar: "KN",
        marks: [
          { criterionId: "cr5", mark: 88 },
          { criterionId: "cr6", mark: 79 },
          { criterionId: "cr7", mark: 85 },
          { criterionId: "cr8", mark: 92 },
        ],
        feedback: "Great design sensibility. Final project was impressive.",
        gradedAt: new Date(Date.now() - 259200000).toISOString(),
        status: "graded",
      },
    ],
    releaseMode: "immediate",
    releaseAt: null,
    approved: true,
    approvedAt: new Date(Date.now() - 86400000).toISOString(),
    approvedBy: "Ermiyas Mengistu",
  },
];

// ─── Store API ────────────────────────────────────────────────────────────────
export const gradingStore = {
  getAll: (): CourseGradebook[] => [..._store],

  getByCourse: (courseId: string): CourseGradebook | undefined =>
    _store.find((g) => g.courseId === courseId),

  getByTeacher: (teacherName: string): CourseGradebook[] =>
    _store.filter((g) => g.teacherName === teacherName),

  getByStudent: (studentId: string): Array<{
    gradebook: CourseGradebook;
    student: GradedStudent;
    finalScore: number | null;
    letter: string;
  }> => {
    const results = [];
    for (const gb of _store) {
      const s = gb.students.find((x) => x.studentId === studentId);
      if (!s) continue;
      const score = computeFinalScore(s.marks, gb.criteria);
      results.push({
        gradebook: gb,
        student: s,
        finalScore: score,
        letter: score !== null ? letterGrade(score) : "—",
      });
    }
    return results;
  },

  updateStudentMarks: (
    courseId: string,
    studentId: string,
    marks: StudentMark[],
    feedback: string,
    status: "pending" | "graded",
  ) => {
    const gb = _store.find((g) => g.courseId === courseId);
    if (!gb) return;
    const s = gb.students.find((x) => x.studentId === studentId);
    if (!s) return;
    s.marks    = marks;
    s.feedback = feedback;
    s.status   = status;
    s.gradedAt = status === "graded" ? new Date().toISOString() : null;
  },

  updateCriteria: (courseId: string, criteria: GradingCriterion[]) => {
    const gb = _store.find((g) => g.courseId === courseId);
    if (gb) gb.criteria = criteria;
  },

  setRelease: (courseId: string, mode: ReleaseMode, releaseAt: string | null) => {
    const gb = _store.find((g) => g.courseId === courseId);
    if (!gb) return;
    gb.releaseMode = mode;
    gb.releaseAt   = releaseAt;
  },

  approve: (courseId: string, approverName: string) => {
    const gb = _store.find((g) => g.courseId === courseId);
    if (!gb) return;
    gb.approved   = true;
    gb.approvedAt = new Date().toISOString();
    gb.approvedBy = approverName;
  },

  addGradebook: (gb: CourseGradebook) => {
    const idx = _store.findIndex((g) => g.courseId === gb.courseId);
    if (idx >= 0) _store[idx] = gb;
    else _store.push(gb);
  },
};
