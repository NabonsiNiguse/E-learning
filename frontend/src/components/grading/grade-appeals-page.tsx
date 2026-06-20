/**
 * Grade Appeals Page
 *
 * Role matrix (strictly enforced):
 *   Student     : submit appeals on OWN graded submissions only; view own appeals only
 *   Teacher     : review PENDING appeals for OWN courses only; mark reviewed or escalate
 *   Super Admin : override ESCALATED appeals only (approve with score / reject); reason ≥ 20 chars
 *   Admin       : read-only view of all appeals — no action buttons
 */
import { useState, useMemo, useEffect } from "react";
import {
  Plus, Search, Award, Clock, CheckCircle2, XCircle,
  AlertCircle, ChevronRight, ShieldCheck, User, Calendar,
  MessageSquare, ArrowUpRight, BookOpen, Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import {
  mockGradeAppeals, mockSubmissions, mockAssignments, mockUsers,
  appealsStore, type GradeAppeal, type AppealStatus,
} from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MIN_OVERRIDE_REASON = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

/**
 * Returns assignment IDs that belong to the given teacher (by name).
 * Used to scope teacher's visible appeals and review actions to their own courses only.
 */
function getTeacherAssignmentIds(teacherName: string): Set<string> {
  return new Set(
    mockAssignments
      .filter((a) => a.created_by === teacherName)
      .map((a) => a.id),
  );
}

/**
 * Resolves the mock student ID (e.g. "u3") from the auth user's email.
 * Mock data uses string IDs; the real backend uses numeric PKs.
 * We match by email as the stable cross-system identifier.
 */
function resolveMockStudentId(email: string | undefined): string {
  if (!email) return "u3";
  const found = mockUsers.find((u) => u.email === email);
  return found?.id ?? "u3";
}

const STATUS_CONFIG: Record<AppealStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending:   { label: "Pending",   color: "bg-amber-500/10 text-amber-600 border-amber-500/20",    icon: Clock },
  reviewed:  { label: "Reviewed",  color: "bg-sky-500/10 text-sky-600 border-sky-500/20",          icon: MessageSquare },
  escalated: { label: "Escalated", color: "bg-violet-500/10 text-violet-600 border-violet-500/20", icon: ArrowUpRight },
  approved:  { label: "Approved",  color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  rejected:  { label: "Rejected",  color: "bg-red-500/10 text-red-600 border-red-500/20",          icon: XCircle },
};

function StatusBadge({ status }: { status: AppealStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge className={cn("gap-1 text-[10px] border", cfg.color)}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Appeal card
// ---------------------------------------------------------------------------
interface AppealCardProps {
  appeal: GradeAppeal;
  role: string;
  teacherAssignmentIds: Set<string>;
  onTeacherReview: (appeal: GradeAppeal) => void;
  onSuperAdminOverride: (appeal: GradeAppeal) => void;
}

function AppealCard({
  appeal, role, teacherAssignmentIds, onTeacherReview, onSuperAdminOverride,
}: AppealCardProps) {
  const assignment = mockAssignments.find((a) => a.id === appeal.assignment_id);
  const submission = mockSubmissions.find((s) => s.id === appeal.submission_id);

  // Teacher can only review PENDING appeals for their OWN courses
  const canTeacherReview =
    role === "teacher" &&
    appeal.status === "pending" &&
    teacherAssignmentIds.has(appeal.assignment_id);

  // Super Admin can only override ESCALATED appeals
  const canOverride = role === "super_admin" && appeal.status === "escalated";

  return (
    <Card className="p-5 border-border shadow-soft hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {appeal.student_avatar}
          </div>
          <div>
            <p className="font-semibold text-sm">{appeal.student_name}</p>
            <p className="text-xs text-muted-foreground">{assignment?.title ?? appeal.assignment_id}</p>
          </div>
        </div>
        <StatusBadge status={appeal.status} />
      </div>

      {/* Current score */}
      {submission?.score !== null && submission?.score !== undefined && (
        <div className="mb-3 rounded-xl bg-secondary/50 border border-border px-3.5 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Current score</span>
            <span className="text-sm font-bold text-primary">
              {submission.score}/{assignment?.max_score}
            </span>
          </div>
          <Progress
            value={(submission.score / (assignment?.max_score ?? 100)) * 100}
            className="h-1.5"
          />
        </div>
      )}

      {/* Student reason */}
      <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300 leading-relaxed mb-3">
        <p className="font-medium mb-1 flex items-center gap-1">
          <User className="h-3 w-3" /> Student's reason
        </p>
        {appeal.reason}
      </div>

      {/* Teacher response */}
      {appeal.teacher_response && (
        <div className="rounded-xl bg-sky-500/5 border border-sky-500/20 px-3.5 py-2.5 text-xs text-sky-800 dark:text-sky-300 leading-relaxed mb-3">
          <p className="font-medium mb-1 flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> Teacher response
          </p>
          {appeal.teacher_response}
          {appeal.teacher_reviewed_by && (
            <p className="mt-1 text-muted-foreground">— {appeal.teacher_reviewed_by}</p>
          )}
        </div>
      )}

      {/* Super admin override result */}
      {(appeal.status === "approved" || appeal.status === "rejected") && appeal.override_reason && (
        <div className={cn(
          "rounded-xl px-3.5 py-2.5 text-xs leading-relaxed mb-3 border",
          appeal.status === "approved"
            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
            : "bg-red-500/5 border-red-500/20 text-red-800 dark:text-red-300",
        )}>
          <p className="font-medium mb-1 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Academic Manager decision
            {appeal.override_score !== null && (
              <span className="ml-auto font-bold">→ {appeal.override_score} pts</span>
            )}
          </p>
          {appeal.override_reason}
          {appeal.override_by && (
            <p className="mt-1 text-muted-foreground">— {appeal.override_by}</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {formatDate(appeal.created_at)}
        </span>
        {canTeacherReview && (
          <Button
            size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => onTeacherReview(appeal)}
          >
            Review <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
        {canOverride && (
          <Button
            size="sm"
            className="h-7 text-xs gap-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0"
            onClick={() => onSuperAdminOverride(appeal)}
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Override
          </Button>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Submit appeal dialog (Student only)
// ---------------------------------------------------------------------------
function SubmitAppealDialog({
  open, onClose, onSubmit, studentId, studentName, studentAvatar,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<GradeAppeal, "id" | "created_at" | "updated_at">) => void;
  studentId: string;
  studentName: string;
  studentAvatar: string;
}) {
  const [submissionId, setSubmissionId] = useState("");
  const [reason, setReason]             = useState("");

  // Only show graded submissions that belong to THIS student
  const eligibleSubs = mockSubmissions.filter(
    (s) => s.status === "graded" && s.student_id === studentId,
  );

  function handleSubmit() {
    if (!submissionId) { toast.error("Please select a submission."); return; }
    if (!reason.trim()) { toast.error("Please provide a reason for your appeal."); return; }
    const sub = mockSubmissions.find((s) => s.id === submissionId);
    if (!sub || sub.student_id !== studentId) {
      toast.error("Invalid submission selected.");
      return;
    }
    onSubmit({
      submission_id: submissionId,
      assignment_id: sub.assignment_id,
      student_id: studentId,
      student_name: studentName,
      student_avatar: studentAvatar,
      reason: reason.trim(),
      status: "pending",
      teacher_response: "",
      teacher_reviewed_by: null,
      teacher_reviewed_at: null,
      override_score: null,
      override_reason: "",
      override_by: null,
      override_at: null,
    });
    setSubmissionId(""); setReason("");
    onClose();
  }

  function handleClose() { setSubmissionId(""); setReason(""); onClose(); }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-amber-500" /> Submit Grade Appeal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Your graded submission *</Label>
            <select
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a submission…</option>
              {eligibleSubs.map((s) => {
                const a = mockAssignments.find((a) => a.id === s.assignment_id);
                return (
                  <option key={s.id} value={s.id}>
                    {a?.title ?? s.assignment_id} — {s.score}/{a?.max_score} pts
                  </option>
                );
              })}
            </select>
            {eligibleSubs.length === 0 && (
              <p className="text-xs text-muted-foreground">No graded submissions available to appeal.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Reason for appeal *</Label>
            <Textarea
              placeholder="Explain clearly why you believe the grade should be reconsidered…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[90px] resize-none text-sm"
            />
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 px-3.5 py-2.5 text-xs text-amber-700">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Your teacher reviews first. If unresolved, it escalates to the Academic Manager.
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
          <Button
            size="sm"
            className="gradient-primary text-white border-0 shadow-glow"
            onClick={handleSubmit}
            disabled={eligibleSubs.length === 0}
          >
            Submit appeal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Teacher review dialog
// ---------------------------------------------------------------------------
function TeacherReviewDialog({
  appeal, open, onClose, onSubmit, teacherName,
}: {
  appeal: GradeAppeal | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, response: string, action: "reviewed" | "escalated") => void;
  teacherName: string;
}) {
  const [response, setResponse] = useState("");
  const [action, setAction]     = useState<"reviewed" | "escalated">("reviewed");

  function handleSubmit() {
    if (!response.trim()) { toast.error("A response is required."); return; }
    if (!appeal) return;
    onSubmit(appeal.id, response.trim(), action);
    setResponse(""); setAction("reviewed");
    onClose();
  }

  function handleClose() { setResponse(""); setAction("reviewed"); onClose(); }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-sky-500" /> Review Appeal
          </DialogTitle>
        </DialogHeader>
        {appeal && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-secondary/50 border border-border px-3.5 py-2.5 text-xs space-y-1">
              <p><span className="text-muted-foreground">Student:</span> {appeal.student_name}</p>
              <p><span className="text-muted-foreground">Assignment:</span> {mockAssignments.find((a) => a.id === appeal.assignment_id)?.title ?? appeal.assignment_id}</p>
            </div>
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300">
              <p className="font-medium mb-1">Student's reason:</p>
              {appeal.reason}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Your response *</Label>
              <Textarea
                placeholder="Explain your decision to the student…"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Action</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAction("reviewed")}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors",
                    action === "reviewed"
                      ? "bg-sky-500/10 border-sky-500/30 text-sky-700"
                      : "border-border text-muted-foreground hover:bg-secondary",
                  )}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mx-auto mb-1" />
                  Mark reviewed
                </button>
                <button
                  onClick={() => setAction("escalated")}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors",
                    action === "escalated"
                      ? "bg-violet-500/10 border-violet-500/30 text-violet-700"
                      : "border-border text-muted-foreground hover:bg-secondary",
                  )}
                >
                  <ArrowUpRight className="h-3.5 w-3.5 mx-auto mb-1" />
                  Escalate to Academic Manager
                </button>
              </div>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
          <Button size="sm" className="gradient-primary text-white border-0 shadow-glow" onClick={handleSubmit}>
            Submit review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Super Admin override dialog
// ---------------------------------------------------------------------------
function OverrideDialog({
  appeal, open, onClose, onSubmit,
}: {
  appeal: GradeAppeal | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, action: "approved" | "rejected", reason: string, score?: number) => void;
}) {
  const [action, setAction]       = useState<"approved" | "rejected">("approved");
  const [reason, setReason]       = useState("");
  const [overrideScore, setScore] = useState("");

  const assignment = appeal ? mockAssignments.find((a) => a.id === appeal.assignment_id) : null;
  const reasonTooShort = reason.trim().length > 0 && reason.trim().length < MIN_OVERRIDE_REASON;

  function handleSubmit() {
    if (!reason.trim()) { toast.error("A reason is required."); return; }
    if (reason.trim().length < MIN_OVERRIDE_REASON) {
      toast.error(`Reason must be at least ${MIN_OVERRIDE_REASON} characters for the audit trail.`);
      return;
    }
    if (action === "approved") {
      if (!overrideScore) { toast.error("Provide the new score when approving."); return; }
      const parsed = parseFloat(overrideScore);
      if (isNaN(parsed) || parsed < 0) { toast.error("Score must be a non-negative number."); return; }
      if (assignment && parsed > assignment.max_score) {
        toast.error(`Score cannot exceed the maximum of ${assignment.max_score}.`); return;
      }
    }
    if (!appeal) return;
    const score = action === "approved" ? parseFloat(overrideScore) : undefined;
    onSubmit(appeal.id, action, reason.trim(), score);
    setReason(""); setScore(""); setAction("approved");
    onClose();
  }

  function handleClose() { setReason(""); setScore(""); setAction("approved"); onClose(); }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-violet-500" /> Academic Manager Override
          </DialogTitle>
        </DialogHeader>
        {appeal && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-secondary/50 border border-border px-3.5 py-2.5 text-xs space-y-1">
              <p><span className="text-muted-foreground">Student:</span> {appeal.student_name}</p>
              <p><span className="text-muted-foreground">Assignment:</span> {assignment?.title}</p>
            </div>
            {appeal.teacher_response && (
              <div className="rounded-xl bg-sky-500/5 border border-sky-500/20 px-3.5 py-2.5 text-xs text-sky-800 dark:text-sky-300">
                <p className="font-medium mb-1">Teacher's response:</p>
                {appeal.teacher_response}
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs">Decision</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAction("approved")}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors",
                    action === "approved"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                      : "border-border text-muted-foreground hover:bg-secondary",
                  )}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mx-auto mb-1" />
                  Approve
                </button>
                <button
                  onClick={() => setAction("rejected")}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors",
                    action === "rejected"
                      ? "bg-red-500/10 border-red-500/30 text-red-700"
                      : "border-border text-muted-foreground hover:bg-secondary",
                  )}
                >
                  <XCircle className="h-3.5 w-3.5 mx-auto mb-1" />
                  Reject
                </button>
              </div>
            </div>
            {action === "approved" && (
              <div className="space-y-1.5">
                <Label className="text-xs">New score *</Label>
                <Input
                  type="number" min="0" max={assignment?.max_score}
                  placeholder={`0 – ${assignment?.max_score ?? 100}`}
                  value={overrideScore}
                  onChange={(e) => setScore(e.target.value)}
                  className="h-10"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Audit reason * <span className="text-muted-foreground">(min {MIN_OVERRIDE_REASON} chars)</span>
              </Label>
              <Textarea
                placeholder="Provide a detailed reason for this decision…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={cn("min-h-[80px] resize-none text-sm", reasonTooShort && "border-red-500/50")}
              />
              {reasonTooShort && (
                <p className="text-xs text-red-600">
                  {reason.trim().length}/{MIN_OVERRIDE_REASON} characters — too short for audit trail.
                </p>
              )}
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-violet-500/5 border border-violet-500/20 px-3.5 py-2.5 text-xs text-violet-700">
              <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              This action is permanently logged in the audit trail and cannot be undone.
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
          <Button
            size="sm"
            className={cn(
              "text-white border-0",
              action === "approved"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600"
                : "bg-gradient-to-r from-red-500 to-rose-600",
            )}
            onClick={handleSubmit}
          >
            {action === "approved" ? "Approve & set score" : "Reject appeal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export function GradeAppealsPage() {
  const { currentUser, role } = useAuth();
  const [appeals, setAppeals]               = useState<GradeAppeal[]>(() => appealsStore.getAll());

  // Sync from store on mount (picks up appeals submitted from the Results page)
  useEffect(() => { setAppeals(appealsStore.getAll()); }, []);
  const [search, setSearch]                 = useState("");
  const [statusFilter, setStatusFilter]     = useState<AppealStatus | "all">("all");
  const [submitOpen, setSubmitOpen]         = useState(false);
  const [reviewTarget, setReviewTarget]     = useState<GradeAppeal | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<GradeAppeal | null>(null);

  const isStudent    = role === "student";
  const isTeacher    = role === "teacher";
  const isSuperAdmin = role === "super_admin";
  const isAdmin      = role === "admin";

  // Resolve mock student ID from email (mock data uses string IDs)
  const mockStudentId = resolveMockStudentId(currentUser?.email);
  const teacherName   = currentUser?.full_name ?? "";

  // Teacher's own assignment IDs — used to scope visible appeals and review actions
  const teacherAssignmentIds = useMemo(
    () => (isTeacher ? getTeacherAssignmentIds(teacherName) : new Set<string>()),
    [isTeacher, teacherName],
  );

  const visible = useMemo(() => {
    let base: GradeAppeal[];

    if (isStudent) {
      // Students see ONLY their own appeals
      base = appeals.filter((a) => a.student_id === mockStudentId);
    } else if (isTeacher) {
      // Teachers see only appeals for their own courses' assignments
      base = appeals.filter((a) => teacherAssignmentIds.has(a.assignment_id));
    } else {
      // Admin and Super Admin see all
      base = appeals;
    }

    if (statusFilter !== "all") base = base.filter((a) => a.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      base = base.filter(
        (a) =>
          a.student_name.toLowerCase().includes(q) ||
          a.reason.toLowerCase().includes(q),
      );
    }
    return base;
  }, [appeals, search, statusFilter, isStudent, isTeacher, mockStudentId, teacherAssignmentIds]);

  // Stats (scoped to what the user can see)
  const pending   = visible.filter((a) => a.status === "pending").length;
  const escalated = visible.filter((a) => a.status === "escalated").length;
  const resolved  = visible.filter((a) => a.status === "approved" || a.status === "rejected").length;

  function handleSubmitAppeal(data: Omit<GradeAppeal, "id" | "created_at" | "updated_at">) {
    const now = new Date().toISOString();
    const newAppeal: GradeAppeal = { ...data, id: `ap${Date.now()}`, created_at: now, updated_at: now };
    appealsStore.add(newAppeal);
    setAppeals(appealsStore.getAll());
    toast.success("Appeal submitted. Your teacher will review it shortly.");
  }

  function handleTeacherReview(id: string, response: string, action: "reviewed" | "escalated") {
    appealsStore.update(id, {
      status: action,
      teacher_response: response,
      teacher_reviewed_by: teacherName,
      teacher_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setAppeals(appealsStore.getAll());
    toast.success(
      action === "escalated"
        ? "Appeal escalated to Academic Manager."
        : "Appeal marked as reviewed.",
    );
    setReviewTarget(null);
  }

  function handleOverride(id: string, action: "approved" | "rejected", reason: string, score?: number) {
    appealsStore.update(id, {
      status: action,
      override_reason: reason,
      override_score: score ?? null,
      override_by: currentUser?.full_name ?? "Academic Manager",
      override_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setAppeals(appealsStore.getAll());
    toast.success(action === "approved" ? "Appeal approved and grade updated." : "Appeal rejected.");
    setOverrideTarget(null);
  }

  // Student avatar initials from auth user
  const studentAvatar =
    (currentUser?.first_name?.slice(0, 1) ?? "") +
    (currentUser?.last_name?.slice(0, 1) ?? "");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-display font-bold">Grade Appeals</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isStudent
              ? "Submit and track your grade appeals"
              : isSuperAdmin
              ? "Handle escalated appeals — full audit log required"
              : isAdmin
              ? "Read-only view of all grade appeals"
              : "Review student appeals for your courses"}
          </p>
        </div>
        {isStudent && (
          <Button
            className="gradient-primary text-white border-0 shadow-glow gap-1.5"
            onClick={() => setSubmitOpen(true)}
          >
            <Plus className="h-4 w-4" /> Submit appeal
          </Button>
        )}
      </div>

      {/* Admin read-only notice */}
      {isAdmin && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3 text-sm text-amber-700">
          <Lock className="h-4 w-4 mt-0.5 shrink-0" />
          Admins have read-only access. Students submit appeals; teachers review; the Academic Manager handles overrides.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4 border-border shadow-soft flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold font-display leading-none">{pending}</p>
            <p className="text-xs font-medium mt-0.5">Pending review</p>
          </div>
        </Card>
        <Card className="p-4 border-border shadow-soft flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shrink-0">
            <ArrowUpRight className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold font-display leading-none">{escalated}</p>
            <p className="text-xs font-medium mt-0.5">Escalated</p>
          </div>
        </Card>
        <Card className="p-4 border-border shadow-soft flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold font-display leading-none">{resolved}</p>
            <p className="text-xs font-medium mt-0.5">Resolved</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-border shadow-soft">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search appeals…"
              className="pl-9 h-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AppealStatus | "all")}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-[160px] shrink-0"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="escalated">Escalated</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </Card>

      {/* List */}
      <p className="text-sm text-muted-foreground">
        {visible.length} appeal{visible.length !== 1 ? "s" : ""}
      </p>

      {visible.length === 0 ? (
        <Card className="border-border shadow-soft">
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <BookOpen className="h-10 w-10 opacity-20" />
            <p className="text-sm font-medium">No appeals found</p>
            {isStudent && (
              <Button variant="outline" size="sm" onClick={() => setSubmitOpen(true)}>
                Submit your first appeal
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {visible.map((a) => (
            <AppealCard
              key={a.id}
              appeal={a}
              role={role}
              teacherAssignmentIds={teacherAssignmentIds}
              onTeacherReview={setReviewTarget}
              onSuperAdminOverride={setOverrideTarget}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      {isStudent && (
        <SubmitAppealDialog
          open={submitOpen}
          onClose={() => setSubmitOpen(false)}
          onSubmit={handleSubmitAppeal}
          studentId={mockStudentId}
          studentName={currentUser?.full_name ?? "Student"}
          studentAvatar={studentAvatar || "ST"}
        />
      )}

      <TeacherReviewDialog
        appeal={reviewTarget}
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSubmit={handleTeacherReview}
        teacherName={teacherName}
      />

      <OverrideDialog
        appeal={overrideTarget}
        open={!!overrideTarget}
        onClose={() => setOverrideTarget(null)}
        onSubmit={handleOverride}
      />
    </div>
  );
}
