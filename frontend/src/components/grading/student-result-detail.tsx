/**
 * Student Result Detail — university-style result page
 * Shows: final score, letter grade, criteria breakdown, teacher feedback,
 * release lock message, filters by course/year.
 */
import { useState, useMemo } from "react";
import {
  Award, Lock, Clock, CheckCircle2, BookOpen,
  Star, TrendingUp, MessageSquare, Calendar, Filter,
  ShieldCheck, AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { mockUsers } from "@/lib/mock-data";
import {
  gradingStore, computeFinalScore, letterGrade, gradeColor, isResultReleased,
} from "@/lib/grading-store";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "long", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function GradeBadge({ letter }: { letter: string }) {
  return (
    <span className={cn(
      "inline-flex items-center justify-center h-14 w-14 rounded-2xl text-xl font-black border-2",
      gradeColor(letter),
    )}>
      {letter}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 90 ? "#10b981" : score >= 75 ? "#3b82f6" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-secondary" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-xl font-black font-display tabular-nums" style={{ color }}>{score.toFixed(0)}</p>
        <p className="text-[10px] text-muted-foreground">/ 100</p>
      </div>
    </div>
  );
}

export function StudentResultDetail() {
  const { currentUser } = useAuth();
  const mockUser = mockUsers.find((u) => u.email === currentUser?.email);
  const studentId = mockUser?.id ?? "u3";

  const [courseFilter, setCourseFilter] = useState("all");

  const allResults = useMemo(() => gradingStore.getByStudent(studentId), [studentId]);

  const visible = useMemo(() => {
    if (courseFilter === "all") return allResults;
    return allResults.filter((r) => r.gradebook.courseId === courseFilter);
  }, [allResults, courseFilter]);

  const gpaMap: Record<string, number> = {
    "A+": 4.0, "A": 4.0, "B+": 3.5, "B": 3.0,
    "C+": 2.5, "C": 2.0, "D": 1.0, "F": 0,
  };
  const gradedResults = allResults.filter((r) => r.finalScore !== null);
  const gpa = gradedResults.length
    ? (gradedResults.reduce((s, r) => s + (gpaMap[r.letter] ?? 0), 0) / gradedResults.length).toFixed(2)
    : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" /> My Academic Results
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Criteria-based grades, teacher feedback, and release status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {allResults.map((r) => (
                <SelectItem key={r.gradebook.courseId} value={r.gradebook.courseId}>
                  {r.gradebook.courseTitle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* GPA summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Cumulative GPA",  value: gpa,                                    icon: Star,        color: "from-amber-400 to-orange-500" },
          { label: "Courses graded",  value: gradedResults.length,                   icon: BookOpen,    color: "from-violet-400 to-purple-500" },
          { label: "Courses pending", value: allResults.length - gradedResults.length, icon: Clock,     color: "from-sky-400 to-indigo-500" },
          { label: "Avg score",       value: gradedResults.length ? `${Math.round(gradedResults.reduce((s, r) => s + (r.finalScore ?? 0), 0) / gradedResults.length)}%` : "—", icon: TrendingUp, color: "from-emerald-400 to-teal-500" },
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

      {/* Result cards */}
      {visible.length === 0 ? (
        <Card className="border-border shadow-soft">
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <BookOpen className="h-10 w-10 opacity-20" />
            <p className="text-sm font-medium">No results yet</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {visible.map(({ gradebook, student, finalScore }) => {
            const released = isResultReleased(gradebook);

            return (
              <Card key={gradebook.courseId} className="border-border/60 shadow-soft overflow-hidden">
                {/* Top accent bar */}
                <div className={cn("h-1 w-full bg-gradient-to-r",
                  released ? "from-emerald-500 to-teal-500" : "from-amber-500 to-orange-500"
                )} />

                <div className="p-5 space-y-5">
                  {/* Course header */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-display font-bold text-lg">{gradebook.courseTitle}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <BookOpen className="h-3 w-3" /> {gradebook.teacherName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {released && finalScore !== null ? (
                        <>
                          <ScoreRing score={finalScore} />
                          <GradeBadge letter={letterGrade(finalScore)} />
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                          <Lock className="h-5 w-5 text-amber-500" />
                          <p className="text-xs font-semibold text-amber-700">Result locked</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Release status */}
                  {!released && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3">
                      <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-700">
                        <p className="font-semibold">Result not yet available</p>
                        {gradebook.releaseMode === "scheduled" && gradebook.releaseAt ? (
                          <p className="mt-0.5">
                            Result will be available after{" "}
                            <strong>{formatDateTime(gradebook.releaseAt)}</strong>
                          </p>
                        ) : gradebook.releaseMode === "manual" ? (
                          <p className="mt-0.5">Your teacher will release results manually.</p>
                        ) : !gradebook.approved ? (
                          <p className="mt-0.5">Awaiting admin approval before release.</p>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {released && finalScore !== null && (
                    <>
                      {/* Criteria breakdown */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Criteria Breakdown
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {gradebook.criteria.map((c, i) => {
                            const m = student.marks.find((x) => x.criterionId === c.id);
                            const pct = m?.mark != null ? Math.round((m.mark / c.maxMark) * 100) : null;
                            const contribution = m?.mark != null
                              ? ((m.mark / c.maxMark) * c.weight).toFixed(1)
                              : null;
                            const barColors = ["[&>div]:bg-violet-500","[&>div]:bg-sky-500","[&>div]:bg-emerald-500","[&>div]:bg-amber-500","[&>div]:bg-rose-500"];

                            return (
                              <div key={c.id} className="rounded-xl border border-border/60 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold">{c.name}</span>
                                  <div className="flex items-center gap-2">
                                    {pct !== null ? (
                                      <span className="text-sm font-bold tabular-nums text-primary">
                                        {m?.mark}/{c.maxMark}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">Not graded</span>
                                    )}
                                  </div>
                                </div>
                                {pct !== null && (
                                  <>
                                    <Progress value={pct} className={cn("h-1.5", barColors[i % barColors.length])} />
                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                      <span>Weight: {c.weight}%</span>
                                      <span className="text-primary font-semibold">Contributes {contribution} pts</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Teacher feedback */}
                      {student.feedback && (
                        <div className="rounded-xl bg-sky-500/5 border border-sky-500/20 px-4 py-3 space-y-1.5">
                          <p className="text-xs font-semibold text-sky-700 flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5" /> Teacher Feedback
                          </p>
                          <p className="text-sm text-foreground leading-relaxed">{student.feedback}</p>
                          {student.gradedAt && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Graded {formatDateTime(student.gradedAt)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Approval badge */}
                      {gradebook.approved && (
                        <div className="flex items-center gap-2 text-xs text-emerald-700">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Approved by {gradebook.approvedBy}
                          {gradebook.approvedAt && ` · ${formatDateTime(gradebook.approvedAt)}`}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
