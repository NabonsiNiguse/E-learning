import { useState, useMemo } from "react";
import {
  Plus, Search, Clock, BookOpen, Users,
  ChevronRight, Trophy, Trash2, Eye, Lock,
  BarChart2, CheckCircle2, XCircle, Award,
  TrendingUp, AlertCircle,
} from "lucide-react";
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
import { useQuiz } from "@/context/quiz-context";
import { useApp } from "@/context/app-context";
import type { Quiz, QuizAttempt, QuizStatus } from "@/lib/mock-data";
import { QuizStatusBadge } from "./quiz-status-badge";
import { CreateQuizDialog } from "./create-quiz-dialog";
import { QuizTaker } from "./quiz-taker";
import { QuizResult } from "./quiz-result";
import { toast } from "sonner";

type View = "list" | "taking" | "result";

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, gradient }: {
  label: string; value: string | number; sub: string; gradient: string;
}) {
  return (
    <Card className="p-4 border-border shadow-soft flex items-center gap-3">
      <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", gradient)}>
        <Trophy className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xl font-bold font-display leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        <p className="text-[10px] text-muted-foreground/60">{sub}</p>
      </div>
    </Card>
  );
}

// ── Teacher: submissions results dashboard ─────────────────────────────────
function TeacherResultsDashboard({
  quizzes, getAttemptsByQuiz,
}: {
  quizzes: Quiz[];
  getAttemptsByQuiz: (id: string) => QuizAttempt[];
}) {
  const [selectedQuiz, setSelectedQuiz] = useState<string>(quizzes[0]?.id ?? "");
  const quiz     = quizzes.find((q) => q.id === selectedQuiz);
  const attempts = quiz ? getAttemptsByQuiz(quiz.id) : [];

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((a, b) => a + b.score, 0) / attempts.length)
    : null;
  const passRate = attempts.length
    ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100)
    : null;
  const highScore = attempts.length ? Math.max(...attempts.map((a) => a.score)) : null;
  const lowScore  = attempts.length ? Math.min(...attempts.map((a) => a.score)) : null;

  return (
    <div className="space-y-5">
      {/* Quiz selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-sm font-medium shrink-0">Viewing results for:</p>
        <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
          <SelectTrigger className="h-9 w-[280px]">
            <SelectValue placeholder="Select a quiz…" />
          </SelectTrigger>
          <SelectContent>
            {quizzes.map((q) => (
              <SelectItem key={q.id} value={q.id}>
                <span className="flex items-center gap-2">
                  {q.title}
                  <Badge variant="outline" className="text-[10px]">
                    {getAttemptsByQuiz(q.id).length} attempts
                  </Badge>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!quiz ? (
        <Card className="border-border shadow-soft">
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <BarChart2 className="h-10 w-10 opacity-20" />
            <p className="text-sm font-medium">No quizzes available</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Attempts",   value: attempts.length,    sub: "Total submissions",     gradient: "from-violet-400 to-purple-500" },
              { label: "Avg score",  value: avgScore != null ? `${avgScore}%` : "—",  sub: "Mean score", gradient: "from-sky-400 to-indigo-500" },
              { label: "Pass rate",  value: passRate != null ? `${passRate}%` : "—",  sub: `Pass: ${quiz.passing_score}%`, gradient: "from-emerald-400 to-teal-500" },
              { label: "High score", value: highScore != null ? `${highScore}%` : "—",sub: `Low: ${lowScore ?? "—"}%`,  gradient: "from-amber-400 to-orange-500" },
            ].map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {/* Attempts table */}
          <Card className="border-border shadow-soft overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold">
                Student attempts — <span className="text-muted-foreground font-normal">{quiz.title}</span>
              </p>
              <Badge variant="outline" className="text-xs">{attempts.length} results</Badge>
            </div>

            {attempts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Users className="h-8 w-8 opacity-20" />
                <p className="text-sm">No students have attempted this quiz yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {/* Header */}
                <div className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-3 px-5 py-2.5 bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <span>Student</span>
                  <span className="text-center">Score</span>
                  <span className="text-center">Correct</span>
                  <span className="text-center">Time</span>
                  <span className="text-center">Result</span>
                </div>
                {attempts.map((att) => {
                  const timeMins = Math.floor(att.time_taken_seconds / 60);
                  const timeSecs = att.time_taken_seconds % 60;
                  return (
                    <div
                      key={att.id}
                      className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-3 px-5 py-3.5 items-center hover:bg-secondary/20 transition-colors"
                    >
                      {/* Student */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                          {att.student_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{att.student_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(att.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-center">
                        <span className={cn(
                          "text-sm font-bold tabular-nums",
                          att.score >= quiz.passing_score ? "text-emerald-600" : "text-red-600"
                        )}>
                          {att.score}%
                        </span>
                      </div>

                      {/* Correct */}
                      <div className="text-center text-sm text-muted-foreground tabular-nums">
                        {att.correct_count}/{att.total_questions}
                      </div>

                      {/* Time */}
                      <div className="text-center text-xs text-muted-foreground tabular-nums">
                        {timeMins}:{String(timeSecs).padStart(2, "0")}
                      </div>

                      {/* Result */}
                      <div className="text-center">
                        {att.passed ? (
                          <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Passed
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20 gap-1">
                            <XCircle className="h-3 w-3" /> Failed
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Score distribution mini bar */}
            {attempts.length > 0 && (
              <div className="px-5 py-4 border-t border-border bg-secondary/10">
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Score distribution</p>
                <div className="flex gap-1 h-16 items-end">
                  {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((bucket) => {
                    const count = attempts.filter((a) => a.score >= bucket && a.score < bucket + 10).length;
                    const pct   = attempts.length ? (count / attempts.length) * 100 : 0;
                    const isPassing = bucket >= quiz.passing_score;
                    return (
                      <div key={bucket} className="flex-1 flex flex-col items-center gap-1">
                        {count > 0 && (
                          <span className="text-[9px] text-muted-foreground tabular-nums">{count}</span>
                        )}
                        <div
                          className={cn(
                            "w-full rounded-t-sm min-h-[4px] transition-all",
                            isPassing ? "bg-emerald-500" : "bg-red-400"
                          )}
                          style={{ height: `${Math.max(pct * 0.5, pct > 0 ? 8 : 0)}px` }}
                        />
                        <span className="text-[9px] text-muted-foreground">{bucket}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// ── Teacher quiz card ──────────────────────────────────────────────────────
function TeacherQuizCard({
  quiz, attempts, onDelete, onStatusChange,
}: {
  quiz: Quiz;
  attempts: QuizAttempt[];
  onDelete: () => void;
  onStatusChange: (s: QuizStatus) => void;
}) {
  const avgScore = attempts.length
    ? Math.round(attempts.reduce((a, b) => a + b.score, 0) / attempts.length)
    : null;
  const passRate = attempts.length
    ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100)
    : null;

  return (
    <Card className="border-border shadow-soft hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200 ease-out group">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <QuizStatusBadge status={quiz.status} />
              <Badge variant="outline" className="text-[10px]">{quiz.questions.length} questions</Badge>
            </div>
            <h3 className="font-semibold text-base leading-snug">{quiz.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> {quiz.course_title}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{quiz.time_limit_minutes} min</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{attempts.length} attempts</span>
          <span>Pass: {quiz.passing_score}%</span>
          {avgScore !== null && <span className="text-primary font-medium">Avg: {avgScore}%</span>}
        </div>

        {passRate !== null && (
          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Pass rate</span>
              <span className="font-medium">{passRate}%</span>
            </div>
            <Progress value={passRate} className="h-1.5" />
          </div>
        )}

        {/* Status changer */}
        <Select value={quiz.status} onValueChange={(v) => onStatusChange(v as QuizStatus)}>
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}

// ── Student quiz card ──────────────────────────────────────────────────────
function StudentQuizCard({
  quiz, attempt, onStart, onViewResult,
}: {
  quiz: Quiz;
  attempt?: QuizAttempt;
  onStart: () => void;
  onViewResult: () => void;
}) {
  const canTake = quiz.status === "active" && !attempt;
  const hasDone = !!attempt;

  // Result release lock: check if release time has passed
  const releaseAt = (quiz as any).release_at as string | undefined;
  const resultLocked = hasDone && releaseAt && new Date() < new Date(releaseAt);
  const releaseLabel = releaseAt
    ? new Date(releaseAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <Card className={cn(
      "border-border shadow-soft hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200 ease-out",
      quiz.status === "active" && !hasDone && "border-primary/30"
    )}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <QuizStatusBadge status={hasDone ? "completed" : quiz.status} />
              {hasDone && !resultLocked && (
                <Badge className={cn(
                  "text-[10px]",
                  attempt.passed
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-red-500/10 text-red-600 border-red-500/20"
                )}>
                  {attempt.passed ? "Passed" : "Failed"} · {attempt.score}%
                </Badge>
              )}
              {resultLocked && (
                <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                  <Lock className="h-2.5 w-2.5" /> Result pending
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-base leading-snug">{quiz.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> {quiz.course_title}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{quiz.time_limit_minutes} min</span>
          <span>{quiz.questions.length} questions</span>
          <span>Pass: {quiz.passing_score}%</span>
        </div>

        {hasDone ? (
          <div className="space-y-2">
            {resultLocked ? (
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-3 py-2.5 text-xs text-amber-700 flex items-start gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Submitted — result not yet available</p>
                  {releaseLabel && (
                    <p className="mt-0.5">Result will be available after <strong>{releaseLabel}</strong></p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Your score</span>
                    <span className={cn("font-semibold", attempt.passed ? "text-emerald-600" : "text-red-600")}>
                      {attempt.score}%
                    </span>
                  </div>
                  <Progress
                    value={attempt.score}
                    className={cn("h-2", attempt.passed ? "[&>div]:bg-emerald-500" : "[&>div]:bg-red-500")}
                  />
                </div>
                <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-xs" onClick={onViewResult}>
                  <Eye className="h-3.5 w-3.5" /> View results & answers
                </Button>
              </>
            )}
          </div>
        ) : canTake ? (
          <Button
            className="w-full gradient-primary text-white border-0 shadow-glow gap-1.5 h-9"
            onClick={onStart}
          >
            Start quiz <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="w-full h-9 text-xs" disabled>
            {quiz.status === "upcoming" ? "Not available yet" : "Quiz closed"}
          </Button>
        )}
      </div>
    </Card>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export function QuizzesPage() {
  const { quizzes, attempts, deleteQuiz, updateQuizStatus, getAttemptsByQuiz, getAttemptsByStudent } = useQuiz();
  const { role, currentUser } = useApp();

  const isTeacher      = role === "teacher" || role === "admin";
  const instructorName = currentUser?.full_name ?? "Sara Bekele";
  const studentId      = currentUser?.id?.toString() ?? "u3";

  const [view, setView]           = useState<View>("list");
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<QuizAttempt | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState<QuizStatus | "all">("all");

  // Filter quizzes
  const visibleQuizzes = quizzes.filter((q) => {
    if (isTeacher && role === "teacher" && q.created_by !== instructorName) return false;
    if (search && !q.title.toLowerCase().includes(search.toLowerCase()) &&
        !q.course_title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && q.status !== statusFilter) return false;
    return true;
  });

  // Stats
  const myAttempts    = getAttemptsByStudent(studentId);
  const totalQuizzes  = visibleQuizzes.length;
  const activeCount   = visibleQuizzes.filter((q) => q.status === "active").length;
  const completedCount = isTeacher
    ? visibleQuizzes.filter((q) => q.status === "completed").length
    : myAttempts.length;
  const avgScore = myAttempts.length
    ? Math.round(myAttempts.reduce((a, b) => a + b.score, 0) / myAttempts.length)
    : 0;

  if (view === "taking" && activeQuiz) {
    return (
      <QuizTaker
        quiz={activeQuiz}
        onFinish={(att) => { setActiveAttempt(att); setView("result"); }}
        onCancel={() => { setView("list"); setActiveQuiz(null); }}
      />
    );
  }

  if (view === "result" && activeQuiz && activeAttempt) {
    const quizAttempts = getAttemptsByQuiz(activeQuiz.id);
    const studentAttempts = quizAttempts.filter((a) => a.student_id === studentId);
    const canRetake = studentAttempts.length < activeQuiz.attempts_allowed && activeQuiz.status === "active";
    return (
      <QuizResult
        quiz={activeQuiz}
        attempt={activeAttempt}
        onBack={() => { setView("list"); setActiveQuiz(null); setActiveAttempt(null); }}
        onRetake={canRetake ? () => setView("taking") : undefined}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-display font-bold">Quizzes & Exams</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isTeacher ? "Create and manage quizzes for your students" : "Take quizzes and track your performance"}
          </p>
        </div>
        {isTeacher && (
          <Button className="gradient-primary text-white border-0 shadow-glow gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Create quiz
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total quizzes"  value={totalQuizzes}  sub="In your courses"    gradient="from-violet-400 to-purple-500" />
        <StatCard label="Active now"     value={activeCount}   sub="Available to take"  gradient="from-emerald-400 to-teal-500" />
        <StatCard label={isTeacher ? "Completed" : "Attempted"} value={completedCount} sub={isTeacher ? "Finished quizzes" : "Quizzes taken"} gradient="from-sky-400 to-indigo-500" />
        <StatCard label={isTeacher ? "Avg pass rate" : "Avg score"} value={isTeacher ? `${Math.round(attempts.filter((a) => a.passed).length / Math.max(attempts.length, 1) * 100)}%` : `${avgScore}%`} sub="Across all quizzes" gradient="from-amber-400 to-orange-500" />
      </div>

      {/* Search + filter */}
      <Card className="p-4 border-border shadow-soft">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quizzes…" className="pl-9 h-10" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatus(v as QuizStatus | "all")}>
            <SelectTrigger className="h-10 w-[160px] shrink-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Teacher: tabbed view (Quizzes | Results) */}
      {isTeacher ? (
        <Tabs defaultValue="quizzes">
          <TabsList className="h-9">
            <TabsTrigger value="quizzes" className="gap-1.5 text-xs">
              <Trophy className="h-3.5 w-3.5" /> Quizzes ({visibleQuizzes.length})
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-1.5 text-xs">
              <BarChart2 className="h-3.5 w-3.5" /> Results Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quizzes" className="mt-4">
            {visibleQuizzes.length === 0 ? (
              <Card className="border-border shadow-soft">
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                  <Trophy className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">No quizzes found</p>
                  <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>Create your first quiz</Button>
                </div>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleQuizzes.map((quiz) => (
                  <TeacherQuizCard
                    key={quiz.id}
                    quiz={quiz}
                    attempts={getAttemptsByQuiz(quiz.id)}
                    onDelete={() => { deleteQuiz(quiz.id); toast.success("Quiz deleted."); }}
                    onStatusChange={(s) => updateQuizStatus(quiz.id, s)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="mt-4">
            {visibleQuizzes.length === 0 ? (
              <Card className="border-border shadow-soft">
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                  <BarChart2 className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">Create quizzes first to see results</p>
                </div>
              </Card>
            ) : (
              <TeacherResultsDashboard
                quizzes={visibleQuizzes}
                getAttemptsByQuiz={getAttemptsByQuiz}
              />
            )}
          </TabsContent>
        </Tabs>
      ) : (
        /* Student: quiz grid (unchanged) */
        visibleQuizzes.length === 0 ? (
          <Card className="border-border shadow-soft">
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Trophy className="h-10 w-10 opacity-20" />
              <p className="text-sm font-medium">No quizzes available right now</p>
              <p className="text-xs opacity-60">Your instructor hasn't published any active quizzes yet.</p>
            </div>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleQuizzes.map((quiz) => {
              const studentAttempts = getAttemptsByQuiz(quiz.id).filter((a) => a.student_id === studentId);
              const lastAttempt = studentAttempts[0];
              return (
                <StudentQuizCard
                  key={quiz.id}
                  quiz={quiz}
                  attempt={lastAttempt}
                  onStart={() => { setActiveQuiz(quiz); setView("taking"); }}
                  onViewResult={() => { setActiveQuiz(quiz); setActiveAttempt(lastAttempt); setView("result"); }}
                />
              );
            })}
          </div>
        )
      )}

      <CreateQuizDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
