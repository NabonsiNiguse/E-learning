import { useMemo } from "react";
import {
  CalendarCheck, TrendingUp, AlertCircle, CheckCircle2,
  BookOpen, Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAttendance } from "@/context/attendance-context";
import { useApp } from "@/context/app-context";
import { mockCourses } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

const RATE_COLOR = (rate: number) =>
  rate >= 90 ? "text-emerald-600" : rate >= 75 ? "text-amber-600" : "text-red-600";

const RATE_BAR = (rate: number) =>
  rate >= 90 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-500" : "bg-red-500";

// ---------------------------------------------------------------------------
// Summary stat card
// ---------------------------------------------------------------------------
function StatCard({
  label, value, sub, icon: Icon, gradient,
}: {
  label: string; value: string | number; sub: string;
  icon: typeof TrendingUp; gradient: string;
}) {
  return (
    <Card className="p-4 border-border shadow-soft">
      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center mb-3", gradient)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="text-2xl font-bold font-display">{value}</div>
      <div className="text-sm font-medium mt-0.5">{label}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Per-course attendance card
// ---------------------------------------------------------------------------
function CourseAttendanceCard({
  courseId,
  courseTitle,
  thumbnail,
  studentId,
}: {
  courseId: string;
  courseTitle: string;
  thumbnail: string;
  studentId: string;
}) {
  const { records } = useAttendance();

  const courseRecords = useMemo(
    () =>
      records
        .filter((r) => r.course_id === courseId && r.student_id === studentId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [records, courseId, studentId]
  );

  const total   = courseRecords.length;
  const present = courseRecords.filter((r) => r.status === "present").length;
  const late    = courseRecords.filter((r) => r.status === "late").length;
  const absent  = courseRecords.filter((r) => r.status === "absent").length;
  const excused = courseRecords.filter((r) => r.status === "excused").length;
  const rate    = total ? Math.round(((present + late) / total) * 100) : 0;

  const recentSessions = courseRecords.slice(0, 6);

  if (total === 0) return null;

  return (
    <Card className="border-border shadow-soft overflow-hidden">
      {/* Course header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-border">
        <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br shrink-0", thumbnail)} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{courseTitle}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{total} sessions recorded</p>
        </div>
        {/* Attendance rate pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-1.5 w-20 rounded-full bg-border overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", RATE_BAR(rate))}
              style={{ width: `${rate}%` }}
            />
          </div>
          <span className={cn("text-sm font-bold w-10 text-right", RATE_COLOR(rate))}>
            {rate}%
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-[1fr_auto] divide-y sm:divide-y-0 sm:divide-x divide-border">
        {/* Recent sessions list */}
        <div className="divide-y divide-border">
          {recentSessions.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              No sessions yet
            </div>
          ) : (
            recentSessions.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-secondary/20 transition-colors">
                <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground w-28 shrink-0">{formatDate(r.date)}</span>
                <StatusBadge status={r.status} size="sm" />
                {r.notes && (
                  <span className="text-xs text-muted-foreground truncate ml-1 hidden sm:block">
                    {r.notes}
                  </span>
                )}
              </div>
            ))
          )}
          {courseRecords.length > 6 && (
            <div className="px-5 py-2.5 text-xs text-muted-foreground">
              +{courseRecords.length - 6} more sessions
            </div>
          )}
        </div>

        {/* Breakdown sidebar */}
        <div className="px-5 py-4 flex flex-col gap-3 min-w-[160px]">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Breakdown</p>
          {(
            [
              { status: "present" as AttendanceStatus, count: present, label: "Present" },
              { status: "late"    as AttendanceStatus, count: late,    label: "Late"    },
              { status: "absent"  as AttendanceStatus, count: absent,  label: "Absent"  },
              { status: "excused" as AttendanceStatus, count: excused, label: "Excused" },
            ] as const
          ).map(({ status, count, label }) => (
            <div key={status} className="flex items-center justify-between gap-3">
              <StatusBadge status={status} size="sm" />
              <span className="text-sm font-semibold tabular-nums">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function StudentAttendance() {
  const { currentUser } = useApp();
  const { records } = useAttendance();

  // AuthUser.id is a number; mock user id is a string like "u3"
  const studentId = currentUser?.id != null ? String(currentUser.id) : "u3";

  // Courses this student has attendance records for
  const enrolledCourseIds = useMemo(
    () => [...new Set(records.filter((r) => r.student_id === studentId).map((r) => r.course_id))],
    [records, studentId]
  );

  // Overall stats across all courses
  const allRecords = records.filter((r) => r.student_id === studentId);
  const total      = allRecords.length;
  const present    = allRecords.filter((r) => r.status === "present").length;
  const late       = allRecords.filter((r) => r.status === "late").length;
  const absent     = allRecords.filter((r) => r.status === "absent").length;
  const overallRate = total ? Math.round(((present + late) / total) * 100) : 0;

  const uniqueSessions = new Set(allRecords.map((r) => `${r.course_id}:${r.date}`)).size;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-display font-bold">My Attendance</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your attendance across all enrolled courses
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Overall rate"
          value={`${overallRate}%`}
          sub={overallRate >= 75 ? "Good standing" : "Needs improvement"}
          icon={TrendingUp}
          gradient={overallRate >= 75 ? "gradient-primary" : "bg-red-500"}
        />
        <StatCard
          label="Sessions attended"
          value={present + late}
          sub={`Out of ${total} total`}
          icon={CheckCircle2}
          gradient="bg-sky-500"
        />
        <StatCard
          label="Absences"
          value={absent}
          sub={absent === 0 ? "Perfect record" : absent > 3 ? "Review required" : "Within limit"}
          icon={AlertCircle}
          gradient={absent === 0 ? "bg-emerald-500" : absent > 3 ? "bg-red-500" : "bg-amber-500"}
        />
        <StatCard
          label="Total sessions"
          value={uniqueSessions}
          sub="Across all courses"
          icon={Clock}
          gradient="bg-violet-500"
        />
      </div>

      {/* Alert banner if at risk */}
      {overallRate < 75 && total > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-600">Attendance below 75%</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your attendance rate is {overallRate}%. Maintaining at least 75% is required to remain in good standing.
            </p>
          </div>
        </div>
      )}

      {/* Good standing banner */}
      {overallRate >= 90 && total > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-600">Excellent attendance!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You're at {overallRate}% — keep it up.
            </p>
          </div>
        </div>
      )}

      {/* Per-course breakdown */}
      {enrolledCourseIds.length === 0 ? (
        <Card className="border-border shadow-soft">
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <BookOpen className="h-10 w-10 opacity-20" />
            <p className="text-sm">No attendance records yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            By course
          </h3>
          {enrolledCourseIds.map((courseId) => {
            const course = mockCourses.find((c) => c.id === courseId);
            const title  = course?.title ?? allRecords.find((r) => r.course_id === courseId)?.course_title ?? courseId;
            const thumb  = course?.thumbnail ?? "from-slate-400 to-slate-600";
            return (
              <CourseAttendanceCard
                key={courseId}
                courseId={courseId}
                courseTitle={title}
                thumbnail={thumb}
                studentId={studentId}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
