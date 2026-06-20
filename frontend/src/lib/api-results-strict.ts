/**
 * Results API client — STRICT role-based data exposure.
 * Backend returns COMPLETELY DIFFERENT data per role.
 * 
 * TEACHER: Only student_name, course_title, raw_score
 * STUDENT: Only own data with grade_letter, gpa, pass_fail
 * ADMIN: Full data including status and submission details
 */

import { apiClient } from "./api-client";

// ─── TEACHER VIEW: Only student name, course, raw score ───────────────────

export interface TeacherResult {
  id: number;
  student_name: string;
  course_title: string;
  year: number;
  semester: "semester_1" | "semester_2" | "summer";
  raw_score: number | null;
}

// ─── STUDENT VIEW: Own data with final score, grade, GPA ──────────────────

export interface StudentResult {
  id: number;
  course_title: string;
  course_teacher: string;
  year: number;
  semester: "semester_1" | "semester_2" | "summer";
  raw_score: number | null;
  grade_letter: string | null;
  gpa: number | null;
  pass_fail: "pass" | "fail" | null;
}

// ─── ADMIN VIEW: Full data including status and submission details ────────

export interface AdminResult {
  id: number;
  student: number;
  student_detail: {
    id: number;
    email: string;
    full_name: string;
  };
  course: number;
  course_title: string;
  course_teacher: string;
  year: number;
  semester: "semester_1" | "semester_2" | "summer";
  raw_score: number | null;
  grade_letter: string | null;
  gpa: number | null;
  pass_fail: "pass" | "fail" | null;
  status: "draft" | "submitted" | "approved" | "unlocked";
  submitted_at: string | null;
  submitted_by: number | null;
  approved_at: string | null;
  approved_by: number | null;
  unlocked_at: string | null;
  unlocked_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface GradingRule {
  id: number;
  letter: string;
  min_score: number;
  max_score: number;
  gpa_points: number;
  pass_fail: "pass" | "fail";
}

export interface GradingScale {
  id: number;
  name: string;
  is_active: boolean;
  rules: GradingRule[];
  created_by: { id: number; full_name: string };
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: number;
  action: string;
  performed_by: number;
  performed_by_detail: {
    id: number;
    email: string;
    full_name: string;
  };
  performed_by_role: string;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  note: string;
  timestamp: string;
}

export interface GradeAppeal {
  id: number;
  result: number;
  student: number;
  student_detail: {
    id: number;
    email: string;
    full_name: string;
  };
  reason: string;
  status: "pending" | "reviewed" | "escalated" | "approved" | "rejected";
  teacher_response: string;
  teacher_reviewed_by: number | null;
  teacher_reviewed_at: string | null;
  override_score: number | null;
  override_reason: string;
  override_by: number | null;
  override_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Results endpoints ───────────────────────────────────────────────────────

/**
 * Get results based on user role.
 * Backend returns COMPLETELY DIFFERENT data per role:
 * - Teacher: student_name, course_title, raw_score only
 * - Student: own results with grade, GPA, pass_fail
 * - Admin: full data including status and submission details
 */
export async function getResults(params?: {
  year?: number;
  semester?: string;
  status?: string;
  page?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.year) queryParams.append("year", params.year.toString());
  if (params?.semester) queryParams.append("semester", params.semester);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.page) queryParams.append("page", params.page.toString());

  const response = await apiClient.get(
    `/results/?${queryParams.toString()}`
  );
  return response.data;
}

/**
 * Get a single result detail.
 * Returns role-specific data.
 */
export async function getResultDetail(resultId: number) {
  const response = await apiClient.get(`/results/${resultId}/`);
  return response.data;
}

/**
 * Teacher updates raw score only.
 * Backend validates that only raw_score is in the request.
 */
export async function updateResultScore(
  resultId: number,
  rawScore: number
) {
  const response = await apiClient.patch(`/results/${resultId}/`, {
    raw_score: rawScore,
  });
  return response.data;
}

/**
 * Teacher submits scores — locks the result.
 */
export async function submitResult(resultId: number) {
  const response = await apiClient.post(`/results/${resultId}/submit/`, {});
  return response.data;
}

/**
 * Admin approves final results.
 */
export async function approveResult(resultId: number) {
  const response = await apiClient.post(`/results/${resultId}/approve/`, {});
  return response.data;
}

/**
 * Admin unlocks result for correction.
 */
export async function unlockResult(resultId: number) {
  const response = await apiClient.post(`/results/${resultId}/unlock/`, {});
  return response.data;
}

/**
 * Get audit log for a result (admin only).
 */
export async function getResultAuditLog(resultId: number) {
  const response = await apiClient.get(
    `/results/audit_log/?result_id=${resultId}`
  );
  return response.data as AuditLogEntry[];
}

// ─── Grading scales ─────────────────────────────────────────────────────────

/**
 * Get all grading scales (admin only).
 */
export async function getGradingScales() {
  const response = await apiClient.get("/results/grading-scales/");
  return response.data as GradingScale[];
}

/**
 * Get active grading scale.
 */
export async function getActiveGradingScale() {
  const scales = await getGradingScales();
  return scales.find((s) => s.is_active);
}

/**
 * Create grading scale (admin only).
 */
export async function createGradingScale(data: {
  name: string;
  is_active: boolean;
  rules: Array<{
    letter: string;
    min_score: number;
    max_score: number;
    gpa_points: number;
    pass_fail: "pass" | "fail";
  }>;
}) {
  const response = await apiClient.post("/results/grading-scales/", data);
  return response.data as GradingScale;
}

/**
 * Update grading scale (admin only).
 */
export async function updateGradingScale(
  scaleId: number,
  data: Partial<{
    name: string;
    is_active: boolean;
    rules: Array<{
      letter: string;
      min_score: number;
      max_score: number;
      gpa_points: number;
      pass_fail: "pass" | "fail";
    }>;
  }>
) {
  const response = await apiClient.patch(
    `/results/grading-scales/${scaleId}/`,
    data
  );
  return response.data as GradingScale;
}

// ─── Grade appeals ──────────────────────────────────────────────────────────

/**
 * Get grade appeals based on user role.
 */
export async function getGradeAppeals() {
  const response = await apiClient.get("/results/appeals/");
  return response.data as GradeAppeal[];
}

/**
 * Create grade appeal (student only).
 */
export async function createGradeAppeal(data: {
  result: number;
  reason: string;
}) {
  const response = await apiClient.post("/results/appeals/", data);
  return response.data as GradeAppeal;
}

/**
 * Teacher reviews appeal.
 */
export async function reviewGradeAppeal(
  appealId: number,
  teacherResponse: string
) {
  const response = await apiClient.post(
    `/results/appeals/${appealId}/review/`,
    { teacher_response: teacherResponse }
  );
  return response.data as GradeAppeal;
}

/**
 * Admin overrides grade via appeal.
 */
export async function overrideGradeAppeal(
  appealId: number,
  overrideScore: number,
  overrideReason: string
) {
  const response = await apiClient.post(
    `/results/appeals/${appealId}/override/`,
    {
      override_score: overrideScore,
      override_reason: overrideReason,
    }
  );
  return response.data as GradeAppeal;
}
