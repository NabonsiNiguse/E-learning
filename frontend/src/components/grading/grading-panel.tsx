/**
 * GradingPanel — University-level teacher grading interface.
 *
 * Features:
 * - Criteria-based marking (quiz, midterm, final, project, attendance, etc.)
 * - Live weighted score calculation as teacher enters marks
 * - Per-criteria feedback
 * - Overall feedback
 * - Grade now vs save as pending
 * - Result release control (immediate / scheduled / delayed)
 * - Admin approve button (read-only for admin, action for admin role)
 */
import { useState, useMemo } from "react";
import {
  CheckCircle2, Clock, Save, Send, ShieldCheck, AlertTriangle,
  ChevronDown, ChevronUp, Calendar, Lock, Unlock, Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  gradingStore, computeWeightedScore, toLetterGrade,
  type StudentGrade, type GradingScheme, type CriteriaMark,
  type ReleaseMode, type CriteriaType,
} from "@/lib/grading-store";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CRITERIA_COLOR: Record<CriteriaType, string> = {
  quiz:          "bg-violet-500/10 text-violet-700 border-violet-500/20",
  midterm:       "bg-sky-500/10 text-sky-700 border-sky-500/20",
  final:         "bg-rose-500/10 text-rose-700 border-rose-500/20",
  project:       "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  assignment:    "bg-amber-500/10 text-amber-700 border-amber-500/20",
  attendance:    "bg-teal-500/10 text-teal-700 border-teal-500/20",
  participation: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
};

const GRADE_RING: Record<string, string> = {
  "A+": "ring-emerald-500 text-emerald-600",
  "A":  "ring-emerald-500 text-emerald-600",
  "B+": "ring-sky-500 text-sky-600",
  "B":  "ring-sky-500 text-sky-600",
  "C+": "ring-amber-500 text-amber-600",
  "C":  "ring-amber-500 text-amber-600",
  "D":  "ring-orange-500 text-orange-600",
  "F":  "ring-red-500 text-red-600",
};

function ScoreRing({ score, letter }: { score: number | null; letter: string | null }) {
  const ring = letter ? GRADE_RING[letter] ?? "ring-muted text-muted-foreground" : "ring-muted text-muted-foreground";
  return (
    <div className={cn(
      "h-24 w-24 rounded-full ring-4 flex flex-col items-center justify-center shrink-0",
      ring,
    )}>
      <span className="text-2xl font-black font-display tabular-nums">
        {score !== null ? `${score}%` : "—"}
      </span>
      {letter && <span className="text-sm font-bold mt-0.5">{letter}</span>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface GradingPanelProps {
  grade: StudentGrade;
  scheme: GradingScheme;
  role: "teacher" | "admin" | "super_admin";
  currentUserName: string;
  onSaved: () => void;
}

export function GradingPanel({ grade, scheme, role, currentUserName, onSaved }: GradingPanelProps) {
  const isTeacher = role === "teacher" || role === "super_admin";
  const isAdmin   = role === "admin";
  const canEdit   = isTeacher && grade.status !== "released";
  const canApprove = (role === "admin" || role === "super_admin") && grade.status === "graded";

  // Local editable state
  const [marks, setMarks]           = useState<CriteriaMark[]>(() =>
    scheme.criteria.map((c) => {
      const existing = grade.marks.find((m) => m.criteria_id === c.id);
      return existing ?? { criteria_id: c.id, score: null, feedback: "" };
    })
  );
  const [feedback, setFeedback]     = useState(grade.overall_feedback);
  const [releaseMode, setReleaseMode] = useState<ReleaseMode>(grade.release_mode);
  const [releaseAt, setReleaseAt]   = useState(
    grade.release_at ? grade.release_at.slice(0, 16) : ""
  );
  const [expandedCriteria, setExpanded] = useState<string | null>(null);

  // Live score calculation
  const liveScore = useMemo(
    () => computeWeightedScore(marks, scheme.criteria),
    [marks, scheme.criteria]
  );
  const liveLetter = liveScore !== null ? toLetterGrade(liveScore) : null;

  const allFilled = marks.every((m) => m.score !== null);
  const weightSum = scheme.criteria.reduce((s, c) => s + c.weight, 0);

  const setMark = (criteriaId: string, score: number | null) => {
    setMarks((prev) => prev.map((m) =>
      m.criteria_id === criteriaId ? { ...m, score } : m
    ));
  };

  const setCriteriaFeedback = (criteriaId: string, fb: string) => {
    setMarks((prev) => prev.map((m) =>
      m.criteria_id === criteriaId ? { ...m, feedback: fb } : m
    ));
  };

  const handleSave = (submit: boolean) => {
    if (submit && !allFilled) {
      toast.error("Please enter marks for all criteria before submitting.");
      return;
    }
    const releaseIso = releaseMode === "scheduled" && releaseAt
      ? new Date(releaseAt).toISOString()
      : null;
    gradingStore.saveGrade(grade.id, marks, feedback, releaseMode, releaseIso);
    toast.success(submit ? "Grade submitted successfully." : "Draft saved.");
    onSaved();
  };

  const handleApprove = () => {
    gradingStore.approveGrade(grade.id, currentUserName);
    toast.success("Grade approved.");
    onSaved();
  };

  const handleRelease = () => {
    gradingStore.releaseGrade(grade.id);
    toast.success("Result released to student.");
    onSaved();
  };

  return (
    <div className="space-y-5">
      {/* Student header */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-secondary/60 to-secondary/20 border border-border">
        <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
          {grade.student_avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base">{grade.student_name}</p>
          <p className="text-xs text-muted-foreground">{grade.course_title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusBadge status={grade.status} />
            {grade.approved_by && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-500" /> Approved by {grade.approved_by}
              </span>
            )}
          </div>
        </div>
        <ScoreRing score={liveScore} letter={liveLetter} />
      </div>

      {/* Weight warning */}
      {weightSum !== 100 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3 text-xs text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          Criteria weights sum to {weightSum}% — should be 100%. Adjust the grading scheme.
        </div>
      )}

      {/* Criteria marks */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          Criteria marks
          <span className="text-xs font-normal text-muted-foreground">({scheme.criteria.length} criteria)</span>
        </h3>

        {scheme.criteria.map((c) => {
          const mark = marks.find((m) => m.criteria_id === c.id)!;
          const pct  = mark.score !== null ? Math.round((mark.score / c.max_score) * 100) : null;
          const isOpen = expandedCriteria === c.id;

          return (
            <Card key={c.id} className={cn(
              "border-border overflow-hidden transition-all",
              mark.score !== null ? "shadow-soft" : "border-dashed",
            )}>
              {/* Criteria header row */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => setExpanded(isOpen ? null : c.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{c.name}</span>
                    <Badge variant="outline" className={cn("text-[10px]", CRITERIA_COLOR[c.type])}>
                      {c.type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Weight: {c.weight}%
                    </span>
                  </div>
                </div>

                {/* Score display */}
                <div className="flex items-center gap-3 shrink-0">
                  {canEdit ? (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Input
                        type="number"
                        min={0}
                        max={c.max_score}
                        value={mark.score ?? ""}
                        onChange={(e) => {
                          const v = e.target.value === "" ? null : Math.min(c.max_score, Math.max(0, Number(e.target.value)));
                          setMark(c.id, v);
                        }}
                        placeholder="—"
                        className="h-8 w-20 text-center text-sm font-bold"
                      />
                      <span className="text-xs text-muted-foreground">/ {c.max_score}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold tabular-nums">
                      {mark.score ?? "—"} / {c.max_score}
                    </span>
                  )}

                  {pct !== null && (
                    <span className={cn(
                      "text-xs font-bold w-10 text-right tabular-nums",
                      pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600"
                    )}>
                      {pct}%
                    </span>
                  )}

                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Progress bar */}
              {pct !== null && (
                <div className="px-4 pb-2">
                  <Progress
                    value={pct}
                    className={cn("h-1.5", pct >= 75 ? "[&>div]:bg-emerald-500" : pct >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500")}
                  />
                </div>
              )}

              {/* Expanded feedback */}
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-border/50">
                  <Label className="text-xs text-muted-foreground">Feedback for this criterion</Label>
                  {canEdit ? (
                    <Textarea
                      value={mark.feedback}
                      onChange={(e) => setCriteriaFeedback(c.id, e.target.value)}
                      placeholder={`Feedback for ${c.name}…`}
                      className="mt-1.5 min-h-[60px] resize-none text-sm"
                    />
                  ) : (
                    <p className="mt-1.5 text-sm text-muted-foreground italic">
                      {mark.feedback || "No feedback provided."}
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Live score summary */}
      <Card className="p-4 border-border shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Live score breakdown</h3>
          {liveScore !== null && liveLetter && (
            <Badge className={cn("text-xs font-bold", GRADE_RING[liveLetter] ?? "")}>
              {liveLetter} · {liveScore}%
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          {scheme.criteria.map((c) => {
            const mark = marks.find((m) => m.criteria_id === c.id)!;
            const pct  = mark.score !== null ? (mark.score / c.max_score) * 100 : null;
            const contribution = pct !== null ? (pct * c.weight) / 100 : null;
            return (
              <div key={c.id} className="flex items-center gap-3 text-xs">
                <span className="w-36 truncate text-muted-foreground">{c.name}</span>
                <span className="w-12 text-right tabular-nums font-medium">
                  {pct !== null ? `${Math.round(pct)}%` : "—"}
                </span>
                <span className="text-muted-foreground">×</span>
                <span className="w-8 text-muted-foreground">{c.weight}%</span>
                <span className="text-muted-foreground">=</span>
                <span className={cn("w-12 text-right tabular-nums font-bold",
                  contribution !== null ? "text-primary" : "text-muted-foreground"
                )}>
                  {contribution !== null ? `${contribution.toFixed(1)}` : "—"}
                </span>
              </div>
            );
          })}
          <div className="border-t border-border pt-2 flex items-center justify-between font-bold text-sm">
            <span>Weighted total</span>
            <span className={cn(liveScore !== null ? "text-primary" : "text-muted-foreground")}>
              {liveScore !== null ? `${liveScore}%` : "Incomplete"}
            </span>
          </div>
        </div>
      </Card>

      {/* Overall feedback */}
      <div className="space-y-1.5">
        <Label className="text-sm font-bold">Overall feedback</Label>
        {canEdit ? (
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write overall feedback for the student…"
            className="min-h-[90px] resize-none text-sm"
          />
        ) : (
          <div className="rounded-xl bg-secondary/50 border border-border px-4 py-3 text-sm text-muted-foreground leading-relaxed">
            {feedback || "No overall feedback provided."}
          </div>
        )}
      </div>

      {/* Result release control (teacher only) */}
      {canEdit && (
        <Card className="p-4 border-border shadow-soft space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Result release
          </h3>
          <div className="flex gap-2 flex-wrap">
            {(["immediate", "scheduled", "delayed"] as ReleaseMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setReleaseMode(m)}
                className={cn(
                  "flex-1 min-w-[100px] rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors capitalize",
                  releaseMode === m
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                {m === "immediate" && <Unlock className="h-3.5 w-3.5 mx-auto mb-1" />}
                {m === "scheduled" && <Calendar className="h-3.5 w-3.5 mx-auto mb-1" />}
                {m === "delayed"   && <Lock className="h-3.5 w-3.5 mx-auto mb-1" />}
                {m}
              </button>
            ))}
          </div>
          {releaseMode === "scheduled" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Release date & time</Label>
              <Input
                type="datetime-local"
                value={releaseAt}
                onChange={(e) => setReleaseAt(e.target.value)}
                className="h-10"
              />
            </div>
          )}
          {releaseMode === "delayed" && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 px-3 py-2.5 text-xs text-amber-700">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Result will be hidden until you manually release it after admin approval.
            </div>
          )}
        </Card>
      )}

      {/* Admin release info (read-only) */}
      {isAdmin && grade.status === "graded" && (
        <div className="flex items-start gap-2 rounded-xl bg-sky-500/5 border border-sky-500/20 px-4 py-3 text-xs text-sky-700">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          Release mode: <strong className="ml-1 capitalize">{grade.release_mode}</strong>
          {grade.release_at && <span className="ml-1">· {new Date(grade.release_at).toLocaleString()}</span>}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        {canEdit && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => handleSave(false)}
            >
              <Save className="h-4 w-4" /> Save draft
            </Button>
            <Button
              size="sm"
              className="gradient-primary text-white border-0 shadow-glow gap-1.5"
              onClick={() => handleSave(true)}
              disabled={!allFilled}
            >
              <Send className="h-4 w-4" />
              {allFilled ? "Submit grade" : `${marks.filter((m) => m.score === null).length} marks missing`}
            </Button>
          </>
        )}

        {canApprove && (
          <Button
            size="sm"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 gap-1.5"
            onClick={handleApprove}
          >
            <ShieldCheck className="h-4 w-4" /> Approve grade
          </Button>
        )}

        {(role === "admin" || role === "super_admin") && grade.status === "approved" && (
          <Button
            size="sm"
            className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 gap-1.5"
            onClick={handleRelease}
          >
            <Unlock className="h-4 w-4" /> Release to student
          </Button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: StudentGrade["status"] }) {
  const cfg = {
    pending:  { label: "Pending",  color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    graded:   { label: "Graded",   color: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
    approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    released: { label: "Released", color: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
  }[status];
  return <Badge variant="outline" className={cn("text-[10px]", cfg.color)}>{cfg.label}</Badge>;
}
