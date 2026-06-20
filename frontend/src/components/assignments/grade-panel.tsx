import { useState } from "react";
import { X, Star, Send, Download, FileText, MessageSquare, Lock, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAssignment } from "@/context/assignment-context";
import { useApp } from "@/context/app-context";
import type { AssignmentSubmission, Assignment } from "@/lib/mock-data";
import { AssignmentStatusBadge } from "./assignment-status-badge";
import { downloadFile, mimeFromName } from "@/lib/download";
import { toast } from "sonner";

interface GradePanelProps {
  submission: AssignmentSubmission;
  assignment: Assignment;
  onClose: () => void;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function GradePanel({ submission, assignment, onClose }: GradePanelProps) {
  const { gradeSubmission } = useAssignment();
  const { currentUser, role } = useApp();

  // Role-based access control
  // - teacher: can grade their own students (editable)
  // - super_admin: can override any grade (editable, with override indicator)
  // - admin: read-only view
  // - student: no access (should never reach here, but guard anyway)
  const isStudent    = role === "student";
  const isAdmin      = role === "admin";
  const isTeacher    = role === "teacher";
  const isSuperAdmin = role === "super_admin";

  const canEdit = isTeacher || isSuperAdmin;
  const isOverride = isSuperAdmin && submission.status === "graded";

  const [score, setScore]       = useState<string>(submission.score?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");

  const scoreNum = Number(score);
  const isValid  = score !== "" && scoreNum >= 0 && scoreNum <= assignment.max_score;
  const pct      = isValid ? Math.round((scoreNum / assignment.max_score) * 100) : null;

  const gradeColor =
    pct === null ? "" :
    pct >= 90 ? "text-emerald-600" :
    pct >= 75 ? "text-sky-600" :
    pct >= 60 ? "text-amber-600" : "text-red-600";

  const handleGrade = () => {
    if (!canEdit || !isValid) return;
    gradeSubmission(
      submission.id,
      scoreNum,
      feedback.trim(),
      currentUser?.full_name ?? (isSuperAdmin ? "Super Admin" : "Teacher")
    );
    const action = isOverride ? "Grade overridden" : "Graded";
    toast.success(`${action} — ${submission.student_name}: ${scoreNum}/${assignment.max_score}`);
    onClose();
  };

  // Students should not see this panel at all
  if (isStudent) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 py-10 text-center">
        <Lock className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">You don't have permission to view this panel.</p>
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">
              {isAdmin ? "View submission" : isOverride ? "Override grade" : "Grade submission"}
            </h3>
            {isAdmin && (
              <Badge variant="outline" className="text-[10px] gap-1 text-amber-600 border-amber-500/30 bg-amber-500/5">
                <Lock className="h-2.5 w-2.5" /> Read-only
              </Badge>
            )}
            {isSuperAdmin && (
              <Badge variant="outline" className="text-[10px] gap-1 text-violet-600 border-violet-500/30 bg-violet-500/5">
                <ShieldCheck className="h-2.5 w-2.5" /> Super Admin
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{assignment.title}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Override warning banner for super_admin */}
        {isOverride && (
          <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 dark:text-amber-400">
              <p className="font-semibold">Grade override</p>
              <p className="mt-0.5 text-amber-600/80">This submission was already graded by {submission.graded_by}. You are overriding it as super admin.</p>
            </div>
          </div>
        )}

        {/* Admin read-only banner */}
        {isAdmin && (
          <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-xl bg-slate-500/5 border border-slate-500/20 px-4 py-3">
            <Lock className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Admins can view submissions but cannot modify grades. Contact the teacher to make changes.
            </p>
          </div>
        )}

        {/* Student info */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {submission.student_avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{submission.student_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Submitted {formatDateTime(submission.submitted_at)}
              </p>
            </div>
            <AssignmentStatusBadge status={submission.status} />
          </div>
        </div>

        {/* Submission content */}
        <div className="px-5 py-4 space-y-4">
          {/* Text response */}
          {submission.text_response && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <MessageSquare className="h-3.5 w-3.5" /> Written response
              </div>
              <div className="rounded-xl bg-secondary/50 border border-border px-4 py-3 text-sm leading-relaxed">
                {submission.text_response}
              </div>
            </div>
          )}

          {/* File attachment */}
          {submission.file_name && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <FileText className="h-3.5 w-3.5" /> Submitted file
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
                <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {submission.file_name.split(".").pop()?.toUpperCase().slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{submission.file_name}</p>
                  <p className="text-xs text-muted-foreground">{submission.file_size}</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs shrink-0"
                  onClick={() => {
                    if (submission.file_name) {
                      downloadFile(submission.file_name, mimeFromName(submission.file_name));
                      toast.success(`Downloading ${submission.file_name}`);
                    }
                  }}>
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Grading section */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Star className="h-3.5 w-3.5" /> Grade
            </div>

            <div className="flex items-center gap-3">
              <div className="space-y-1 flex-1">
                <Label className="text-xs text-muted-foreground">Score (out of {assignment.max_score})</Label>
                <Input
                  type="number"
                  min={0}
                  max={assignment.max_score}
                  value={score}
                  onChange={(e) => canEdit && setScore(e.target.value)}
                  placeholder={`0 – ${assignment.max_score}`}
                  className={cn("h-9", !canEdit && "opacity-60 cursor-not-allowed bg-muted")}
                  readOnly={!canEdit}
                  disabled={!canEdit}
                />
              </div>
              {pct !== null && (
                <div className="text-center pt-5">
                  <span className={cn("text-2xl font-bold font-display", gradeColor)}>{pct}%</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Feedback</Label>
              <Textarea
                value={feedback}
                onChange={(e) => canEdit && setFeedback(e.target.value)}
                placeholder={canEdit ? "Write feedback for the student…" : "No feedback yet."}
                className={cn("min-h-[100px] resize-none text-sm", !canEdit && "opacity-60 cursor-not-allowed bg-muted")}
                readOnly={!canEdit}
                disabled={!canEdit}
              />
            </div>

            {/* Existing grade info */}
            {submission.graded_by && (
              <p className="text-xs text-muted-foreground">
                Last graded by {submission.graded_by}
                {submission.graded_at ? ` · ${formatDateTime(submission.graded_at)}` : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border shrink-0">
        {canEdit ? (
          <Button
            className={cn(
              "w-full text-white border-0 shadow-glow gap-2",
              isOverride
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                : "gradient-primary"
            )}
            onClick={handleGrade}
            disabled={!isValid}
          >
            {isOverride
              ? <><AlertTriangle className="h-4 w-4" /> Override grade</>
              : <><Send className="h-4 w-4" />{submission.status === "graded" ? "Update grade" : "Submit grade"}</>
            }
          </Button>
        ) : (
          <Button variant="outline" className="w-full gap-2" onClick={onClose}>
            <X className="h-4 w-4" /> Close
          </Button>
        )}
      </div>
    </div>
  );
}
