import { useState, useMemo } from "react";
import { Edit2, Save, X, Send, AlertCircle, Search, CheckCircle2, Clock, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useResults, useUpdateScore, useSubmitResult } from "@/lib/use-api";
import type { TeacherResult } from "@/lib/api-results";
import { toast } from "sonner";

// Backend returns status for teacher view too — extend locally
interface TeacherResultWithStatus extends TeacherResult {
  status?: "draft" | "submitted" | "approved" | "unlocked";
}

const STATUS_STYLE: Record<string, string> = {
  draft:     "bg-amber-500/10 text-amber-700 border-amber-200",
  submitted: "bg-blue-500/10 text-blue-700 border-blue-200",
  approved:  "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  unlocked:  "bg-purple-500/10 text-purple-700 border-purple-200",
};

const SEMESTER_LABEL: Record<string, string> = {
  semester_1: "Semester 1",
  semester_2: "Semester 2",
  summer:     "Summer",
};

export function TeacherResultsStrict() {
  const [year, setYear]         = useState("all");
  const [semester, setSemester] = useState("all");
  const [search, setSearch]     = useState("");
  const [editing, setEditing]   = useState<{ id: number; value: string } | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const params = {
    ...(year !== "all"     ? { year: parseInt(year) } : {}),
    ...(semester !== "all" ? { semester }             : {}),
  };

  const { data: raw, isLoading, error } = useResults(params);
  const results: TeacherResultWithStatus[] = Array.isArray(raw) ? raw : (raw as any)?.results ?? [];
  const updateScore    = useUpdateScore();
  const submitMutation = useSubmitResult();

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  function isLocked(r: TeacherResultWithStatus) {
    return r.status === "submitted" || r.status === "approved";
  }

  async function saveScore(id: number) {
    if (!editing || editing.id !== id) return;
    const score = parseFloat(editing.value);
    if (isNaN(score) || score < 0 || score > 100) { toast.error("Score must be 0–100"); return; }
    try {
      await updateScore.mutateAsync({ id, score });
      toast.success("Score saved");
      setEditing(null);
    } catch (e: any) { toast.error(e?.message ?? "Failed to save"); }
  }

  async function doSubmit(id: number) {
    try {
      await submitMutation.mutateAsync(id);
      toast.success("Submitted & locked");
      setConfirmId(null);
    } catch (e: any) { toast.error(e?.message ?? "Failed to submit"); }
  }

  const filtered = useMemo(() =>
    results.filter(r =>
      r.student_name.toLowerCase().includes(search.toLowerCase()) ||
      r.course_title.toLowerCase().includes(search.toLowerCase())
    ), [results, search]);

  // Group by course for better readability
  const grouped = useMemo(() => {
    const map = new Map<string, TeacherResultWithStatus[]>();
    for (const r of filtered) {
      const key = r.course_title;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [filtered]);

  const stats = {
    total:     results.length,
    scored:    results.filter(r => r.raw_score !== null).length,
    pending:   results.filter(r => r.raw_score === null).length,
    submitted: results.filter(r => r.status === "submitted" || r.status === "approved").length,
  };

  const confirmResult = results.find(r => r.id === confirmId);

  if (isLoading) return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-3 flex items-center gap-2">
            <Skeleton className="h-6 w-6 mr-2" />
            <div className="min-w-0">
              <Skeleton className="h-5 w-28 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <AlertCircle className="h-10 w-10 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">
        {(error as any)?.message?.includes("Cannot connect")
          ? "Backend offline — start the Django server"
          : "Failed to load results"}
      </p>
    </div>
  );

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Score Entry</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Enter raw scores (0–100). Grades are computed automatically.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Students",  value: stats.total,     icon: Users,        color: "text-blue-600" },
          { label: "Scored",    value: stats.scored,    icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Pending",   value: stats.pending,   icon: Clock,        color: "text-amber-600" },
          { label: "Submitted", value: stats.submitted, icon: Lock,         color: "text-sky-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-3 flex items-center gap-2">
            <Icon className={cn("h-4 w-4 shrink-0", color)} />
            <div className="min-w-0">
              <p className="text-lg font-bold leading-none">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search student or course…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="h-9 w-full sm:w-28 text-sm"><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={semester} onValueChange={setSemester}>
          <SelectTrigger className="h-9 w-full sm:w-36 text-sm"><SelectValue placeholder="Semester" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            <SelectItem value="semester_1">Semester 1</SelectItem>
            <SelectItem value="semester_2">Semester 2</SelectItem>
            <SelectItem value="summer">Summer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500" />
        <span>You see scores only. Grades are calculated by the system and hidden from teachers.</span>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">No results found</div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([courseTitle, courseResults]) => (
            <div key={courseTitle}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                {courseTitle}
              </p>
              <div className="space-y-2">
                {courseResults.map(result => {
                  const locked = isLocked(result);
                  return (
                    <div
                      key={result.id}
                      className={cn(
                        "rounded-xl border bg-card p-3 flex flex-col sm:flex-row sm:items-center gap-3",
                        locked && "opacity-75"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{result.student_name}</p>
                          {result.status && (
                            <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5 shrink-0", STATUS_STYLE[result.status])}>
                              {result.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {result.year} · {SEMESTER_LABEL[result.semester] ?? result.semester}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {locked ? (
                          <>
                            <span className="text-sm font-semibold w-14 text-right">
                              {result.raw_score !== null ? `${result.raw_score}%` : "—"}
                            </span>
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" title="Locked — contact admin to edit" />
                          </>
                        ) : editing?.id === result.id ? (
                          <>
                            <Input
                              type="number" min={0} max={100}
                              value={editing.value}
                              onChange={e => setEditing({ id: result.id, value: e.target.value })}
                              className="w-20 h-8 text-center text-sm"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === "Enter")  saveScore(result.id);
                                if (e.key === "Escape") setEditing(null);
                              }}
                            />
                            <Button
                              size="icon" variant="ghost"
                              className="h-8 w-8 text-emerald-600"
                              onClick={() => saveScore(result.id)}
                              disabled={updateScore.isPending}
                            >
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setEditing(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className={cn("text-sm font-semibold w-14 text-right", result.raw_score === null ? "text-muted-foreground" : "")}>
                              {result.raw_score !== null ? `${result.raw_score}%` : "—"}
                            </span>
                            <Button
                              size="icon" variant="ghost" className="h-8 w-8"
                              onClick={() => setEditing({ id: result.id, value: result.raw_score?.toString() ?? "" })}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            {result.raw_score !== null && (
                              <Button
                                size="sm" variant="outline"
                                className="h-8 text-xs gap-1"
                                onClick={() => setConfirmId(result.id)}
                              >
                                <Send className="h-3 w-3" /> Submit
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={confirmId !== null} onOpenChange={() => setConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Submit Score?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Submit score for <span className="font-medium text-foreground">{confirmResult?.student_name}</span>?
            This will lock the record. Admin approval is required to edit after submission.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmId(null)}>Cancel</Button>
            <Button size="sm" onClick={() => confirmId && doSubmit(confirmId)} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
