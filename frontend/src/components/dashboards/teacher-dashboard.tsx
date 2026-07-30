import { Link } from "@tanstack/react-router";
import {
  Plus, Users, Star, TrendingUp, BookOpen, BarChart2,
  ArrowRight, Loader2, AlertTriangle, Eye, RefreshCw,
  GraduationCap, BookMarked,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/app-context";
import { useTeacherDashboard, useDashboardStats } from "@/lib/use-api";
import { PerformanceBarChart, AttendanceDonutChart, WeeklyActivityChart } from "./dashboard-charts";
import { StatCard, VideoCard, mockVideos } from "./dashboard-cards";
import { cn } from "@/lib/utils";

// ── Skeleton shimmer ──────────────────────────────────────────────────────
function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl bg-muted/60", className)} />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Banner skeleton */}
      <Shimmer className="h-36 rounded-2xl" />
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Shimmer key={i} className="h-28" />)}
      </div>
      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Shimmer className="lg:col-span-2 h-56" />
        <Shimmer className="h-56" />
      </div>
      {/* Course cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Shimmer key={i} className="h-24" />)}
      </div>
    </div>
  );
}

export function TeacherDashboard() {
  const { currentUser } = useApp();
  const legacy = useTeacherDashboard();
  const { data: statsRes, isLoading: statsLoading, isError: statsError } = useDashboardStats();

  // ── First-load: no cached data yet ───────────────────────────────────
  if ((legacy.isLoading && !legacy.data) && statsLoading) {
    return <DashboardSkeleton />;
  }

  // ── Hard error with no cached data to fall back on ───────────────────
  if ((legacy.isError && !legacy.data) && statsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <p className="font-semibold text-sm">
            {(legacy.error as any)?.message?.includes("Cannot connect")
              ? "Backend offline"
              : "Failed to load dashboard"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {(legacy.error as any)?.message?.includes("Cannot connect")
              ? "Start the Django server and try again."
              : (legacy.error as any)?.message ?? "An unexpected error occurred."}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => legacy.refetch()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  // ── Safe data access — prefer unified stats endpoint when available ───
  const rawStats = (statsRes && (statsRes.data ?? statsRes)) ?? legacy.data ?? {};
  const firstName     = currentUser?.full_name?.split(" ")[0] ?? "Instructor";
  const totalStudents = rawStats?.total_students ?? 0;
  const totalCourses  = rawStats?.total_courses  ?? 0;
  const totalLessons  = rawStats?.total_lessons  ?? 0;
  const courses       = rawStats?.courses        ?? legacy.data?.courses ?? [];

  const stats = [
    {
      label: "My Courses",
      value: totalCourses,
      sub: "Published & active",
      icon: BookOpen,
      gradient: "from-emerald-400 to-teal-500",
      change: "", sparkColor: "#10b981",
      to: "/courses",
      changePositive: true,
    },
    {
      label: "Total Students",
      value: totalStudents.toLocaleString(),
      sub: "Enrolled across courses",
      icon: Users,
      gradient: "from-violet-400 to-purple-500",
      change: "", sparkColor: "#8b5cf6",
      to: "/students",
      changePositive: true,
    },
    {
      label: "Total Lessons",
      value: totalLessons,
      sub: "Across all courses",
      icon: Star,
      gradient: "from-amber-400 to-orange-500",
      change: "", sparkColor: "#f59e0b",
      to: "/courses",
      changePositive: true,
    },
    {
      label: "Results",
      value: "View",
      sub: "Student grade overview",
      icon: TrendingUp,
      gradient: "from-sky-400 to-indigo-500",
      change: "", sparkColor: "#6366f1",
      to: "/results-unified",
      changePositive: true,
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Welcome banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 35%, #047857 65%, #0d9488 100%)" }}
      >
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(circle, #34d399 0%, transparent 70%)", filter: "blur(40px)" }} />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 mb-4">
              <span className="text-base">👋</span>
              <span className="text-white/90 text-xs font-semibold">Welcome back, Instructor</span>
              {/* Subtle background-refresh indicator */}
              {isFetching && !isLoading && (
                <RefreshCw className="h-3 w-3 text-white/40 animate-spin ml-0.5" />
              )}
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black leading-tight">
              Hello,{" "}
              <span className="bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h2>
            <p className="text-white/60 text-sm mt-2">
              {totalCourses} active course{totalCourses !== 1 ? "s" : ""} · {totalStudents.toLocaleString()} students enrolled
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-3">
            <div className="flex items-center gap-2">
              {[
                { label: "Courses",  value: totalCourses,                   color: "from-emerald-300 to-teal-300", bg: "bg-emerald-500/20 border-emerald-400/30" },
                { label: "Students", value: totalStudents.toLocaleString(), color: "from-cyan-300 to-sky-300",     bg: "bg-cyan-500/20 border-cyan-400/30"     },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`text-center px-4 py-3 rounded-2xl backdrop-blur-sm border ${bg}`}>
                  <div className={`text-2xl font-black tabular-nums bg-gradient-to-b ${color} bg-clip-text text-transparent`}>
                    {value}
                  </div>
                  <div className="text-[11px] text-white/60 uppercase tracking-wider mt-0.5 font-semibold">{label}</div>
                </div>
              ))}
            </div>
            <Button asChild className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold gap-1.5 h-10 px-5">
              <Link to="/courses"><Plus className="h-4 w-4" /> Create course</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Charts ── */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        <Card className="lg:col-span-2 p-5 border-border/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-base">Course Performance</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Completion, attendance & satisfaction</p>
            </div>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <PerformanceBarChart />
        </Card>
        <Card className="p-5 border-border/60">
          <div className="mb-4">
            <h3 className="font-display font-bold text-base">Attendance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">My courses breakdown</p>
          </div>
          <AttendanceDonutChart />
        </Card>
      </div>

      {/* ── My Courses (real API) ── */}
      {courses.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg">My Courses</h3>
              <p className="text-sm text-muted-foreground">Manage and track your published courses</p>
            </div>
            <Button asChild className="gradient-primary text-white border-0 gap-1.5">
              <Link to="/courses"><Plus className="h-4 w-4" /> Add course</Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(c => (
              <Link
                key={c.id}
                to="/lessons/$courseId"
                params={{ courseId: String(c.id) }}
                className="rounded-xl border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 mb-3" />
                <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{c.title}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />{c.student_count}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <BookMarked className="h-3 w-3" />{c.lesson_count} lessons
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-4 px-1.5 capitalize",
                      c.status === "published"
                        ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20"
                        : "text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/20"
                    )}
                  >
                    {c.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        /* Empty state — teacher has no courses yet */
        !isLoading && (
          <Card className="p-8 border-dashed text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-sm">No courses yet</p>
            <p className="text-xs text-muted-foreground">Create your first course to start teaching.</p>
            <Button asChild size="sm" className="gradient-primary text-white border-0 mx-auto">
              <Link to="/courses"><Plus className="h-3.5 w-3.5 mr-1.5" />Create course</Link>
            </Button>
          </Card>
        )
      )}

      {/* ── Enrollment ranking ── */}
      {courses.length > 0 && (
        <Card className="p-5 border-border/60">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-base">Enrollment Ranking</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Students enrolled per course</p>
            </div>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="space-y-4">
            {courses.map((c, i) => {
              const max = Math.max(...courses.map(x => x.student_count), 1);
              const pct = Math.round((c.student_count / max) * 100);
              const colors = [
                "from-emerald-500 to-teal-500",
                "from-violet-500 to-purple-500",
                "from-amber-500 to-orange-500",
              ];
              return (
                <div key={c.id} className="flex items-center gap-4">
                  <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1.5">
                      <span className="font-medium text-sm truncate">{c.title}</span>
                      <span className="text-sm font-bold shrink-0 ml-2">{c.student_count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", colors[i % colors.length])}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Quick links ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5 border-border/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-base">Student Results</h3>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-primary gap-1" asChild>
              <Link to="/results-unified"><Eye className="h-3.5 w-3.5" /> View all</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Review and submit student scores for your courses.</p>
          <Button asChild className="mt-4 w-full" variant="outline" size="sm">
            <Link to="/results-unified">Open Results</Link>
          </Button>
        </Card>
        <Card className="p-5 border-border/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-base">Attendance</h3>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-sm text-muted-foreground">Mark and review attendance for your classes.</p>
          <Button asChild className="mt-4 w-full" variant="outline" size="sm">
            <Link to="/attendance">Open Attendance</Link>
          </Button>
        </Card>
      </div>

      {/* ── Weekly activity ── */}
      <Card className="p-5 border-border/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-base">Weekly Activity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Lesson completions this week</p>
          </div>
        </div>
        <WeeklyActivityChart />
      </Card>

      {/* ── Video lessons ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg">My Video Lessons</h3>
            <p className="text-sm text-muted-foreground">Recently uploaded lesson content</p>
          </div>
          <Button variant="outline" size="sm" asChild className="text-xs hover:border-primary/40">
            <Link to="/shorts">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
          {mockVideos.slice(0, 3).map((v, i) => <VideoCard key={i} {...v} />)}
        </div>
      </div>

    </div>
  );
}
