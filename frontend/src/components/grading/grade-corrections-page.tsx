/**
 * Grade Corrections Page
 *
 * Role matrix (strictly enforced):
 *   Teacher     : view OWN corrections only + create corrections for OWN course students only
 *   Super Admin : view ALL corrections + create corrections for any student
 *   Admin       : read-only view of all corrections — NO create button
 *   Student     : no access (route guard blocks navigation here)
 */
import { useState, useMemo } from "react";
import {
  Plus, Search, CheckSquare, User, Calendar,
  ArrowRight, AlertCircle, ShieldCheck, BookOpen, Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import {
  mockGradeCorrections, mockSubmissions, mockAssignments,
  type GradeCorrection,
} from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

/** Returns assignment IDs that belong to the given teacher (by created_by name). */
function getTeacherAssignmentIds(teacherName: string): string[] {
  return mockAssignments
    .filter((a) => a.created_by === teacherName)
    .map((a) => a.id);
}

function RoleBadge({ role }: { role: "teacher" | "super_admin" }) {
  return role === "super_admin" ? (
    <Badge className="gap-1 bg-violet-500/10 text-violet-600 border-violet-500/20 text-[10px]">
      <ShieldCheck className="h-3 w-3" /> Academic Manager
    </Badge>
  ) : (
    <Badge className="gap-1 bg-sky-500/10 text-sky-600 border-sky-500/20 text-[10px]">
      <User className="h-3 w-3" /> Teacher
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Correction card
// ---------------------------------------------------------------------------
function CorrectionCard({ correction }: { correction: GradeCorrection }) {
  const assignment = mockAssignments.find((a) => a.id === correction.assignment_id);

  return (
    <Card className="p-5 border-border shadow-soft hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {correction.student_avatar}
          </div>
          <div>
            <p className="font-semibold text-sm">{correction.student_name}</p>
            <p className="text-xs text-muted-foreground">{assignment?.title ?? correction.assignment_id}</p>
          </div>
        </div>
        <RoleBadge role={correction.corrected_by_role} />
      </div>

      {/* Score change */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-1.5">
          <span className="text-xs text-muted-foreground">Old</span>
          <span className="text-sm font-bold text-red-600 line-through">
            {correction.old_score ?? "—"}
          </span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-1.5">
          <span className="text-xs text-muted-foreground">New</span>
          <span className="text-sm font-bold text-emerald-600">{correction.new_score}</span>
        </div>
      </div>

      {/* Reason */}
      <div className="rounded-xl bg-secondary/50 border border-border px-3.5 py-2.5 text-xs text-muted-foreground leading-relaxed mb-3">
        {correction.reason}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" /> {correction.corrected_by}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {formatDate(correction.created_at)}
        </span>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Create correction dialog
// ---------------------------------------------------------------------------
interface CreateCorrectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<GradeCorrection, "id" | "created_at">) => void;
  correctorName: string;
  correctorRole: "teacher" | "super_admin";
}

function CreateCorrectionDialog({
  open, onClose, onSubmit, correctorName, correctorRole,
}: CreateCorrectionDialogProps) {
  const [submissionId, setSubmissionId] = useState("");
  const [oldScore, setOldScore]         = useState("");
  const [newScore, setNewScore]         = useState("");
  const [reason, setReason]             = useState("");

  // Teachers can only correct submissions from their own courses' assignments
  const eligibleSubs = useMemo(() => {
    const graded = mockSubmissions.filter((s) => s.status === "graded");
    if (correctorRole === "super_admin") return graded;
    // Teacher: scope to their own assignments only
    const ownAssignmentIds = getTeacherAssignmentIds(correctorName);
    return graded.filter((s) => ownAssignmentIds.includes(s.assignment_id));
  }, [correctorName, correctorRole]);

  const selectedSub = mockSubmissions.find((s) => s.id === submissionId);
  const assignment  = selectedSub
    ? mockAssignments.find((a) => a.id === selectedSub.assignment_id)
    : null;

  function handleSubmit() {
    if (!submissionId || !newScore || !reason.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const parsed = parseFloat(newScore);
    if (isNaN(parsed) || parsed < 0) {
      toast.error("New score must be a valid non-negative number.");
      return;
    }
    if (assignment && parsed > assignment.max_score) {
      toast.error(`Score cannot exceed the maximum of ${assignment.max_score}.`);
      return;
    }
    onSubmit({
      submission_id: submissionId,
      assignment_id: selectedSub?.assignment_id ?? "",
      student_id: selectedSub?.student_id ?? "",
      student_name: selectedSub?.student_name ?? "",
      student_avatar: selectedSub?.student_avatar ?? "",
      corrected_by: correctorName,
      corrected_by_role: correctorRole,
      old_score: oldScore ? parseFloat(oldScore) : (selectedSub?.score ?? null),
      new_score: parsed,
      reason: reason.trim(),
    });
    setSubmissionId(""); setOldScore(""); setNewScore(""); setReason("");
    onClose();
  }

  function handleClose() {
    setSubmissionId(""); setOldScore(""); setNewScore(""); setReason("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CheckSquare className="h-4 w-4 text-rose-500" />
            New Grade Correction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {correctorRole === "teacher" && eligibleSubs.length === 0 && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 px-3.5 py-2.5 text-xs text-amber-700">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              No graded submissions found for your courses yet.
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Submission *</Label>
            <select
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a graded submission…</option>
              {eligibleSubs.map((s) => {
                const a = mockAssignments.find((a) => a.id === s.assignment_id);
                return (
                  <option key={s.id} value={s.id}>
                    {s.student_name} — {a?.title ?? s.assignment_id} ({s.score} pts)
                  </option>
                );
              })}
            </select>
          </div>

          {selectedSub && (
            <div className="rounded-xl bg-secondary/50 border border-border px-3.5 py-2.5 text-xs space-y-1">
              <p><span className="text-muted-foreground">Student:</span> {selectedSub.student_name}</p>
              <p><span className="text-muted-foreground">Assignment:</span> {assignment?.title}</p>
              <p><span className="text-muted-foreground">Current score:</span> {selectedSub.score} / {assignment?.max_score}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Old score (auto-filled)</Label>
              <Input
                type="number" min="0"
                placeholder={selectedSub?.score?.toString() ?? "e.g. 88"}
                value={oldScore}
                onChange={(e) => setOldScore(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">New score *</Label>
              <Input
                type="number" min="0" max={assignment?.max_score}
                placeholder={`0 – ${assignment?.max_score ?? 100}`}
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Reason for correction *</Label>
            <Textarea
              placeholder="Explain clearly why this grade is being corrected…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px] resize-none text-sm"
            />
          </div>

          {correctorRole === "super_admin" && (
            <div className="flex items-start gap-2 rounded-xl bg-violet-500/5 border border-violet-500/20 px-3.5 py-2.5 text-xs text-violet-700">
              <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              This correction is logged as an Academic Manager override with full audit trail.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
          <Button
            size="sm"
            className="gradient-primary text-white border-0 shadow-glow"
            onClick={handleSubmit}
            disabled={eligibleSubs.length === 0}
          >
            Save correction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Access denied screen (student tries to navigate here directly)
// ---------------------------------------------------------------------------
function AccessDenied() {
  return (
    <Card className="border-border shadow-soft">
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <Lock className="h-10 w-10 opacity-20" />
        <p className="text-sm font-medium">Access denied</p>
        <p className="text-xs text-center max-w-xs">
          Grade corrections are managed by teachers and the Academic Manager.
          Students can submit grade appeals instead.
        </p>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export function GradeCorrectionsPage() {
  const { currentUser, role } = useAuth();
  const [corrections, setCorrections] = useState<GradeCorrection[]>(mockGradeCorrections);
  const [search, setSearch]           = useState("");
  const [createOpen, setCreateOpen]   = useState(false);

  // Students have no business on this page
  if (role === "student") return <AccessDenied />;

  const canCreate = role === "teacher" || role === "super_admin";
  const isAdmin   = role === "admin";
  const teacherName = currentUser?.full_name ?? "";

  const visible = useMemo(() => {
    // Teachers see only corrections they personally made
    const base = role === "teacher"
      ? corrections.filter((c) => c.corrected_by === teacherName)
      : corrections; // admin and super_admin see all

    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(
      (c) =>
        c.student_name.toLowerCase().includes(q) ||
        c.reason.toLowerCase().includes(q) ||
        c.corrected_by.toLowerCase().includes(q),
    );
  }, [corrections, search, role, teacherName]);

  function handleCreate(data: Omit<GradeCorrection, "id" | "created_at">) {
    const newCorrection: GradeCorrection = {
      ...data,
      id: `gc${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setCorrections((prev) => [newCorrection, ...prev]);
    toast.success("Grade correction saved and logged.");
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-display font-bold">Grade Corrections</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdmin
              ? "Read-only view of all grade corrections"
              : role === "super_admin"
              ? "Override any grade — full audit log required"
              : "Correct grades for your own students"}
          </p>
        </div>
        {canCreate && (
          <Button
            className="gradient-primary text-white border-0 shadow-glow gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" /> New correction
          </Button>
        )}
      </div>

      {/* Admin read-only notice */}
      {isAdmin && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          Admins have read-only access. Only teachers (own courses) and the Academic Manager can create corrections.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4 border-border shadow-soft flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center shrink-0">
            <CheckSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold font-display leading-none">{visible.length}</p>
            <p className="text-xs font-medium mt-0.5">
              {role === "teacher" ? "Your corrections" : "Total corrections"}
            </p>
          </div>
        </Card>
        <Card className="p-4 border-border shadow-soft flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold font-display leading-none">
              {visible.filter((c) => c.corrected_by_role === "teacher").length}
            </p>
            <p className="text-xs font-medium mt-0.5">By teachers</p>
          </div>
        </Card>
        <Card className="p-4 border-border shadow-soft flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold font-display leading-none">
              {visible.filter((c) => c.corrected_by_role === "super_admin").length}
            </p>
            <p className="text-xs font-medium mt-0.5">By Academic Manager</p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 border-border shadow-soft">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, corrector, or reason…"
            className="pl-9 h-10"
          />
        </div>
      </Card>

      {/* List */}
      <p className="text-sm text-muted-foreground">
        {visible.length} correction{visible.length !== 1 ? "s" : ""}
      </p>

      {visible.length === 0 ? (
        <Card className="border-border shadow-soft">
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <BookOpen className="h-10 w-10 opacity-20" />
            <p className="text-sm font-medium">No corrections found</p>
            {canCreate && (
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                Create first correction
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {visible.map((c) => (
            <CorrectionCard key={c.id} correction={c} />
          ))}
        </div>
      )}

      {canCreate && (
        <CreateCorrectionDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
          correctorName={teacherName}
          correctorRole={role === "super_admin" ? "super_admin" : "teacher"}
        />
      )}
    </div>
  );
}
