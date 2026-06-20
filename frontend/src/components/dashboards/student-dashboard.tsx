import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { PlayCircle, Clock, Award, BookOpen, ArrowRight, Loader2, TrendingUp, CalendarCheck, Zap, CheckCircle2, Target, Star, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/app-context";
import { useAttendance } from "@/context/attendance-context";
import { useStudentDashboard } from "@/lib/use-api";
import { mockLessons, mockStudentResults } from "@/lib/mock-data";
import { ProgressRadialChart, WeeklyActivityChart } from "./dashboard-charts";
import { StatCard, PremiumCourseCard, VideoCard, mockVideos } from "./dashboard-cards";
import { GradeCalculator } from "./grade-calculator";
import { cn } from "@/lib/utils";

function useStudentStats(studentId: string) {
  const { courses } = useApp();
  const { records } = useAttendance();
  return useMemo(() => {
    const enrolled      = courses.filter((c) => c.progress !== undefined && !c.locked);
    const inProgress    = enrolled.filter((c) => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100);
    const completed     = enrolled.filter((c) => c.progress === 100);
    const completedLessons = mockLessons.filter((l) => l.completed);
    const totalMinutes  = completedLessons.reduce((acc, l) => {
      const [m, s] = l.duration.split(":").map(Number);
      return acc + m + (s ?? 0) / 60;
    }, 0);
    const hoursLearned  = totalMinutes >= 60
      ? `${Math.floor(totalMinutes / 60)}h ${Math.round(totalMinutes % 60)}m`
      : `${Math.round(totalMinutes)}m`;
    const myRecords     = records.filter((r) => r.student_id === studentId);
    const totalSess     = myRecords.length;
    const presentSess   = myRecords.filter((r) => r.status === "present" || r.status === "late").length;
    const attendanceRate = totalSess > 0 ? Math.round((presentSess / totalSess) * 100) : null;
    const avgProgress   = enrolled.length > 0
      ? Math.round(enrolled.reduce((a, c) => a + (c.progress ?? 0), 0) / enrolled.length)
      : 0;
    const continueLearning = inProgress[0] ?? enrolled.find((c) => (c.progress ?? 0) === 0) ?? null;
    const recommended   = courses.filter((c) => c.progress === undefined || c.locked).slice(0, 3);
    return { enrolled, inProgress, completed, hoursLearned, attendanceRate, avgProgress, continueLearning, recommended };
  }, [courses, records, studentId]);
}

export function StudentDashboard() {
  const { currentUser, courses } = useApp();
  const { records } = useAttendance();
  const { data: apiData } = useStudentDashboard(); // cached — instant on revisit

  const studentId = currentUser?.id != null ? String(currentUser.id) : "u3";
  const stats_data = useStudentStats(studentId);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const firstName = currentUser?.first_name ?? currentUser?.full_name?.split(" ")[0] ?? "there";
  const { enrolled, inProgress, completed, hoursLearned, attendanceRate, avgProgress, continueLearning, recommended } = stats_data;

  // Use real API data for stats when available
  const enrolledCount  = apiData?.total_enrolled  ?? enrolled.length;
  const completedCount = apiData?.completed_courses ?? completed.length;

  const myResults = mockStudentResults.filter((r) => r.student_id === studentId);
  const avgGrade  = myResults.length
    ? Math.round(myResults.reduce((s, r) => s + r.final_grade, 0) / myResults.length)
    : null;

  const stats = [
    { label: "Enrolled",      value: enrolledCount,   sub: `${inProgress.length} in progress`,  icon: BookOpen,      gradient: "from-emerald-400 to-teal-500",  sparkColor: "#10b981", to: "/courses" },
    { label: "Completed",     value: completedCount,  sub: enrolledCount > 0 ? `${Math.round((completedCount / enrolledCount) * 100)}% done` : "—", icon: Award, gradient: "from-amber-400 to-orange-500", sparkColor: "#f59e0b", to: "/certificates" },
    { label: "Avg. progress", value: `${avgProgress}%`, sub: "Across active courses",              icon: TrendingUp,    gradient: "from-sky-400 to-indigo-500",    sparkColor: "#6366f1", to: "/courses" },
    {
      label: attendanceRate !== null ? "Attendance" : "Hours learned",
      value: attendanceRate !== null ? `${attendanceRate}%` : hoursLearned,
      sub:   attendanceRate !== null ? (attendanceRate >= 75 ? "On track ✓" : "⚠ At risk") : "Lesson time logged",
      icon:  attendanceRate !== null ? CalendarCheck : Clock,
      gradient: attendanceRate === null ? "from-rose-400 to-pink-500" : attendanceRate >= 75 ? "from-emerald-400 to-teal-500" : "from-red-400 to-rose-500",
      sparkColor: "#ec4899",
      to: "/attendance",
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Welcome hero ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #0369a1 100%)" }}>
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-10 w-72 h-72 rounded-full opacity-25"
            style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div className="absolute -bottom-16 right-10 w-80 h-64 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #38bdf8 0%, transparent 70%)", filter: "blur(50px)" }} />
          <div className="absolute top-0 right-1/3 w-48 h-48 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)", filter: "blur(30px)" }} />
        </div>
        {/* Diagonal lines pattern */}
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0.8) 1px, transparent 1px, transparent 12px)" }} />
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full border border-white/10" />
        <div className="absolute top-4 right-4 w-24 h-24 rounded-full border border-white/5" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex-1">
            {/* Streak badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 mb-4">
              <Flame className="h-4 w-4 text-amber-300" />
              <span className="text-white/90 text-xs font-semibold">Keep it up, {firstName}!</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black leading-tight">
              Your Learning{" "}
              <span className="bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
                Journey
              </span>
            </h2>
            <p className="text-white/60 text-sm mt-2 max-w-sm">
              {completed.length > 0
                ? `🎉 You've completed ${completed.length} course${completed.length > 1 ? "s" : ""}. Amazing progress!`
                : "Start learning today and track your progress here."}
            </p>
            {/* Grade + hours row */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {avgGrade !== null && (
                <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 rounded-full px-3 py-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                  <span className="text-amber-200 text-xs font-bold">Avg grade: {avgGrade}%</span>
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                <Clock className="h-3.5 w-3.5 text-sky-300" />
                <span className="text-white/80 text-xs font-semibold">{hoursLearned} learned</span>
              </div>
            </div>
          </div>

          {/* Radial progress + stats */}
          <div className="flex items-center gap-3">
            {/* Stat pills */}
            <div className="flex flex-col gap-2">
              {[
                { label: "Enrolled",  value: enrolled.length,  color: "from-sky-300 to-indigo-300",    bg: "bg-sky-500/20 border-sky-400/30" },
                { label: "Completed", value: completed.length, color: "from-violet-300 to-purple-300", bg: "bg-violet-500/20 border-violet-400/30" },
              ].map(({ label, value, color, bg }) => (                <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-sm border ${bg}`}>
                  <div className={`text-xl font-black tabular-nums bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</div>
                  <div className="text-[11px] text-white/60 font-semibold">{label}</div>
                </div>
              ))}
            </div>
            <ProgressRadialChart value={avgProgress} color="#34d399" />
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>



      {/* ── Continue learning (Compact) ── */}
      {continueLearning && (
        <Card className="overflow-hidden border-border/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
          <div className="p-4 sm:p-5 flex items-center gap-4">
            {/* Thumbnail */}
            <div className="relative h-20 w-20 rounded-xl shrink-0 overflow-hidden shadow-sm">
              {continueLearning.thumbnailImg || continueLearning.thumbnail?.startsWith('http') ? (
                <>
                  <img 
                    src={continueLearning.thumbnailImg || continueLearning.thumbnail} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/30" />
                </>
              ) : (
                <div className={cn("w-full h-full bg-gradient-to-br", continueLearning.thumbnail)} />
              )}
              <PlayCircle className="h-8 w-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge className="bg-primary text-primary-foreground border-0 text-xs gap-1 shadow-sm">
                  <Zap className="h-3 w-3" /> Continue
                </Badge>
                <Badge variant="outline" className="text-xs">{continueLearning.level}</Badge>
              </div>
              <h3 className="font-display font-bold text-sm leading-snug truncate">{continueLearning.title}</h3>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700"
                    style={{ width: `${continueLearning.progress ?? 0}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-primary shrink-0">{continueLearning.progress ?? 0}%</span>
              </div>
            </div>

            {/* CTA */}
            <Button asChild size="sm" className="gradient-primary text-white border-0 shadow-[0_2px_8px_-2px] shadow-primary/40 shrink-0">
              <Link to="/lessons/$courseId" params={{ courseId: continueLearning.id }}>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* ── Charts + My courses ── */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        <Card className="lg:col-span-2 p-5 border-border/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-base">Weekly Activity</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Your learning sessions this week</p>
            </div>
            <Badge variant="outline" className="text-xs bg-sky-500/10 text-sky-600 border-sky-500/20">This week</Badge>
          </div>
          <WeeklyActivityChart />
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Lessons</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Minutes</div>
          </div>
        </Card>

        <Card className="p-5 border-border/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base">My Courses</h3>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" asChild>
              <Link to="/courses">View all</Link>
            </Button>
          </div>
          {enrolled.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
              <BookOpen className="h-8 w-8 opacity-30" />
              <p className="text-sm">No courses yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {enrolled.map((c) => (
                <Link key={c.id} to="/lessons/$courseId" params={{ courseId: c.id }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/60 transition-colors group">
                  <div className="relative h-10 w-10 rounded-xl shrink-0 overflow-hidden shadow-sm">
                    {c.thumbnailImg || c.thumbnail?.startsWith('http') ? (
                      <>
                        <img 
                          src={c.thumbnailImg || c.thumbnail} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                        {c.progress === 100 && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className={cn("w-full h-full bg-gradient-to-br flex items-center justify-center", c.thumbnail)}>
                        {c.progress === 100 && <CheckCircle2 className="h-5 w-5 text-white" />}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs truncate group-hover:text-primary transition-colors">{c.title}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                          style={{ width: `${c.progress ?? 0}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-7 text-right shrink-0">{c.progress ?? 0}%</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Grade simulator + Recommended ── */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
        <GradeCalculator />

        <Card className="p-5 border-border/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-base">Recommended for You</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Based on your learning history</p>
            </div>
            <Target className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {recommended.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-primary/5 hover:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.1)] transition-all group">
                <div className="relative h-12 w-12 rounded-xl shrink-0 overflow-hidden shadow-sm">
                  {c.thumbnailImg || c.thumbnail?.startsWith('http') ? (
                    <img 
                      src={c.thumbnailImg || c.thumbnail} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className={cn("w-full h-full bg-gradient-to-br flex items-center justify-center", c.thumbnail)}>
                      <BookOpen className="h-5 w-5 text-white/80" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{c.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>{c.lessons} lessons</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-amber-400 fill-amber-400" />{c.rating}</span>
                  </div>
                </div>
                <Button size="sm" className="gradient-primary text-white border-0 h-8 text-xs shrink-0 shadow-[0_2px_8px_-2px] shadow-primary/40" asChild>
                  <Link to="/payment/$courseId" params={{ courseId: c.id }}>${c.price}</Link>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Learning Shorts ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg">Learning Shorts</h3>
            <p className="text-sm text-muted-foreground">Quick lessons to boost your skills</p>
          </div>
          <Button variant="outline" size="sm" asChild className="text-xs gap-1.5 hover:border-primary/40">
            <Link to="/shorts"><Zap className="h-3.5 w-3.5" /> View all</Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {mockVideos.map((v, i) => <VideoCard key={i} {...v} />)}
        </div>
      </div>
    </div>
  );
}
