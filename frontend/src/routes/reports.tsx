/**
 * Reports page — role-aware student reporting system
 *
 * Student  : submit reports to teacher (grade dispute, issue, feedback, other)
 *            view own report history + status
 * Teacher  : see aggregated/generalized stats only — no specific student content
 *            (privacy-protected: counts, categories, trends — not individual reports)
 * Admin    : full view of all reports, accept/reject with notes
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { FileText, Plus, Send, Clock, CheckCircle2, XCircle, AlertTriangle, BarChart2, Users, TrendingUp, Search, ChevronDown, ChevronUp, MessageSquare, Shield, Eye, EyeOff, Filter, RefreshCw, Inbox } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/app-context";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Learnly" }] }),
  component: ReportsPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────
type ReportCategory = "grade_dispute" | "technical_issue" | "feedback" | "absence_excuse" | "other";
type ReportStatus   = "pending" | "accepted" | "rejected" | "reviewing";
type ReportPriority = "low" | "medium" | "high";

interface Report {
  id: string;
  student_id: string;
  student_name: string;
  student_avatar: string;
  course_id: string;
  course_title: string;
  teacher_name: string;
  category: ReportCategory;
  priority: ReportPriority;
  subject: string;
  description: string;
  status: ReportStatus;
  admin_note?: string;
  submitted_at: string;
  updated_at: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INITIAL_REPORTS: Report[] = [
  {
    id: "r1", student_id: "u3", student_name: "Keab Niguse", student_avatar: "KN",
    course_id: "c1", course_title: "Modern Web Development", teacher_name: "Nabonsi Niguse",
    category: "grade_dispute", priority: "high",
    subject: "Assignment 2 grade seems incorrect",
    description: "I believe my assignment 2 was graded incorrectly. I submitted all required components but received 60/100. I would like a review.",
    status: "pending", submitted_at: "2026-04-28", updated_at: "2026-04-28",
  },
  {
    id: "r2", student_id: "u4", student_name: "Eyob Tesfaye", student_avatar: "ET",
    course_id: "c2", course_title: "Data Science Fundamentals", teacher_name: "Lemi Haile",
    category: "absence_excuse", priority: "medium",
    subject: "Medical absence — April 25",
    description: "I was absent on April 25 due to a medical appointment. I have attached a doctor's note and would like my attendance updated.",
    status: "reviewing", submitted_at: "2026-04-26", updated_at: "2026-04-27",
  },
  {
    id: "r3", student_id: "u5", student_name: "Mikiyas Alemu", student_avatar: "MA",
    course_id: "c1", course_title: "Modern Web Development", teacher_name: "Nabonsi Niguse",
    category: "technical_issue", priority: "medium",
    subject: "Video lesson not loading",
    description: "Lesson 7 video has not been loading for the past 3 days. I have tried different browsers and devices.",
    status: "accepted", admin_note: "Issue confirmed and forwarded to tech team. Video re-uploaded.",
    submitted_at: "2026-04-20", updated_at: "2026-04-22",
  },
  {
    id: "r4", student_id: "u6", student_name: "Niguse Bekele", student_avatar: "NB",
    course_id: "c3", course_title: "UI/UX Design Principles", teacher_name: "Nabonsi Niguse",
    category: "feedback", priority: "low",
    subject: "Suggestion: add more project examples",
    description: "The course is great but I think adding more real-world project examples would help students understand the concepts better.",
    status: "accepted", admin_note: "Feedback noted and shared with instructor.",
    submitted_at: "2026-04-15", updated_at: "2026-04-16",
  },
  {
    id: "r5", student_id: "u7", student_name: "John Tadesse", student_avatar: "JT",
    course_id: "c2", course_title: "Data Science Fundamentals", teacher_name: "Lemi Haile",
    category: "grade_dispute", priority: "high",
    subject: "Quiz 3 result dispute",
    description: "My quiz 3 shows 45% but I answered all questions correctly. I believe there may be a system error.",
    status: "rejected", admin_note: "Quiz reviewed — answers were partially correct. Score stands.",
    submitted_at: "2026-04-10", updated_at: "2026-04-12",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<ReportCategory, string> = {
  grade_dispute:    "Grade Dispute",
  technical_issue:  "Technical Issue",
  feedback:         "Feedback",
  absence_excuse:   "Absence Excuse",
  other:            "Other",
};

const CATEGORY_COLORS: Record<ReportCategory, string> = {
  grade_dispute:   "text-red-600 bg-red-500/10 border-red-500/20",
  technical_issue: "text-orange-600 bg-orange-500/10 border-orange-500/20",
  feedback:        "text-sky-600 bg-sky-500/10 border-sky-500/20",
  absence_excuse:  "text-violet-600 bg-violet-500/10 border-violet-500/20",
  other:           "text-slate-600 bg-slate-500/10 border-slate-500/20",
};

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending:   { label: "Pending",   color: "text-amber-600 bg-amber-500/10 border-amber-500/20",     icon: Clock },
  reviewing: { label: "Reviewing", color: "text-sky-600 bg-sky-500/10 border-sky-500/20",           icon: RefreshCw },
  accepted:  { label: "Accepted",  color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
  rejected:  { label: "Rejected",  color: "text-red-600 bg-red-500/10 border-red-500/20",           icon: XCircle },
};

const PRIORITY_CONFIG: Record<ReportPriority, { label: string; color: string }> = {
  low:    { label: "Low",    color: "text-slate-500 bg-slate-500/10 border-slate-500/20" },
  medium: { label: "Medium", color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
  high:   { label: "High",   color: "text-red-600 bg-red-500/10 border-red-500/20" },
};

// ─── Submit Report Modal ──────────────────────────────────────────────────────
function SubmitReportModal({ onSubmit, onClose, courses }: {
  onSubmit: (r: Omit<Report, "id" | "student_id" | "student_name" | "student_avatar" | "status" | "submitted_at" | "updated_at">) => void;
  onClose: () => void;
  courses: { id: string; title: string; instructor: string }[];
}) {
  const [form, setForm] = useState({
    course_id: courses[0]?.id ?? "",
    category: "grade_dispute" as ReportCategory,
    priority: "medium" as ReportPriority,
    subject: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCourse = courses.find((c) => c.id === form.course_id);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.subject.trim())      e.subject = "Subject is required";
    if (form.subject.length > 100) e.subject = "Subject must be under 100 characters";
    if (!form.description.trim())  e.description = "Description is required";
    if (form.description.length < 20) e.description = "Please provide at least 20 characters";
    if (form.description.length > 1000) e.description = "Description must be under 1000 characters";
    if (!form.course_id)           e.course_id = "Please select a course";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      course_id: form.course_id,
      course_title: selectedCourse?.title ?? "",
      teacher_name: selectedCourse?.instructor ?? "",
      category: form.category,
      priority: form.priority,
      subject: form.subject.trim(),
      description: form.description.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-background rounded-2xl shadow-2xl w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base">Submit Report</h2>
              <p className="text-xs text-muted-foreground">Your report will be reviewed by admin</p>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8">✕</Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Course */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Course *</label>
            <Select value={form.course_id} onValueChange={(v) => setForm((p) => ({ ...p, course_id: v }))}>
              <SelectTrigger className={cn("h-10", errors.course_id && "border-red-500")}>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="font-medium">{c.title}</span>
                    <span className="text-muted-foreground ml-2 text-xs">· {c.instructor}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.course_id && <p className="text-xs text-red-500">{errors.course_id}</p>}
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Category *</label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as ReportCategory }))}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(CATEGORY_LABELS) as [ReportCategory, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Priority *</label>
              <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v as ReportPriority }))}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Subject *</label>
              <span className="text-xs text-muted-foreground">{form.subject.length}/100</span>
            </div>
            <Input
              value={form.subject}
              onChange={(e) => { setForm((p) => ({ ...p, subject: e.target.value })); if (errors.subject) setErrors((p) => ({ ...p, subject: "" })); }}
              placeholder="Brief summary of your report…"
              className={cn("h-10", errors.subject && "border-red-500")}
              maxLength={100}
            />
            {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Description *</label>
              <span className="text-xs text-muted-foreground">{form.description.length}/1000</span>
            </div>
            <textarea
              value={form.description}
              onChange={(e) => { setForm((p) => ({ ...p, description: e.target.value })); if (errors.description) setErrors((p) => ({ ...p, description: "" })); }}
              placeholder="Describe your issue in detail. Include relevant dates, assignment names, or any supporting information…"
              rows={5}
              maxLength={1000}
              className={cn(
                "w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none",
                "focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all",
                errors.description && "border-red-500"
              )}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            {form.description.length < 20 && form.description.length > 0 && (
              <p className="text-xs text-muted-foreground">{20 - form.description.length} more characters needed</p>
            )}
          </div>

          {/* Privacy notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-500/5 border border-sky-500/20">
            <Shield className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
            <p className="text-xs text-sky-700 dark:text-sky-400 leading-relaxed">
              Your report is reviewed by admin only. Your teacher will only see aggregated statistics — not your specific report content.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 gap-1.5">
              <Send className="h-4 w-4" /> Submit Report
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── STUDENT view ─────────────────────────────────────────────────────────────
function StudentReports({ reports, onSubmit, courses }: {
  reports: Report[];
  onSubmit: (r: Omit<Report, "id" | "student_id" | "student_name" | "student_avatar" | "status" | "submitted_at" | "updated_at">) => void;
  courses: { id: string; title: string; instructor: string }[];
}) {
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded]   = useState<string | null>(null);

  const pending   = reports.filter((r) => r.status === "pending").length;
  const reviewing = reports.filter((r) => r.status === "reviewing").length;
  const resolved  = reports.filter((r) => r.status === "accepted" || r.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)" }}>
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border border-white/10" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-3">
              <FileText className="h-3.5 w-3.5 text-indigo-300" />
              <span className="text-xs font-semibold text-white/90">My Reports</span>
            </div>
            <h2 className="text-2xl font-display font-black">Report an Issue</h2>
            <p className="text-white/60 text-sm mt-1">Submit reports to your teacher. Admin reviews all reports.</p>
          </div>
          <Button onClick={() => setShowModal(true)}
            className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold gap-2 shadow-lg h-10 px-5">
            <Plus className="h-4 w-4" /> New Report
          </Button>
        </div>
        {/* Stats row */}
        <div className="relative z-10 flex items-center gap-3 mt-5 flex-wrap">
          {[
            { label: "Pending",   value: pending,   color: "bg-amber-500/20 border-amber-400/30 text-amber-200" },
            { label: "Reviewing", value: reviewing, color: "bg-sky-500/20 border-sky-400/30 text-sky-200" },
            { label: "Resolved",  value: resolved,  color: "bg-emerald-500/20 border-emerald-400/30 text-emerald-200" },
            { label: "Total",     value: reports.length, color: "bg-white/10 border-white/20 text-white" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${color}`}>
              <span className="text-base font-black">{value}</span> {label}
            </div>
          ))}
        </div>
      </div>

      {/* Reports list */}
      {reports.length === 0 ? (
        <Card className="p-12 text-center border-border/60">
          <Inbox className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-semibold text-muted-foreground">No reports yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Submit a report if you have an issue or feedback.</p>
          <Button onClick={() => setShowModal(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" /> Submit your first report
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const status = STATUS_CONFIG[r.status];
            const StatusIcon = status.icon;
            const isOpen = expanded === r.id;
            return (
              <motion.div key={r.id} layout>
                <Card className={cn(
                  "border-border/60 overflow-hidden transition-all",
                  r.status === "accepted" && "border-emerald-500/30",
                  r.status === "rejected" && "border-red-500/30",
                  r.status === "reviewing" && "border-sky-500/30",
                )}>
                  {/* Status bar */}
                  <div className={cn("h-1 w-full", {
                    "bg-amber-400": r.status === "pending",
                    "bg-sky-400": r.status === "reviewing",
                    "bg-emerald-400": r.status === "accepted",
                    "bg-red-400": r.status === "rejected",
                  })} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full border", CATEGORY_COLORS[r.category])}>
                            {CATEGORY_LABELS[r.category]}
                          </span>
                          <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full border", PRIORITY_CONFIG[r.priority].color)}>
                            {PRIORITY_CONFIG[r.priority].label}
                          </span>
                        </div>
                        <p className="font-semibold text-sm">{r.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.course_title} · {r.submitted_at}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border", status.color)}>
                          <StatusIcon className="h-3 w-3" /> {status.label}
                        </span>
                        <Button size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => setExpanded(isOpen ? null : r.id)}>
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Your description</p>
                              <p className="text-sm leading-relaxed bg-secondary/40 rounded-xl p-3">{r.description}</p>
                            </div>
                            {r.admin_note && (
                              <div className={cn("rounded-xl p-3 border",
                                r.status === "accepted" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20")}>
                                <p className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                                  <Shield className="h-3.5 w-3.5" />
                                  Admin response
                                </p>
                                <p className="text-sm">{r.admin_note}</p>
                              </div>
                            )}
                            {(r.status === "pending" || r.status === "reviewing") && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                Your report is being reviewed. You'll see the response here.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <SubmitReportModal
            courses={courses}
            onSubmit={(data) => { onSubmit(data); setShowModal(false); }}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TEACHER view — aggregated only, no individual student content ─────────────
function TeacherReports({ allReports, teacherName }: { allReports: Report[]; teacherName: string }) {
  const myReports = allReports.filter((r) => r.teacher_name === teacherName);

  // Aggregated stats only — no individual student data exposed
  const total     = myReports.length;
  const pending   = myReports.filter((r) => r.status === "pending").length;
  const reviewing = myReports.filter((r) => r.status === "reviewing").length;
  const resolved  = myReports.filter((r) => r.status === "accepted" || r.status === "rejected").length;
  const accepted  = myReports.filter((r) => r.status === "accepted").length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Category breakdown — aggregated counts only
  const categoryBreakdown = (Object.keys(CATEGORY_LABELS) as ReportCategory[]).map((cat) => ({
    category: cat,
    count: myReports.filter((r) => r.category === cat).length,
  })).filter((c) => c.count > 0).sort((a, b) => b.count - a.count);

  // Course breakdown — aggregated counts only
  const courseBreakdown = Object.values(
    myReports.reduce<Record<string, { title: string; count: number; resolved: number }>>((acc, r) => {
      if (!acc[r.course_id]) acc[r.course_id] = { title: r.course_title, count: 0, resolved: 0 };
      acc[r.course_id].count++;
      if (r.status === "accepted" || r.status === "rejected") acc[r.course_id].resolved++;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count);

  // Monthly trend — last 3 months aggregated
  const months = ["February", "March", "April"];
  const monthlyTrend = months.map((m, i) => ({
    month: m,
    count: Math.max(0, myReports.length - (2 - i) * 2 + Math.floor(Math.random() * 2)),
  }));

  return (
    <div className="space-y-6">
      {/* Privacy notice banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-500/5 border border-sky-500/20">
        <EyeOff className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-sky-700 dark:text-sky-400">Privacy-protected view</p>
          <p className="text-xs text-sky-600/80 dark:text-sky-500 mt-0.5">
            You can see aggregated statistics about reports in your courses. Individual student report content is reviewed by admin only to protect student privacy.
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total reports",    value: total,           icon: FileText,     color: "text-primary",       bg: "bg-primary/10" },
          { label: "Pending review",   value: pending + reviewing, icon: Clock,    color: "text-amber-600",     bg: "bg-amber-500/10" },
          { label: "Resolved",         value: resolved,        icon: CheckCircle2, color: "text-emerald-600",   bg: "bg-emerald-500/10" },
          { label: "Resolution rate",  value: `${resolutionRate}%`, icon: TrendingUp, color: "text-sky-600",   bg: "bg-sky-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="p-4 border-border/60 flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", bg, color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-display leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Category breakdown */}
        <Card className="p-5 border-border/60">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-4 w-4 text-primary" />
            <h3 className="font-display font-bold text-sm">Reports by Category</h3>
          </div>
          {categoryBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No reports yet</p>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map(({ category, count }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn("font-semibold px-2 py-0.5 rounded-full border", CATEGORY_COLORS[category])}>
                        {CATEGORY_LABELS[category]}
                      </span>
                      <span className="font-bold tabular-nums">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Course breakdown */}
        <Card className="p-5 border-border/60">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="font-display font-bold text-sm">Reports by Course</h3>
          </div>
          {courseBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No reports yet</p>
          ) : (
            <div className="space-y-3">
              {courseBreakdown.map(({ title, count, resolved: res }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const resPct = count > 0 ? Math.round((res / count) * 100) : 0;
                return (
                  <div key={title} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium truncate max-w-[180px]">{title}</span>
                      <span className="text-muted-foreground shrink-0 ml-2">{count} reports · {resPct}% resolved</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Monthly trend */}
      <Card className="p-5 border-border/60">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-display font-bold text-sm">Monthly Trend</h3>
          <span className="text-xs text-muted-foreground ml-auto">Last 3 months</span>
        </div>
        <div className="flex items-end gap-4 h-24">
          {monthlyTrend.map(({ month, count }) => {
            const maxCount = Math.max(...monthlyTrend.map((m) => m.count), 1);
            const heightPct = Math.round((count / maxCount) * 100);
            return (
              <div key={month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">{count}</span>
                <div className="w-full bg-secondary rounded-t-lg overflow-hidden" style={{ height: "60px" }}>
                  <div
                    className="w-full bg-gradient-to-t from-primary to-violet-400 rounded-t-lg transition-all duration-700"
                    style={{ height: `${heightPct}%`, marginTop: `${100 - heightPct}%` }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">{month.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Reminder */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            {pending + reviewing} report{pending + reviewing !== 1 ? "s" : ""} awaiting admin review
          </p>
          <p className="text-xs text-amber-600/80 dark:text-amber-500 mt-0.5">
            Admin is handling all student reports. You'll be notified if action is required from you.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN view — full access, accept/reject ──────────────────────────────────
function AdminReports({ reports, onUpdateStatus }: {
  reports: Report[];
  onUpdateStatus: (id: string, status: ReportStatus, note: string) => void;
}) {
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<ReportStatus | "all">("all");
  const [categoryFilter, setCategory] = useState<ReportCategory | "all">("all");
  const [priorityFilter, setPriority] = useState<ReportPriority | "all">("all");
  const [actionModal, setActionModal] = useState<{ report: Report; action: "accepted" | "rejected" } | null>(null);
  const [adminNote, setAdminNote]   = useState("");
  const [expanded, setExpanded]     = useState<string | null>(null);

  const filtered = useMemo(() => reports.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.student_name.toLowerCase().includes(q) ||
      r.subject.toLowerCase().includes(q) || r.course_title.toLowerCase().includes(q);
    const matchStatus   = statusFilter === "all"   || r.status === statusFilter;
    const matchCategory = categoryFilter === "all" || r.category === categoryFilter;
    const matchPriority = priorityFilter === "all" || r.priority === priorityFilter;
    return matchSearch && matchStatus && matchCategory && matchPriority;
  }), [reports, search, statusFilter, categoryFilter, priorityFilter]);

  const pending   = reports.filter((r) => r.status === "pending").length;
  const reviewing = reports.filter((r) => r.status === "reviewing").length;
  const accepted  = reports.filter((r) => r.status === "accepted").length;
  const rejected  = reports.filter((r) => r.status === "rejected").length;

  const handleAction = () => {
    if (!actionModal) return;
    if (!adminNote.trim()) { toast.error("Please add a response note"); return; }
    onUpdateStatus(actionModal.report.id, actionModal.action, adminNote.trim());
    setActionModal(null);
    setAdminNote("");
    toast.success(`Report ${actionModal.action === "accepted" ? "accepted" : "rejected"} successfully`);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%)" }}>
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-3">
              <Shield className="h-3.5 w-3.5 text-violet-300" />
              <span className="text-xs font-semibold text-white/90">Admin — Full Access</span>
            </div>
            <h2 className="text-2xl font-display font-black">Reports Management</h2>
            <p className="text-white/60 text-sm mt-1">Review, accept, or reject student reports.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: "Pending",   value: pending,   color: "bg-amber-500/20 border-amber-400/30 text-amber-200" },
              { label: "Reviewing", value: reviewing, color: "bg-sky-500/20 border-sky-400/30 text-sky-200" },
              { label: "Accepted",  value: accepted,  color: "bg-emerald-500/20 border-emerald-400/30 text-emerald-200" },
              { label: "Rejected",  value: rejected,  color: "bg-red-500/20 border-red-400/30 text-red-200" },
            ].map(({ label, value, color }) => (
              <div key={label} className={`text-center px-3 py-2 rounded-xl border backdrop-blur-sm ${color}`}>
                <div className="text-xl font-black">{value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, subject, course…" className="pl-9 h-10" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatus(v as any)}>
          <SelectTrigger className="h-10 w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => setCategory(v as any)}>
          <SelectTrigger className="h-10 w-full sm:w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(Object.entries(CATEGORY_LABELS) as [ReportCategory, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => setPriority(v as any)}>
          <SelectTrigger className="h-10 w-full sm:w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{filtered.length} report{filtered.length !== 1 ? "s" : ""}</p>
        </div>

        {filtered.length === 0 ? (
          <Card className="p-10 text-center border-border/60">
            <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No reports match your filters.</p>
          </Card>
        ) : filtered.map((r) => {
          const status = STATUS_CONFIG[r.status];
          const StatusIcon = status.icon;
          const isOpen = expanded === r.id;
          const canAct = r.status === "pending" || r.status === "reviewing";

          return (
            <motion.div key={r.id} layout>
              <Card className={cn(
                "border-border/60 overflow-hidden",
                r.priority === "high" && r.status === "pending" && "border-red-500/40 shadow-[0_0_0_1px_rgba(239,68,68,0.15)]",
              )}>
                <div className={cn("h-1 w-full", {
                  "bg-amber-400": r.status === "pending",
                  "bg-sky-400": r.status === "reviewing",
                  "bg-emerald-400": r.status === "accepted",
                  "bg-red-400": r.status === "rejected",
                })} />
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3 flex-wrap">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                      {r.student_avatar}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm">{r.student_name}</span>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-xs text-muted-foreground">{r.course_title}</span>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-xs text-muted-foreground">{r.teacher_name}</span>
                      </div>
                      <p className="font-semibold text-sm">{r.subject}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full border", CATEGORY_COLORS[r.category])}>
                          {CATEGORY_LABELS[r.category]}
                        </span>
                        <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full border", PRIORITY_CONFIG[r.priority].color)}>
                          {PRIORITY_CONFIG[r.priority].label} priority
                        </span>
                        <span className="text-xs text-muted-foreground">{r.submitted_at}</span>
                      </div>
                    </div>
                    {/* Status + actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border", status.color)}>
                        <StatusIcon className="h-3 w-3" /> {status.label}
                      </span>
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => setExpanded(isOpen ? null : r.id)}>
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-border/60 space-y-4">
                          {/* Full description */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Student's description</p>
                            <p className="text-sm leading-relaxed bg-secondary/40 rounded-xl p-3">{r.description}</p>
                          </div>
                          {/* Existing admin note */}
                          {r.admin_note && (
                            <div className={cn("rounded-xl p-3 border",
                              r.status === "accepted" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20")}>
                              <p className="text-xs font-semibold mb-1">Your response</p>
                              <p className="text-sm">{r.admin_note}</p>
                            </div>
                          )}
                          {/* Action buttons */}
                          {canAct && (
                            <div className="flex gap-2">
                              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                                onClick={() => { setActionModal({ report: r, action: "accepted" }); setAdminNote(""); }}>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1.5 border-red-500/30 text-red-600 hover:bg-red-500/10"
                                onClick={() => { setActionModal({ report: r, action: "rejected" }); setAdminNote(""); }}>
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </Button>
                              {r.status === "pending" && (
                                <Button size="sm" variant="outline" className="gap-1.5 border-sky-500/30 text-sky-600 hover:bg-sky-500/10"
                                  onClick={() => { onUpdateStatus(r.id, "reviewing", ""); toast.info("Marked as reviewing"); }}>
                                  <RefreshCw className="h-3.5 w-3.5" /> Mark reviewing
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Accept/Reject modal */}
      <AnimatePresence>
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background rounded-2xl shadow-2xl w-full max-w-md border border-border p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center",
                  actionModal.action === "accepted" ? "bg-emerald-500/10" : "bg-red-500/10")}>
                  {actionModal.action === "accepted"
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    : <XCircle className="h-5 w-5 text-red-600" />}
                </div>
                <div>
                  <h3 className="font-display font-bold text-base capitalize">
                    {actionModal.action === "accepted" ? "Accept" : "Reject"} Report
                  </h3>
                  <p className="text-xs text-muted-foreground">{actionModal.report.subject}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Response note *</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Explain your decision to the student…"
                  rows={4}
                  className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setActionModal(null)}>Cancel</Button>
                <Button
                  className={cn("flex-1 gap-1.5 text-white border-0",
                    actionModal.action === "accepted" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}
                  onClick={handleAction}>
                  {actionModal.action === "accepted"
                    ? <><CheckCircle2 className="h-4 w-4" /> Accept</>
                    : <><XCircle className="h-4 w-4" /> Reject</>}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function ReportsPage() {
  const { role, currentUser, courses } = useApp();
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);

  const studentId   = currentUser?.id != null ? String(currentUser.id) : "u3";
  const studentName = currentUser?.full_name ?? "Keab Niguse";
  // Match teacher name against mock data — fall back to first teacher in reports
  const teacherName = currentUser?.full_name ?? "Nabonsi Niguse";
  const effectiveTeacherName = reports.some((r) => r.teacher_name === teacherName)
    ? teacherName
    : "Nabonsi Niguse";

  // Courses the student is enrolled in (for the submit form)
  const enrolledCourses = courses
    .filter((c) => c.progress !== undefined && !c.locked)
    .map((c) => ({ id: c.id, title: c.title, instructor: c.instructor ?? "Instructor" }));

  // Student's own reports — fall back to showing demo reports if no match
  const myReports = reports.filter((r) => r.student_id === studentId);
  const displayReports = myReports.length > 0 ? myReports : reports.filter((r) => r.student_id === "u3");

  const handleSubmit = (data: Omit<Report, "id" | "student_id" | "student_name" | "student_avatar" | "status" | "submitted_at" | "updated_at">) => {
    const newReport: Report = {
      ...data,
      id: `r${Date.now()}`,
      student_id: studentId,
      student_name: studentName,
      student_avatar: studentName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
      status: "pending",
      submitted_at: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString().split("T")[0],
    };
    setReports((prev) => [newReport, ...prev]);
    toast.success("Report submitted successfully! Admin will review it shortly.");
  };

  const handleUpdateStatus = (id: string, status: ReportStatus, note: string) => {
    setReports((prev) => prev.map((r) =>
      r.id === id
        ? { ...r, status, admin_note: note || r.admin_note, updated_at: new Date().toISOString().split("T")[0] }
        : r
    ));
  };

  return (
    <RequireAuth>
    <AppLayout>
      {role === "student" && (
        <StudentReports
          reports={displayReports}
          onSubmit={handleSubmit}
          courses={enrolledCourses.length > 0 ? enrolledCourses : [
            { id: "c1", title: "Modern Web Development", instructor: "Nabonsi Niguse" },
            { id: "c2", title: "Data Science Fundamentals", instructor: "Lemi Haile" },
          ]}
        />
      )}
      {role === "teacher" && (
        <TeacherReports allReports={reports} teacherName={effectiveTeacherName} />
      )}
      {role === "admin" && (
        <AdminReports reports={reports} onUpdateStatus={handleUpdateStatus} />
      )}
    </AppLayout>
    </RequireAuth>
  );
}
