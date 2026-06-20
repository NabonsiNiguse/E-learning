import { useState, useMemo } from "react";
import {
  Plus, Search, Calendar, BookOpen, Paperclip,
  Clock, Users, ChevronRight, Download, Eye,
  Trash2, Star, CheckCircle2, AlertCircle,
  BarChart2, Filter, TrendingUp,
} from "lucide-react";
import { downloadFile, mimeFromName } from "@/lib/download";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAssignment } from "@/context/assignment-context";
import { useApp } from "@/context/app-context";
import type { Assignment, AssignmentSubmission, AssignmentStatus } from "@/lib/mock-data";
import { AssignmentStatusBadge } from "./assignment-status-badge";
import { CreateAssignmentDialog } from "./create-assignment-dialog";
import { SubmitDialog } from "./submit-dialog";
import { GradePanel } from "./grade-panel";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDueDate(iso: string): string {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0)   return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff}d`;
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function isDueSoon(iso: string): boolean {
  const diff = (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 3;
}
function isPastDue(iso: string): boolean {
  return new Date(iso) < new Date();
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
function StatCard({ label, value, sub, icon: Icon, gradient }: {
  label: string; value: string | number; sub: string;
  icon: typeof CheckCircle2; gradient: string;
}) {
  return (
    <Card className="p-4 border-border shadow-soft flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.1)]">
      <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", gradient)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xl font-bold font-display leading-none tabular-nums">{value}</p>
        <p className="text-xs font-medium mt-0.5">{label}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Teacher: assignment card with expandable submission list
// ---------------------------------------------------------------------------
function TeacherAssignmentCard({ assignment, onDelete, onGrade }: {
  assignment: Assignment;
  onDelete: () => void;
  onGrade: (sub: AssignmentSubmission) => void;
}) {
  const { getSubmissionsByAssignment } = useAssignment();
  const [expanded, setExpanded] = useState(false);
  const subs   = getSubmissionsByAssignment(assignment.id);
  const graded = subs.filter((s) => s.status === "graded").length;
  const past   = isPastDue(assignment.due_date);

  return (
    <Card className="border-border shadow-soft hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200 ease-out group">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <Badge variant="outline" className="text-[10px]">{assignment.course_title}</Badge>
              {past && <Badge variant="outline" className="text-[10px] bg-slate-500/10 text-slate-600 border-slate-500/20">Closed</Badge>}
              {!past && isDueSoon(assignment.due_date) && (
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">Due soon</Badge>
              )}
            </div>
            <h3 className="font-semibold text-base leading-snug">{assignment.title}</h3>
            {assignment.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{assignment.description}</p>
            )}
          </div>
          <Button variant="ghost" size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(assignment.due_date)}
            {!past && (
              <span className={cn("ml-1 font-medium", isDueSoon(assignment.due_date) ? "text-amber-600" : "text-foreground")}>
                ({formatDueDate(assignment.due_date)})
              </span>
            )}
          </span>
          <span className="flex items-center gap-1"><Star className="h-3 w-3" />{assignment.max_score} pts</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{subs.length} submissions</span>
          {assignment.attachments.length > 0 && (
            <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />{assignment.attachments.length} files</span>
          )}
        </div>

        {subs.length > 0 && (
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Graded</span>
              <span className="font-medium">{graded}/{subs.length}</span>
            </div>
            <Progress value={subs.length > 0 ? (graded / subs.length) * 100 : 0} className="h-1.5" />
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5" onClick={() => setExpanded((v) => !v)}>
          <Eye className="h-3.5 w-3.5" />
          {expanded ? "Hide" : "View"} submissions ({subs.length})
          <ChevronRight className={cn("h-3.5 w-3.5 ml-auto transition-transform", expanded && "rotate-90")} />
        </Button>
      </div>

      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {subs.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground text-center">No submissions yet.</p>
          ) : subs.map((sub) => (
            <div key={sub.id} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/40 transition-colors duration-150 cursor-pointer">
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                {sub.student_avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{sub.student_name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(sub.submitted_at)}</p>
              </div>
              <AssignmentStatusBadge status={sub.status} />
              {sub.score !== null && (
                <span className="text-sm font-semibold text-primary">{sub.score}/{assignment.max_score}</span>
              )}
              <Button size="sm"
                variant={sub.status === "graded" ? "outline" : "default"}
                className={cn("h-7 text-xs gap-1 shrink-0", sub.status !== "graded" && "gradient-primary text-white border-0")}
                onClick={() => onGrade(sub)}>
                <Star className="h-3 w-3" />
                {sub.status === "graded" ? "Edit" : "Grade"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Student: assignment card
// ---------------------------------------------------------------------------
function StudentAssignmentCard({ assignment, submission, onSubmit, onViewFeedback }: {
  assignment: Assignment;
  submission?: AssignmentSubmission;
  onSubmit: () => void;
  onViewFeedback: () => void;
}) {
  const past = isPastDue(assignment.due_date);
  const status: AssignmentStatus = submission
    ? submission.status
    : past ? "missing" : "pending";

  return (
    <Card className={cn(
      "border-border shadow-soft hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200 ease-out",
      status === "pending" && !past && isDueSoon(assignment.due_date) && "border-amber-500/30",
      status === "missing" && "border-red-500/20",
    )}>
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <AssignmentStatusBadge status={status} />
              <Badge variant="outline" className="text-[10px]">{assignment.course_title}</Badge>
            </div>
            <h3 className="font-semibold text-base leading-snug">{assignment.title}</h3>
            {assignment.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{assignment.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className={cn("flex items-center gap-1 font-medium",
            past ? "text-red-600" : isDueSoon(assignment.due_date) ? "text-amber-600" : "text-foreground")}>
            <Clock className="h-3 w-3" />{formatDueDate(assignment.due_date)}
          </span>
          <span className="text-muted-foreground">{formatDate(assignment.due_date)}</span>
          <span className="flex items-center gap-1"><Star className="h-3 w-3" />{assignment.max_score} pts</span>
          {assignment.attachments.length > 0 && (
            <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />{assignment.attachments.length} files</span>
          )}
        </div>

        {submission?.status === "graded" && submission.score !== null && (
          <div className="mb-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Your score</span>
              <span className="text-lg font-bold font-display text-emerald-600">
                {submission.score}/{assignment.max_score}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  ({Math.round((submission.score / assignment.max_score) * 100)}%)
                </span>
              </span>
            </div>
            <Progress value={(submission.score / assignment.max_score) * 100} className="h-1.5 [&>div]:bg-emerald-500" />
            {submission.feedback && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">"{submission.feedback}"</p>
            )}
          </div>
        )}

        {assignment.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {assignment.attachments.map((a, i) => (
              <button key={i} onClick={() => { downloadFile(a.name, mimeFromName(a.name)); toast.success(`Downloading ${a.name}`); }}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-secondary transition-colors">
                <span className="font-bold text-primary uppercase">{a.type}</span>
                <span className="truncate max-w-[120px]">{a.name}</span>
                <Download className="h-3 w-3 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}

        {submission?.status === "graded" ? (
          <Button variant="outline" size="sm" className="w-full h-9 gap-1.5 text-xs" onClick={onViewFeedback}>
            <Eye className="h-3.5 w-3.5" /> View full feedback
          </Button>
        ) : submission ? (
          <div className="flex items-center gap-2 rounded-lg bg-sky-500/5 border border-sky-500/20 px-3 py-2.5 text-xs text-sky-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Submitted {formatDate(submission.submitted_at)} — awaiting review
          </div>
        ) : past ? (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2.5 text-xs text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Past due — late submission accepted
            <Button size="sm" variant="outline" className="ml-auto h-7 text-xs shrink-0" onClick={onSubmit}>Submit late</Button>
          </div>
        ) : (
          <Button className="w-full gradient-primary text-white border-0 shadow-glow gap-1.5 h-9" onClick={onSubmit}>
            Submit assignment <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Feedback modal (student)
// ---------------------------------------------------------------------------
function FeedbackModal({ submission, assignment, onClose }: {
  submission: AssignmentSubmission; assignment: Assignment; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg border-border shadow-soft">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">Feedback — {assignment.title}</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Score</span>
            <span className="text-2xl font-bold font-display text-primary">
              {submission.score}/{assignment.max_score}
            </span>
          </div>
          <Progress value={(submission.score! / assignment.max_score) * 100} className="h-2" />
          {submission.feedback && (
            <div className="rounded-xl bg-secondary/50 border border-border px-4 py-3 text-sm leading-relaxed">
              {submission.feedback}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Graded by {submission.graded_by} · {submission.graded_at ? formatDate(submission.graded_at) : ""}
          </p>
        </div>
        <div className="px-5 pb-5">
          <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Teacher: full submissions review dashboard
// ---------------------------------------------------------------------------
function TeacherSubmissionsDashboard({
  assignments, getSubmissionsByAssignment, onGrade,
}: {
  assignments: Assignment[];
  getSubmissionsByAssignment: (id: string) => AssignmentSubmission[];
  onGrade: (sub: AssignmentSubmission, asgn: Assignment) => void;
}) {
  const [selectedAsgn, setSelectedAsgn] = useState<string>(assignments[0]?.id ?? "");
  const [statusFilter, setStatus]       = useState<AssignmentStatus | "all">("all");
  const [search, setSearch]             = useState("");

  const assignment = assignments.find((a) => a.id === selectedAsgn);
  const allSubs    = assignment ? getSubmissionsByAssignment(assignment.id) : [];

  const filtered = allSubs.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (search && !s.student_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const graded   = allSubs.filter((s) => s.status === "graded").length;
  const pending  = allSubs.filter((s) => s.status === "submitted" || s.status === "late").length;
  const avgScore = allSubs.filter((s) => s.score != null).length > 0
    ? Math.round(
        allSubs
          .filter((s) => s.score != null)
          .reduce((acc, s) => acc + (s.score ?? 0), 0) /
        allSubs.filter((s) => s.score != null).length
      )
    : null;

  return (
    <div className="space-y-5">
      {/* Assignment selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-sm font-medium shrink-0">Assignment:</p>
        <Select value={selectedAsgn} onValueChange={setSelectedAsgn}>
          <SelectTrigger className="h-9 w-[300px]">
            <SelectValue placeholder="Select assignment…" />
          </SelectTrigger>
          <SelectContent>
            {assignments.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                <span className="flex items-center gap-2">
                  {a.title}
                  <Badge variant="outline" className="text-[10px]">
                    {getSubmissionsByAssignment(a.id).length} submissions
                  </Badge>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!assignment ? (
        <Card className="border-border shadow-soft">
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <BarChart2 className="h-10 w-10 opacity-20" />
            <p className="text-sm font-medium">No assignments available</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total submissions", value: allSubs.length,  sub: `of ~${assignment.max_score} pts`, gradient: "from-violet-400 to-purple-500", icon: Users },
              { label: "Graded",            value: graded,          sub: "Feedback sent",                  gradient: "from-emerald-400 to-teal-500",   icon: CheckCircle2 },
              { label: "Needs grading",     value: pending,         sub: "Awaiting review",                gradient: "from-amber-400 to-orange-500",   icon: Clock },
              { label: "Avg score",         value: avgScore != null ? `${avgScore}/${assignment.max_score}` : "—", sub: "Of graded work", gradient: "from-sky-400 to-indigo-500", icon: Star },
            ].map(({ label, value, sub, gradient, icon: Icon }) => (
              <Card key={label} className="p-4 border-border shadow-soft flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", gradient)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold font-display leading-none tabular-nums">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  <p className="text-[10px] text-muted-foreground/60">{sub}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Grading progress */}
          {allSubs.length > 0 && (
            <Card className="p-4 border-border shadow-soft space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Grading progress</span>
                <span className="text-muted-foreground tabular-nums">{graded}/{allSubs.length} graded</span>
              </div>
              <Progress value={allSubs.length > 0 ? (graded / allSubs.length) * 100 : 0} className="h-2" />
            </Card>
          )}

          {/* Search + status filter */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student name…"
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatus(v as AssignmentStatus | "all")}>
              <SelectTrigger className="h-9 w-[160px] shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="graded">Graded</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submissions table */}
          <Card className="border-border shadow-soft overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold">
                Submissions — <span className="text-muted-foreground font-normal">{assignment.title}</span>
              </p>
              <Badge variant="outline" className="text-xs">{filtered.length} shown</Badge>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Users className="h-8 w-8 opacity-20" />
                <p className="text-sm">{allSubs.length === 0 ? "No submissions yet." : "No results match your filter."}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/20 transition-colors group"
                  >
                    {/* Student avatar */}
                    <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                      {sub.student_avatar}
                    </div>

                    {/* Name + submission info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{sub.student_name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(sub.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {sub.file_name && (
                          <button
                            className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                            onClick={() => {
                              if (sub.file_name) {
                                downloadFile(sub.file_name, mimeFromName(sub.file_name));
                                toast.success(`Downloading ${sub.file_name}`);
                              }
                            }}
                          >
                            <Download className="h-2.5 w-2.5" />{sub.file_name}
                          </button>
                        )}
                        {sub.text_response && (
                          <span className="text-[10px] text-muted-foreground italic">
                            "{sub.text_response.slice(0, 40)}{sub.text_response.length > 40 ? "…" : ""}"
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <AssignmentStatusBadge status={sub.status} />

                    {/* Score */}
                    {sub.score !== null && (
                      <span className="text-sm font-bold text-primary tabular-nums shrink-0">
                        {sub.score}/{assignment.max_score}
                      </span>
                    )}

                    {/* Grade button */}
                    <Button
                      size="sm"
                      variant={sub.status === "graded" ? "outline" : "default"}
                      className={cn(
                        "h-8 text-xs gap-1 shrink-0",
                        sub.status !== "graded" && "gradient-primary text-white border-0 shadow-[0_2px_8px_-2px] shadow-primary/40"
                      )}
                      onClick={() => onGrade(sub, assignment)}
                    >
                      <Star className="h-3 w-3" />
                      {sub.status === "graded" ? "Edit grade" : "Grade"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page export
// ---------------------------------------------------------------------------
export function AssignmentsPage() {
  const { assignments, deleteAssignment, getSubmissionsByAssignment, getSubmissionByStudent } = useAssignment();
  const { role, currentUser } = useApp();

  const isTeacher      = role === "teacher" || role === "admin" || role === "super_admin";
  const instructorName = currentUser?.full_name ?? "Sara Bekele";
  const studentId      = currentUser?.id?.toString() ?? "u3";

  const [createOpen, setCreateOpen]         = useState(false);
  const [submitTarget, setSubmitTarget]     = useState<Assignment | null>(null);
  const [gradeTarget, setGradeTarget]       = useState<{ sub: AssignmentSubmission; asgn: Assignment } | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<{ sub: AssignmentSubmission; asgn: Assignment } | null>(null);
  const [search, setSearch]                 = useState("");
  const [courseFilter, setCourse]           = useState("all");
  const [statusFilter, setStatus]           = useState<AssignmentStatus | "all">("all");

  const courses = [...new Set(assignments.map((a) => a.course_id))].map((id) => ({
    id, title: assignments.find((a) => a.course_id === id)?.course_title ?? id,
  }));

  // Assignments visible to this user after search/filter
  const visible = useMemo(() => {
    return assignments.filter((a) => {
      if (isTeacher && role === "teacher" && a.created_by !== instructorName) return false;
      if (search && !a.title.toLowerCase().includes(search.toLowerCase()) &&
          !a.course_title.toLowerCase().includes(search.toLowerCase())) return false;
      if (courseFilter !== "all" && a.course_id !== courseFilter) return false;
      if (!isTeacher && statusFilter !== "all") {
        const sub = getSubmissionByStudent(a.id, studentId);
        const st: AssignmentStatus = sub ? sub.status : isPastDue(a.due_date) ? "missing" : "pending";
        if (st !== statusFilter) return false;
      }
      return true;
    });
  }, [assignments, search, courseFilter, statusFilter, isTeacher, role, instructorName, studentId, getSubmissionByStudent]);

  // Teacher-scoped assignments for the Submissions Dashboard
  const teacherAssignments = useMemo(() =>
    assignments.filter((a) =>
      role === "admin" || role === "super_admin" || a.created_by === instructorName
    ),
    [assignments, role, instructorName]
  );

  // ── Stats ─────────────────────────────────────────────────────────────
  const totalSubs    = teacherAssignments.reduce((acc, a) => acc + getSubmissionsByAssignment(a.id).length, 0);
  const pendingGrade = teacherAssignments.reduce((acc, a) =>
    acc + getSubmissionsByAssignment(a.id).filter((s) => s.status === "submitted" || s.status === "late").length, 0);

  const mySubmissions = assignments.map((a) => getSubmissionByStudent(a.id, studentId)).filter(Boolean);
  const myGraded      = mySubmissions.filter((s) => s?.status === "graded").length;
  const myPending     = assignments.filter((a) => !getSubmissionByStudent(a.id, studentId) && !isPastDue(a.due_date)).length;

  // ── Student: urgent deadline alerts (due within 24h and not yet submitted)
  const urgentDue = !isTeacher
    ? assignments.filter((a) => {
        const diff = (new Date(a.due_date).getTime() - Date.now()) / (1000 * 60 * 60);
        return diff >= 0 && diff <= 24 && !getSubmissionByStudent(a.id, studentId);
      })
    : [];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-display font-bold">Assignments</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isTeacher ? "Create and grade student assignments" : "View and submit your assignments"}
          </p>
        </div>
        {isTeacher && (
          <Button className="gradient-primary text-white border-0 shadow-glow gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Create assignment
          </Button>
        )}
      </div>

      {/* ── Student: urgent deadline banner ── */}
      {urgentDue.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {urgentDue.length === 1 ? "1 assignment" : `${urgentDue.length} assignments`} due within 24 hours!
            </p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {urgentDue.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSubmitTarget(a)}
                  className="text-xs font-medium text-red-600 dark:text-red-400 underline underline-offset-2 hover:no-underline"
                >
                  {a.title} ({formatDueDate(a.due_date)})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {isTeacher ? (
          <>
            <StatCard label="Total assignments" value={teacherAssignments.length}    sub="Across your courses"    gradient="from-violet-400 to-purple-500" icon={BookOpen} />
            <StatCard label="Total submissions" value={totalSubs}                    sub="From all students"      gradient="from-sky-400 to-indigo-500"    icon={CheckCircle2} />
            <StatCard label="Needs grading"     value={pendingGrade}                 sub="Awaiting your review"   gradient="from-amber-400 to-orange-500"  icon={Star} />
            <StatCard label="Graded"            value={totalSubs - pendingGrade}     sub="Feedback given"         gradient="from-emerald-400 to-teal-500"  icon={CheckCircle2} />
          </>
        ) : (
          <>
            <StatCard label="Total assigned" value={assignments.length} sub="Across your courses"  gradient="from-violet-400 to-purple-500" icon={BookOpen} />
            <StatCard label="Pending"        value={myPending}          sub="Not yet submitted"     gradient="from-amber-400 to-orange-500"  icon={Clock} />
            <StatCard label="Submitted"      value={mySubmissions.length} sub="Awaiting review"    gradient="from-sky-400 to-indigo-500"    icon={CheckCircle2} />
            <StatCard label="Graded"         value={myGraded}           sub="Feedback received"    gradient="from-emerald-400 to-teal-500"  icon={Star} />
          </>
        )}
      </div>

      {/* ── Search + filter bar ── */}
      <Card className="p-4 border-border shadow-soft">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assignments…" className="pl-9 h-10" />
          </div>
          <Select value={courseFilter} onValueChange={setCourse}>
            <SelectTrigger className="h-10 w-[180px] shrink-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
          {!isTeacher && (
            <Select value={statusFilter} onValueChange={(v) => setStatus(v as AssignmentStatus | "all")}>
              <SelectTrigger className="h-10 w-[150px] shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="graded">Graded</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="missing">Missing</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </Card>

      {/* ── Teacher: tabbed view ── */}
      {isTeacher ? (
        <Tabs defaultValue="assignments">
          <TabsList className="h-9">
            <TabsTrigger value="assignments" className="gap-1.5 text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              Assignments ({teacherAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-1.5 text-xs">
              <BarChart2 className="h-3.5 w-3.5" />
              Submissions Review
              {pendingGrade > 0 && (
                <span className="ml-1 h-4 min-w-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {pendingGrade}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Assignments list ── */}
          <TabsContent value="assignments" className="mt-4">
            <div className={cn("grid gap-5", gradeTarget ? "lg:grid-cols-[1fr_360px]" : "grid-cols-1")}>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{visible.length} assignment{visible.length !== 1 ? "s" : ""}</p>
                {visible.length === 0 ? (
                  <Card className="border-border shadow-soft">
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                      <BookOpen className="h-10 w-10 opacity-20" />
                      <p className="text-sm font-medium">No assignments found</p>
                      <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                        Create your first assignment
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {visible.map((a) => (
                      <TeacherAssignmentCard key={a.id} assignment={a}
                        onDelete={() => { deleteAssignment(a.id); toast.success("Assignment deleted."); }}
                        onGrade={(sub) => setGradeTarget({ sub, asgn: a })}
                      />
                    ))}
                  </div>
                )}
              </div>

              {gradeTarget && (
                <Card className="border-border shadow-soft overflow-hidden h-fit lg:sticky lg:top-20">
                  <GradePanel
                    submission={gradeTarget.sub}
                    assignment={gradeTarget.asgn}
                    onClose={() => setGradeTarget(null)}
                  />
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── Tab: Submissions review dashboard ── */}
          <TabsContent value="submissions" className="mt-4">
            {teacherAssignments.length === 0 ? (
              <Card className="border-border shadow-soft">
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                  <BarChart2 className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">Create assignments first to review submissions</p>
                </div>
              </Card>
            ) : (
              <div className={cn("grid gap-5", gradeTarget ? "lg:grid-cols-[1fr_360px]" : "grid-cols-1")}>
                <TeacherSubmissionsDashboard
                  assignments={teacherAssignments}
                  getSubmissionsByAssignment={getSubmissionsByAssignment}
                  onGrade={(sub, asgn) => setGradeTarget({ sub, asgn })}
                />
                {gradeTarget && (
                  <Card className="border-border shadow-soft overflow-hidden h-fit lg:sticky lg:top-20">
                    <GradePanel
                      submission={gradeTarget.sub}
                      assignment={gradeTarget.asgn}
                      onClose={() => setGradeTarget(null)}
                    />
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        /* ── Student: assignment cards ── */
        <div className={cn("grid gap-5", gradeTarget ? "lg:grid-cols-[1fr_360px]" : "grid-cols-1")}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {visible.length} assignment{visible.length !== 1 ? "s" : ""}
            </p>
            {visible.length === 0 ? (
              <Card className="border-border shadow-soft">
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                  <BookOpen className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">No assignments found</p>
                  {statusFilter !== "all" && (
                    <Button variant="outline" size="sm" onClick={() => setStatus("all")}>
                      Clear filter
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {visible.map((a) => {
                  const sub = getSubmissionByStudent(a.id, studentId);
                  return (
                    <StudentAssignmentCard key={a.id} assignment={a} submission={sub}
                      onSubmit={() => setSubmitTarget(a)}
                      onViewFeedback={() => sub && setFeedbackTarget({ sub, asgn: a })}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
      <CreateAssignmentDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      {submitTarget && (
        <SubmitDialog assignment={submitTarget} open onClose={() => setSubmitTarget(null)} />
      )}
      {feedbackTarget && (
        <FeedbackModal
          submission={feedbackTarget.sub}
          assignment={feedbackTarget.asgn}
          onClose={() => setFeedbackTarget(null)}
        />
      )}
    </div>
  );
}
