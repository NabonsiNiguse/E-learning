import { useState, useMemo } from "react";
import {
  CalendarCheck, ChevronLeft, ChevronRight, Save,
  Users, TrendingUp, AlertCircle, Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAttendance } from "@/context/attendance-context";
import { useApp } from "@/context/app-context";
import { mockCourses } from "@/lib/mock-data";
import type { AttendanceStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isoToday(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

function offsetDate(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent",  label: "Absent"  },
  { value: "late",    label: "Late"    },
  { value: "excused", label: "Excused" },
];

// Unique students from mock records (simulates enrolled students)
const ENROLLED_STUDENTS = [
  { id: "u3",  name: "Keab Niguse",    avatar: "KN", email: "keab@learnly.io" },
  { id: "u4",  name: "Eyob Haile",     avatar: "EH", email: "eyob@learnly.io"   },
  { id: "u6",  name: "Mikiyas Niguse", avatar: "MN", email: "mikiyas@learnly.io"   },
  { id: "s10", name: "Niguse Tsegaye", avatar: "NT", email: "niguse@learnly.io"  },
  { id: "s11", name: "John Wabskill",  avatar: "JW", email: "john@learnly.io"   },
];

// ---------------------------------------------------------------------------
// Summary stats card
// ---------------------------------------------------------------------------
function SummaryCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub: string;
  icon: typeof Users; color: string;
}) {
  return (
    <Card className="p-4 border-border shadow-soft">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", color)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold font-display">{value}</div>
      <div className="text-sm font-medium mt-0.5">{label}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Mark-attendance tab
// ---------------------------------------------------------------------------
function MarkAttendanceTab({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const { records, bulkSave } = useAttendance();
  const [date, setDate] = useState(isoToday());

  // Initialise row state from existing records for this session
  const existingMap = useMemo(() => {
    const m: Record<string, { status: AttendanceStatus; notes: string }> = {};
    records
      .filter((r) => r.course_id === courseId && r.date === date)
      .forEach((r) => { m[r.student_id] = { status: r.status, notes: r.notes }; });
    return m;
  }, [records, courseId, date]);

  const [rows, setRows] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >(() =>
    Object.fromEntries(
      ENROLLED_STUDENTS.map((s) => [
        s.id,
        existingMap[s.id] ?? { status: "present" as AttendanceStatus, notes: "" },
      ])
    )
  );

  // Re-init when date or existing records change
  const [lastDate, setLastDate] = useState(date);
  if (lastDate !== date) {
    setLastDate(date);
    setRows(
      Object.fromEntries(
        ENROLLED_STUDENTS.map((s) => [
          s.id,
          existingMap[s.id] ?? { status: "present" as AttendanceStatus, notes: "" },
        ])
      )
    );
  }

  const setStatus = (studentId: string, status: AttendanceStatus) =>
    setRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));

  const setNotes = (studentId: string, notes: string) =>
    setRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], notes } }));

  const markAll = (status: AttendanceStatus) =>
    setRows((prev) =>
      Object.fromEntries(Object.entries(prev).map(([id, v]) => [id, { ...v, status }]))
    );

  const handleSave = () => {
    const entries = ENROLLED_STUDENTS.map((s) => ({
      student_id:     s.id,
      student_name:   s.name,
      student_avatar: s.avatar,
      student_email:  s.email,
      status:         rows[s.id].status,
      notes:          rows[s.id].notes,
    }));
    bulkSave(courseId, courseTitle, date, entries);
    toast.success(`Attendance saved for ${formatDate(date)}`);
  };

  const counts = Object.values(rows).reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; },
    {} as Record<AttendanceStatus, number>
  );

  return (
    <div className="space-y-4">
      {/* Date navigator */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="icon" className="h-8 w-8"
            onClick={() => setDate((d) => offsetDate(d, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <input
            type="date"
            value={date}
            max={isoToday()}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            variant="outline" size="icon" className="h-8 w-8"
            onClick={() => setDate((d) => offsetDate(d, 1))}
            disabled={date >= isoToday()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{formatDate(date)}</span>
        </div>

        {/* Quick-mark all */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Mark all:</span>
          {STATUS_OPTIONS.map((o) => (
            <Button
              key={o.value}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAll(o.value)}
            >
              {o.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Session summary chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["present", "late", "absent", "excused"] as AttendanceStatus[]).map((s) => (
          <StatusBadge key={s} status={s} size="sm" />
        ))}
        <span className="text-xs text-muted-foreground ml-1">
          {counts.present ?? 0} present · {counts.absent ?? 0} absent · {counts.late ?? 0} late · {counts.excused ?? 0} excused
        </span>
      </div>

      {/* Student rows */}
      <Card className="border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-secondary/40 border-b border-border">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium w-[160px]">Status</th>
                <th className="px-5 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {ENROLLED_STUDENTS.map((student) => {
                const row = rows[student.id];
                return (
                  <tr key={student.id} className="border-t border-border hover:bg-secondary/30 transition-colors duration-100 cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                          {student.avatar}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{student.name}</div>
                          <div className="text-xs text-muted-foreground">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Select
                        value={row.status}
                        onValueChange={(v) => setStatus(student.id, v as AttendanceStatus)}
                      >
                        <SelectTrigger className="h-8 w-[140px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value} className="text-xs">
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-5 py-3">
                      <Textarea
                        value={row.notes}
                        onChange={(e) => setNotes(student.id, e.target.value)}
                        placeholder="Optional note…"
                        className="h-8 min-h-0 resize-none text-xs py-1.5"
                        rows={1}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          className="gradient-primary text-white border-0 shadow-glow gap-2"
          onClick={handleSave}
        >
          <Save className="h-4 w-4" />
          Save attendance
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// History tab
// ---------------------------------------------------------------------------
function HistoryTab({ courseId }: { courseId: string }) {
  const { records } = useAttendance();

  // Unique dates for this course, newest first
  const sessions = useMemo(() => {
    const dates = [...new Set(
      records.filter((r) => r.course_id === courseId).map((r) => r.date)
    )].sort((a, b) => b.localeCompare(a));
    return dates;
  }, [records, courseId]);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <CalendarCheck className="h-10 w-10 opacity-20" />
        <p className="text-sm">No sessions recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((date) => {
        const sessionRecords = records.filter(
          (r) => r.course_id === courseId && r.date === date
        );
        const present  = sessionRecords.filter((r) => r.status === "present").length;
        const total    = sessionRecords.length;
        const rate     = total ? Math.round((present / total) * 100) : 0;

        return (
          <Card key={date} className="border-border shadow-soft overflow-hidden">
            {/* Session header */}
            <div className="flex items-center justify-between px-5 py-3 bg-secondary/30 border-b border-border">
              <div className="flex items-center gap-3">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{formatDate(date)}</span>
                <Badge variant="outline" className="text-xs">
                  {present}/{total} present
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{rate}%</span>
              </div>
            </div>

            {/* Student rows */}
            <div className="divide-y divide-border">
              {sessionRecords.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-2.5">
                  <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                    {r.student_avatar}
                  </div>
                  <span className="text-sm flex-1 truncate">{r.student_name}</span>
                  <StatusBadge status={r.status} size="sm" />
                  {r.notes && (
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {r.notes}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analytics tab
// ---------------------------------------------------------------------------
function AnalyticsTab({ courseId }: { courseId: string }) {
  const { records } = useAttendance();

  const studentStats = useMemo(() => {
    return ENROLLED_STUDENTS.map((student) => {
      const studentRecords = records.filter(
        (r) => r.course_id === courseId && r.student_id === student.id
      );
      const total    = studentRecords.length;
      const present  = studentRecords.filter((r) => r.status === "present").length;
      const absent   = studentRecords.filter((r) => r.status === "absent").length;
      const late     = studentRecords.filter((r) => r.status === "late").length;
      const excused  = studentRecords.filter((r) => r.status === "excused").length;
      const rate     = total ? Math.round(((present + late) / total) * 100) : 0;
      return { ...student, total, present, absent, late, excused, rate };
    });
  }, [records, courseId]);

  const overallRate = studentStats.length
    ? Math.round(studentStats.reduce((a, s) => a + s.rate, 0) / studentStats.length)
    : 0;

  const atRisk = studentStats.filter((s) => s.rate < 75);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Avg. attendance"
          value={`${overallRate}%`}
          sub="Across all students"
          icon={TrendingUp}
          color="gradient-primary"
        />
        <SummaryCard
          label="Total students"
          value={studentStats.length}
          sub="Enrolled in course"
          icon={Users}
          color="bg-sky-500"
        />
        <SummaryCard
          label="At risk"
          value={atRisk.length}
          sub="Below 75% attendance"
          icon={AlertCircle}
          color="bg-red-500"
        />
        <SummaryCard
          label="Sessions held"
          value={[...new Set(records.filter((r) => r.course_id === courseId).map((r) => r.date))].length}
          sub="Total class sessions"
          icon={Clock}
          color="bg-amber-500"
        />
      </div>

      {/* Per-student breakdown */}
      <Card className="border-border shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">Student breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-secondary/40">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium text-center">Present</th>
                <th className="px-5 py-3 font-medium text-center">Late</th>
                <th className="px-5 py-3 font-medium text-center">Absent</th>
                <th className="px-5 py-3 font-medium text-center">Excused</th>
                <th className="px-5 py-3 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {studentStats.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-secondary/20">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                        {s.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{s.name}</div>
                        {s.rate < 75 && (
                          <span className="text-[10px] text-red-500 font-medium">At risk</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center text-emerald-600 font-medium">{s.present}</td>
                  <td className="px-5 py-3 text-center text-amber-600 font-medium">{s.late}</td>
                  <td className="px-5 py-3 text-center text-red-600 font-medium">{s.absent}</td>
                  <td className="px-5 py-3 text-center text-sky-600 font-medium">{s.excused}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-border overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            s.rate >= 90 ? "bg-emerald-500" :
                            s.rate >= 75 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${s.rate}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-xs font-medium w-8",
                        s.rate >= 90 ? "text-emerald-600" :
                        s.rate >= 75 ? "text-amber-600" : "text-red-600"
                      )}>
                        {s.rate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function TeacherAttendance() {
  const { role, currentUser } = useApp();
  
  // Admin sees all courses, teachers see only their own
  const teacherCourses = role === "admin" 
    ? mockCourses 
    : mockCourses.filter((c) => c.instructor === currentUser?.full_name);
  
  const [selectedCourseId, setSelectedCourseId] = useState(teacherCourses[0]?.id ?? "c1");
  const selectedCourse = teacherCourses.find((c) => c.id === selectedCourseId) ?? teacherCourses[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-display font-bold">Attendance</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {role === "admin" 
              ? "Manage attendance across all courses" 
              : "Track and manage student attendance across your courses"}
          </p>
        </div>
        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
          <SelectTrigger className="h-9 w-[260px] bg-secondary/60 border-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {teacherCourses.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mark">
        <TabsList className="bg-secondary/60 h-10">
          <TabsTrigger value="mark" className="text-sm data-[state=active]:shadow-sm">Mark attendance</TabsTrigger>
          <TabsTrigger value="history" className="text-sm data-[state=active]:shadow-sm">History</TabsTrigger>
          <TabsTrigger value="analytics" className="text-sm data-[state=active]:shadow-sm">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="mark" className="mt-5">
          <MarkAttendanceTab
            courseId={selectedCourse.id}
            courseTitle={selectedCourse.title}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-5">
          <HistoryTab courseId={selectedCourse.id} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-5">
          <AnalyticsTab courseId={selectedCourse.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
