import { Link, useNavigate } from "@tanstack/react-router";
import { Users, GraduationCap, BookOpen, TrendingUp, UserCheck, ArrowUpRight, Activity, Loader2, Shield, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAttendance } from "@/context/attendance-context";
import { WeeklyActivityChart, EnrollmentBarChart, AttendanceDonutChart } from "./dashboard-charts";
import { StatCard, PremiumCourseCard } from "./dashboard-cards";
import { useApp } from "@/context/app-context";
import { useAdminDashboard, useDashboardStats, useNotifications } from "@/lib/use-api";
import { cn } from "@/lib/utils";

export function AdminDashboard() {
  const { courses } = useApp();
  const { records } = useAttendance();
  const navigate = useNavigate();
  const legacy = useAdminDashboard();
  const { data: statsRes, isLoading: statsLoading, isError: statsError } = useDashboardStats();
  const { data: notifsRes, isLoading: notifsLoading, isError: notifsError } = useNotifications();
  const notifications = (notifsRes as any)?.results ?? [];

  if (legacy.isLoading && statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const apiData = (statsRes && (statsRes.data ?? statsRes)) ?? legacy.data ?? {};

  const totalUsers   = apiData?.totals?.users ?? 0;
  const teachers     = apiData?.totals?.teachers ?? 0;
  const students     = apiData?.totals?.students ?? 0;
  const totalCourses = apiData?.totals?.courses ?? courses.length;
  const published    = apiData?.totals?.published_courses ?? courses.filter(c => !c.locked).length;
  const enrollments  = apiData?.totals?.enrollments ?? 0;
  const presentSessions = records.filter(r => r.status === "present" || r.status === "late").length;
  const attendanceRate  = records.length > 0 ? Math.round((presentSessions / records.length) * 100) : 82;
  const topCourses = apiData?.top_courses
    ? apiData.top_courses.slice(0, 4).map(tc => courses.find(c => c.id === String(tc.id))).filter(Boolean) as typeof courses
    : [...courses].sort((a, b) => b.students - a.students).slice(0, 4);

  const stats = [
    { label: "Total users",     value: totalUsers.toLocaleString(),  sub: `${teachers} teachers · ${students} students`, icon: Users,      gradient: "from-emerald-400 to-teal-500",  change: "+3",  sparkColor: "#10b981", to: "/users" },
    { label: "Active courses",  value: totalCourses,                 sub: `${published} published`,                      icon: BookOpen,   gradient: "from-violet-400 to-purple-500", change: "+8",  sparkColor: "#8b5cf6", to: "/courses" },
    { label: "Enrollments",     value: enrollments.toLocaleString(), sub: "Total active enrollments",                    icon: TrendingUp, gradient: "from-amber-400 to-orange-500",  change: "+3%", sparkColor: "#f59e0b", to: "/results-unified" },
    { label: "Attendance rate", value: `${attendanceRate}%`,         sub: "Platform-wide average",                       icon: UserCheck,  gradient: "from-sky-400 to-indigo-500",    change: "+2%", sparkColor: "#6366f1", to: "/attendance" },
  ];

  const quickMetrics = [
    { label: "Published courses", value: published, icon: CheckCircle2,  color: "text-sky-600",    bg: "bg-sky-500/10",    desc: `${totalCourses - published} drafts`, to: "/courses" },
    { label: "Active teachers",   value: teachers,  icon: GraduationCap, color: "text-violet-600", bg: "bg-violet-500/10", desc: "Verified instructors",               to: "/users" },
    { label: "Active students",   value: students,  icon: Users,         color: "text-emerald-600",bg: "bg-emerald-500/10",desc: "Enrolled learners",                  to: "/students" },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%)" }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-30" style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full opacity-25" style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)", filter: "blur(50px)" }} />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 mb-4">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
                <Shield className="h-3 w-3 text-white" />
              </div>
              <span className="text-white/90 text-xs font-semibold tracking-wide uppercase">Platform Administrator</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black leading-tight">
              Platform <span className="bg-gradient-to-r from-violet-300 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">Overview</span>
            </h2>
            <p className="text-white/60 text-sm mt-2 max-w-sm">Here's what's happening across Learnly today.</p>
            <div className="flex items-center gap-2 mt-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-emerald-300 text-xs font-semibold">Live data · Updated just now</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {[
              { label: "Students", value: students.toLocaleString(), color: "from-emerald-400 to-teal-400",  bg: "bg-emerald-500/20 border-emerald-400/30" },
              { label: "Courses",  value: totalCourses,              color: "from-violet-400 to-purple-400", bg: "bg-violet-500/20 border-violet-400/30" },
              { label: "Teachers", value: teachers,                  color: "from-sky-400 to-cyan-400",      bg: "bg-sky-500/20 border-sky-400/30" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`text-center px-4 py-3 rounded-2xl backdrop-blur-sm border ${bg}`}>
                <div className={`text-2xl font-black tabular-nums bg-gradient-to-b ${color} bg-clip-text text-transparent`}>{value}</div>
                <div className="text-[11px] text-white/60 uppercase tracking-wider mt-0.5 font-semibold">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} changePositive />)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {quickMetrics.map(({ label, value, icon: Icon, color, bg, desc, to }) => (
          <Link key={label} to={to as any} className={cn("flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:-translate-y-0.5 transition-all shadow-sm hover:shadow-md")}>
            <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", bg, color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-display tabular-nums">{value}</p>
              <p className="text-xs font-medium">{label}</p>
              <p className="text-[11px] text-muted-foreground">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        <Card className="lg:col-span-2 p-5 border-border/60">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-display font-bold text-base">Weekly Activity</h3><p className="text-xs text-muted-foreground mt-0.5">Lessons completed & minutes learned</p></div>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">This week</Badge>
          </div>
          <WeeklyActivityChart />
        </Card>
        <Card className="p-5 border-border/60">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-display font-bold text-base">Attendance</h3><p className="text-xs text-muted-foreground mt-0.5">Platform-wide breakdown</p></div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <AttendanceDonutChart />
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        <Card className="p-5 border-border/60">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-display font-bold text-base">Enrollments</h3><p className="text-xs text-muted-foreground mt-0.5">New students per month</p></div>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </div>
          <EnrollmentBarChart />
        </Card>
        <Card className="lg:col-span-2 p-5 border-border/60">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-display font-bold text-base">Recent Activity</h3><p className="text-xs text-muted-foreground mt-0.5">Latest events across the platform</p></div>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" asChild><Link to="/users">View all</Link></Button>
          </div>
          <div className="space-y-0.5">
            {notifications.length === 0 && !notifsLoading && (
              <div className="text-sm text-muted-foreground py-6 text-center">No recent activity.</div>
            )}
            {notifsLoading ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : (
              notifications.slice(0,6).map((n: any) => (
                <button key={n.id} onClick={() => navigate({ to: "/notifications" as any })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 transition-colors text-left group">
                  <div className="h-8 w-8 rounded-full gradient-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0">{String(n.title || "N").slice(0,2)}</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">{n.title}</span>
                    <span className="text-sm text-muted-foreground block truncate">{n.message}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">{n.created_at ?? ""}</span>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="font-display font-bold text-lg">Top Courses</h3><p className="text-sm text-muted-foreground">Most enrolled courses on the platform</p></div>
          <Button variant="outline" size="sm" asChild className="text-xs hover:border-primary/40"><Link to="/courses">View all</Link></Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topCourses.map((c) => <PremiumCourseCard key={c.id} course={c} />)}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="font-display font-bold text-lg">System Modules</h3><p className="text-sm text-muted-foreground">Enable, disable, and manage system modules</p></div>
          <Button variant="outline" size="sm" asChild className="text-xs hover:border-primary/40"><Link to="/system/modules">Manage</Link></Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <Card className="p-4 border-border/60 text-sm">Modules are managed server-side. Visit the module manager to change permissions and enable overrides. Admins with proper backend authorization can override records where allowed.</Card>
        </div>
      </div>
    </div>
  );
}
