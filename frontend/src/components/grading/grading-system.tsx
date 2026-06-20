/**
 * University-level Grading System
 * Teacher: criteria setup, per-student mark entry, live score, feedback, release control
 * Admin: approve results (read-only marks)
 */
import { useState, useMemo, useCallback } from "react";
import {
  CheckSquare, Plus, Trash2, Save, Clock, CalendarCheck,
  ShieldCheck, AlertTriangle, ChevronDown, ChevronUp,
  BookOpen, Users, Award, Settings, Eye, EyeOff, Pencil,
  BarChart2, CheckCircle2, XCircle, Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import {
  gradingStore, computeFinalScore, letterGrade, gradeColor, isResultReleased,
  type CourseGradebook, type GradingCriterion, type StudentMark, type GradedStudent, type ReleaseMode,
} from "@/lib/grading-store";
import { mockCourses } from "@/lib/mock-data";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function LetterBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-muted-foreground">—</span>;
  const letter = letterGrade(score);
  return (
    <span className={cn("inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold border", gradeColor(letter))}>
      {letter}
    </span>
  );
}

// ─── Criteria Editor ─────────────────────────────────────────────────────────
function CriteriaEditor({
  criteria, onChange,
}: {
  criteria: GradingCriterion[];
  onChange: (c: GradingCriterion[]) => void;
}) {
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
  const isValid = totalWeight === 100;

  const update = (id: string, field: keyof GradingCriterion, value: string | number) => {
    onChange(criteria.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };

  const add = () => {
    const remaining = 100 - totalWeight;
    onChange([...criteria, {
      id: `cr${Date.now()}`,
      name: "New Criterion",
      weight: Math.max(0, remaining),
      maxMark: 100,
    }]);
  };

  const remove = (id: string) => {
    if (criteria.length <= 1) { toast.error("At least one criterion required."); return; }
    onChange(criteria.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Grading Criteria
        </Label>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-bold", isValid ? "text-emerald-600" : "text-red-500")}>
            {totalWeight}/100 weight
          </span>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={add}>
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
      </div>

      {!isValid && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2 text-xs text-red-600">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Weights must sum to exactly 100. Current total: {totalWeight}
        </div>
      )}

      <div className="space-y-2">
        {criteria.map((c) => (
          <div key={c.id} className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-center">
            <Input
              value={c.name}
              onChange={(e) => update(c.id, "name", e.target.value)}
              className="h-8 text-sm"
              placeholder="Criterion name"
            />
            <div className="relative">
              <Input
                type="number" min="0" max="100"
                value={c.weight}
                onChange={(e) => update(c.id, "weight", Number(e.target.value))}
                className="h-8 text-sm pr-6"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
            </div>
            <div className="relative">
              <Input
                type="number" min="1"
                value={c.maxMark}
                onChange={(e) => update(c.id, "maxMark", Number(e.target.value))}
                className="h-8 text-sm pr-6"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">max</span>
            </div>
            <Button
              variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => remove(c.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Weight bar */}
      <div className="space-y-1">
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          {criteria.map((c, i) => {
            const colors = ["bg-violet-500","bg-sky-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-indigo-500"];
            return (
              <div
                key={c.id}
                className={cn("h-full transition-all", colors[i % colors.length])}
                style={{ width: `${c.weight}%` }}
                title={`${c.name}: ${c.weight}%`}
              />
            );
          })}
          {totalWeight < 100 && (
            <div className="h-full bg-secondary flex-1" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {criteria.map((c, i) => {
            const colors = ["text-violet-600","text-sky-600","text-emerald-600","text-amber-600","text-rose-600","text-indigo-600"];
            return (
              <span key={c.id} className={cn("text-[10px] font-medium", colors[i % colors.length])}>
                {c.name} {c.weight}%
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Student Mark Entry Row ───────────────────────────────────────────────────
function StudentMarkRow({
  student, criteria, isAdmin, onSave,
}: {
  student: GradedStudent;
  criteria: GradingCriterion[];
  isAdmin: boolean;
  onSave: (marks: StudentMark[], feedback: string, status: "pending" | "graded") => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [marks, setMarks]       = useState<StudentMark[]>(student.marks);
  const [feedback, setFeedback] = useState(student.feedback);
  const [dirty, setDirty]       = useState(false);

  const liveScore = useMemo(() => computeFinalScore(marks, criteria), [marks, criteria]);
  const allGraded = marks.every((m) => m.mark !== null);

  const setMark = (criterionId: string, value: string) => {
    const num = value === "" ? null : Math.max(0, Number(value));
    setMarks((prev) => prev.map((m) => m.criterionId === criterionId ? { ...m, mark: num } : m));
    setDirty(true);
  };

  const handleSave = (status: "pending" | "graded") => {
    if (status === "graded" && !allGraded) {
      toast.error("Enter marks for all criteria before finalising.");
      return;
    }
    onSave(marks, feedback, status);
    setDirty(false);
    toast.success(status === "graded" ? "Student graded and saved." : "Saved as pending.");
  };

  return (
    <div className={cn(
      "border border-border rounded-xl overflow-hidden transition-all",
      student.status === "graded" ? "border-emerald-500/20 bg-emerald-500/[0.02]" : "bg-card",
    )}>
      {/* Row header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
      >
        <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
          {student.studentAvatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{student.studentName}</p>
          <p className="text-[11px] text-muted-foreground">
            {student.status === "graded"
              ? `Graded ${student.gradedAt ? formatDateTime(student.gradedAt) : ""}`
              : "Pending grading"}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {liveScore !== null && (
            <div className="text-right">
              <p className="text-lg font-bold font-display text-primary tabular-nums">{liveScore.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground">live score</p>
            </div>
          )}
          <LetterBadge score={liveScore} />
          <Badge variant="outline" className={cn("text-[10px]",
            student.status === "graded"
              ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
              : "text-amber-600 bg-amber-500/10 border-amber-500/20"
          )}>
            {student.status === "graded" ? "Graded" : "Pending"}
          </Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded mark entry */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border space-y-4">
          {/* Live score bar */}
          {liveScore !== null && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Live final score</span>
                <span className="font-bold text-primary">{liveScore.toFixed(1)}% — {letterGrade(liveScore)}</span>
              </div>
              <Progress value={liveScore} className="h-2" />
            </div>
          )}

          {/* Criteria marks */}
          <div className="grid sm:grid-cols-2 gap-3">
            {criteria.map((c) => {
              const m = marks.find((x) => x.criterionId === c.id);
              const contribution = m?.mark != null
                ? ((m.mark / c.maxMark) * c.weight).toFixed(1)
                : null;
              return (
                <div key={c.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">
                      {c.name}
                      <span className="text-muted-foreground ml-1">({c.weight}% weight)</span>
                    </Label>
                    {contribution && (
                      <span className="text-[10px] text-primary font-semibold">+{contribution} pts</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max={c.maxMark}
                      value={m?.mark ?? ""}
                      onChange={(e) => setMark(c.id, e.target.value)}
                      placeholder={`0–${c.maxMark}`}
                      className="h-9 text-sm"
                      disabled={isAdmin}
                    />
                    <span className="text-xs text-muted-foreground shrink-0">/ {c.maxMark}</span>
                  </div>
                  {m?.mark != null && (
                    <Progress
                      value={(m.mark / c.maxMark) * 100}
                      className="h-1"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Feedback */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Teacher feedback</Label>
            <Textarea
              value={feedback}
              onChange={(e) => { setFeedback(e.target.value); setDirty(true); }}
              placeholder="Write detailed feedback for the student…"
              className="min-h-[80px] resize-none text-sm"
              disabled={isAdmin}
            />
          </div>

          {/* Actions */}
          {!isAdmin && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm" variant="outline"
                className="gap-1.5 h-8 text-xs"
                onClick={() => handleSave("pending")}
                disabled={!dirty}
              >
                <Save className="h-3.5 w-3.5" /> Save draft
              </Button>
              <Button
                size="sm"
                className="gap-1.5 h-8 text-xs gradient-primary text-white border-0"
                onClick={() => handleSave("graded")}
                disabled={!allGraded}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Finalise grade
              </Button>
              {!allGraded && (
                <span className="text-[10px] text-muted-foreground">
                  Enter all {criteria.length} criteria to finalise
                </span>
              )}
            </div>
          )}

          {isAdmin && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2 text-xs text-amber-700">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Admins can view grades but cannot modify them.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Release Control Panel ────────────────────────────────────────────────────
function ReleaseControl({
  gradebook, isAdmin, onUpdate,
}: {
  gradebook: CourseGradebook;
  isAdmin: boolean;
  onUpdate: (mode: ReleaseMode, releaseAt: string | null) => void;
}) {
  const [mode, setMode]         = useState<ReleaseMode>(gradebook.releaseMode);
  const [dateTime, setDateTime] = useState(
    gradebook.releaseAt
      ? new Date(gradebook.releaseAt).toISOString().slice(0, 16)
      : ""
  );

  const released = isResultReleased(gradebook);

  const handleSave = () => {
    if (mode === "scheduled" && !dateTime) {
      toast.error("Set a release date/time for scheduled release.");
      return;
    }
    const iso = mode === "scheduled" && dateTime ? new Date(dateTime).toISOString() : null;
    onUpdate(mode, iso);
    toast.success("Release settings saved.");
  };

  return (
    <Card className="p-5 border-border shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Result Release Control</h3>
        </div>
        <Badge variant="outline" className={cn("text-[10px]",
          released
            ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
            : "text-amber-600 bg-amber-500/10 border-amber-500/20"
        )}>
          {released ? "Released" : "Locked"}
        </Badge>
      </div>

      {gradebook.approved && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          Approved by {gradebook.approvedBy} · {gradebook.approvedAt ? formatDateTime(gradebook.approvedAt) : ""}
        </div>
      )}

      {!isAdmin && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "immediate", label: "Immediate", desc: "Released now", icon: CheckCircle2 },
              { value: "scheduled", label: "Scheduled", desc: "Set date/time", icon: CalendarCheck },
              { value: "manual",    label: "Manual",    desc: "Hold release", icon: EyeOff },
            ] as const).map(({ value, label, desc, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all",
                  mode === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                <span className="text-[10px] opacity-70">{desc}</span>
              </button>
            ))}
          </div>

          {mode === "scheduled" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Release date & time</Label>
              <Input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="h-9 text-sm"
                min={new Date().toISOString().slice(0, 16)}
              />
              {dateTime && (
                <p className="text-xs text-muted-foreground">
                  Results will be visible after {formatDateTime(new Date(dateTime).toISOString())}
                </p>
              )}
            </div>
          )}

          <Button size="sm" className="gradient-primary text-white border-0 gap-1.5 h-8 text-xs" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" /> Save release settings
          </Button>
        </div>
      )}

      {isAdmin && !gradebook.approved && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Review the grades below, then approve to make them visible to students (subject to release mode).
          </p>
          <Button
            size="sm"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 gap-1.5 h-8 text-xs"
            onClick={() => {
              gradingStore.approve(gradebook.courseId, "Admin");
              toast.success("Results approved. Students can now see their grades.");
              window.location.reload();
            }}
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Approve results
          </Button>
        </div>
      )}

      {isAdmin && gradebook.approved && (
        <p className="text-xs text-muted-foreground">
          Results are approved. Release mode: <strong>{gradebook.releaseMode}</strong>
          {gradebook.releaseAt && ` · ${formatDateTime(gradebook.releaseAt)}`}
        </p>
      )}
    </Card>
  );
}

// ─── Main Grading System Page ─────────────────────────────────────────────────
export function GradingSystemPage() {
  const { currentUser, role } = useAuth();
  const isAdmin   = role === "admin" || role === "super_admin";
  const isTeacher = role === "teacher";

  const teacherName = currentUser?.full_name ?? "";

  const [gradebooks, setGradebooks] = useState<CourseGradebook[]>(() =>
    isAdmin ? gradingStore.getAll() : gradingStore.getByTeacher(teacherName)
  );
  const [selectedCourse, setSelectedCourse] = useState<string>(gradebooks[0]?.courseId ?? "");
  const [criteriaOpen, setCriteriaOpen]     = useState(false);
  const [search, setSearch]                 = useState("");

  const gradebook = gradebooks.find((g) => g.courseId === selectedCourse);

  const refresh = () => {
    setGradebooks(isAdmin ? gradingStore.getAll() : gradingStore.getByTeacher(teacherName));
  };

  const filteredStudents = useMemo(() => {
    if (!gradebook) return [];
    const q = search.toLowerCase();
    return gradebook.students.filter((s) =>
      !q || s.studentName.toLowerCase().includes(q)
    );
  }, [gradebook, search]);

  // Stats
  const gradedCount   = gradebook?.students.filter((s) => s.status === "graded").length ?? 0;
  const pendingCount  = gradebook?.students.filter((s) => s.status === "pending").length ?? 0;
  const scores        = gradebook?.students
    .map((s) => computeFinalScore(s.marks, gradebook.criteria))
    .filter((x): x is number => x !== null) ?? [];
  const classAvg      = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  if (!gradebook) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <BookOpen className="h-10 w-10 opacity-20" />
        <p className="text-sm font-medium">No gradebooks found</p>
        <p className="text-xs">
          {isTeacher ? "You have no courses assigned yet." : "No courses in the system."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            {isAdmin ? "Grade Management" : "Grading System"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdmin
              ? "Review and approve student results — read-only access to marks"
              : "Enter marks by criteria, add feedback, and control result release"}
          </p>
        </div>
        {!isAdmin && (
          <Button
            variant="outline" size="sm" className="gap-1.5"
            onClick={() => setCriteriaOpen(true)}
          >
            <Settings className="h-4 w-4" /> Edit criteria
          </Button>
        )}
      </div>

      {/* Course selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="h-10 sm:w-[320px]">
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            {gradebooks.map((g) => (
              <SelectItem key={g.courseId} value={g.courseId}>
                {g.courseTitle}
                {isAdmin && ` — ${g.teacherName}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students…"
            className="h-10 pl-9"
          />
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Students",    value: gradebook.students.length, icon: Users,        color: "from-violet-400 to-purple-500" },
          { label: "Graded",      value: gradedCount,               icon: CheckCircle2, color: "from-emerald-400 to-teal-500" },
          { label: "Pending",     value: pendingCount,              icon: Clock,        color: "from-amber-400 to-orange-500" },
          { label: "Class avg",   value: classAvg !== null ? `${classAvg}%` : "—", icon: BarChart2, color: "from-sky-400 to-indigo-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4 border-border shadow-soft flex items-center gap-3">
            <div className={cn("h-9 w-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", color)}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold font-display leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Criteria summary chips */}
      <div className="flex flex-wrap gap-2">
        {gradebook.criteria.map((c, i) => {
          const colors = ["bg-violet-500/10 text-violet-700 border-violet-500/20","bg-sky-500/10 text-sky-700 border-sky-500/20","bg-emerald-500/10 text-emerald-700 border-emerald-500/20","bg-amber-500/10 text-amber-700 border-amber-500/20","bg-rose-500/10 text-rose-700 border-rose-500/20"];
          return (
            <span key={c.id} className={cn("inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border", colors[i % colors.length])}>
              {c.name} · {c.weight}% · max {c.maxMark}
            </span>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* Student list */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""}
            {" · "}click a row to expand and enter marks
          </p>
          {filteredStudents.map((student) => (
            <StudentMarkRow
              key={student.studentId}
              student={student}
              criteria={gradebook.criteria}
              isAdmin={isAdmin}
              onSave={(marks, feedback, status) => {
                gradingStore.updateStudentMarks(
                  gradebook.courseId, student.studentId, marks, feedback, status
                );
                refresh();
              }}
            />
          ))}
        </div>

        {/* Release control */}
        <div className="space-y-4">
          <ReleaseControl
            gradebook={gradebook}
            isAdmin={isAdmin}
            onUpdate={(mode, releaseAt) => {
              gradingStore.setRelease(gradebook.courseId, mode, releaseAt);
              refresh();
            }}
          />

          {/* Grade distribution */}
          {scores.length > 0 && (
            <Card className="p-5 border-border shadow-soft space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" /> Grade Distribution
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {(["A+","A","B+","B","C+","C","D","F"] as const).map((g) => {
                  const count = gradebook.students.filter((s) => {
                    const sc = computeFinalScore(s.marks, gradebook.criteria);
                    return sc !== null && letterGrade(sc) === g;
                  }).length;
                  return (
                    <div key={g} className="text-center">
                      <span className={cn("inline-flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold border", gradeColor(g))}>
                        {g}
                      </span>
                      <p className="text-sm font-bold mt-1">{count}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Criteria editor dialog */}
      <Dialog open={criteriaOpen} onOpenChange={setCriteriaOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4 text-primary" /> Edit grading criteria
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <CriteriaEditor
              criteria={gradebook.criteria}
              onChange={(c) => {
                gradingStore.updateCriteria(gradebook.courseId, c);
                refresh();
              }}
            />
          </div>
          <DialogFooter>
            <Button size="sm" className="gradient-primary text-white border-0" onClick={() => setCriteriaOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
