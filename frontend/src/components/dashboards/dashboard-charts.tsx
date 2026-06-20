/**
 * Shared chart components used across all three dashboards.
 * Uses Recharts — already in package.json.
 */
import {
  AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Shared tooltip style
// ---------------------------------------------------------------------------
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg text-xs">
      {label && <p className="font-semibold text-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Weekly activity area chart
// ---------------------------------------------------------------------------
const weeklyData = [
  { day: "Mon", lessons: 4, minutes: 42 },
  { day: "Tue", lessons: 7, minutes: 68 },
  { day: "Wed", lessons: 3, minutes: 31 },
  { day: "Thu", lessons: 9, minutes: 95 },
  { day: "Fri", lessons: 6, minutes: 58 },
  { day: "Sat", lessons: 11, minutes: 112 },
  { day: "Sun", lessons: 5, minutes: 47 },
];

export function WeeklyActivityChart() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradLessons" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradMinutes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "oklch(0.5 0.03 250)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "oklch(0.5 0.03 250)" }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="lessons" name="Lessons" stroke="#10b981" strokeWidth={2} fill="url(#gradLessons)" dot={false} />
        <Area type="monotone" dataKey="minutes" name="Minutes" stroke="#6366f1" strokeWidth={2} fill="url(#gradMinutes)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Course enrollment bar chart
// ---------------------------------------------------------------------------
const enrollmentData = [
  { month: "Jan", students: 4 },
  { month: "Feb", students: 7 },
  { month: "Mar", students: 6 },
  { month: "Apr", students: 8 },
  { month: "May", students: 11 },
  { month: "Jun", students: 9 },
];

const BAR_COLORS = ["#10b981","#6366f1","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];

export function EnrollmentBarChart() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={enrollmentData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "oklch(0.5 0.03 250)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "oklch(0.5 0.03 250)" }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "oklch(0.96 0.01 250)" }} />
        <Bar dataKey="students" name="Students" radius={[6, 6, 0, 0]}>
          {enrollmentData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Attendance donut chart
// ---------------------------------------------------------------------------
const attendanceData = [
  { name: "Present", value: 72, color: "#10b981" },
  { name: "Late",    value: 12, color: "#f59e0b" },
  { name: "Absent",  value: 10, color: "#ef4444" },
  { name: "Excused", value: 6,  color: "#6366f1" },
];

export function AttendanceDonutChart() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={attendanceData}
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={76}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {attendanceData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 11, color: "oklch(0.5 0.03 250)" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Progress radial chart (single student)
// ---------------------------------------------------------------------------
const progressData = [
  { name: "Progress", value: 64, fill: "#10b981" },
];

export function ProgressRadialChart({ value = 64, color = "#10b981" }: { value?: number; color?: string }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <RadialBarChart
        width={140} height={140}
        cx="50%" cy="50%"
        innerRadius="65%" outerRadius="90%"
        startAngle={90} endAngle={-270}
        data={[{ value, fill: color }]}
      >
        <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "oklch(0.96 0.01 250)" }} />
      </RadialBarChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black font-display" style={{ color }}>{value}%</span>
        <span className="text-[10px] text-muted-foreground">Progress</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Performance multi-bar chart (teacher view)
// ---------------------------------------------------------------------------
const performanceData = [
  { course: "Web Dev",    completion: 76, attendance: 88, satisfaction: 92 },
  { course: "Data Sci",   completion: 54, attendance: 79, satisfaction: 85 },
  { course: "Prod Mgmt",  completion: 68, attendance: 83, satisfaction: 90 },
];

export function PerformanceBarChart() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={performanceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={14} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" vertical={false} />
        <XAxis dataKey="course" tick={{ fontSize: 10, fill: "oklch(0.5 0.03 250)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "oklch(0.5 0.03 250)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "oklch(0.96 0.01 250)" }} />
        <Bar dataKey="completion"   name="Completion"   fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="attendance"   name="Attendance"   fill="#6366f1" radius={[4, 4, 0, 0]} />
        <Bar dataKey="satisfaction" name="Satisfaction" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 10, color: "oklch(0.5 0.03 250)" }}>{v}</span>} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Mini sparkline (inline trend)
// ---------------------------------------------------------------------------
const sparkData = [
  { v: 30 }, { v: 45 }, { v: 38 }, { v: 60 }, { v: 52 }, { v: 75 }, { v: 68 }, { v: 90 },
];

export function SparkLine({ color = "#10b981", data = sparkData }: { color?: string; data?: { v: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#spark-${color.replace("#", "")})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
