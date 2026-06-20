import { useState, useMemo } from "react";
import { BarChart3, CheckCircle2, XCircle, MessageCircle, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useResults, useCreateAppeal } from "@/lib/use-api";
import type { StudentResult } from "@/lib/api-results";
import { toast } from "sonner";

const GRADE_COLOR: Record<string, string> = {
  "A+": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  "A":  "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  "B+": "bg-sky-500/10 text-sky-700 border-sky-200",
  "B":  "bg-sky-500/10 text-sky-700 border-sky-200",
  "C+": "bg-amber-500/10 text-amber-700 border-amber-200",
  "C":  "bg-amber-500/10 text-amber-700 border-amber-200",
  "D":  "bg-orange-500/10 text-orange-700 border-orange-200",
  "F":  "bg-red-500/10 text-red-700 border-red-200",
};

export function StudentResultsStrict() {
  const [year, setYear]         = useState("all");
  const [semester, setSemester] = useState("all");
  const [search, setSearch]     = useState("");
  const [appeal, setAppeal]     = useState<{ id: number; course: string } | null>(null);
  const [reason, setReason]     = useState("");

  const params = {
    ...(year !== "all"     ? { year: parseInt(year) } : {}),
    ...(semester !== "all" ? { semester }             : {}),
  };

  const { data: raw, isLoading, error } = useResults(params);
  const results: StudentResult[] = Array.isArray(raw) ? raw : (raw as any)?.results ?? [];
  const createAppeal = useCreateAppeal();

  async function submitAppeal() {
    if (!appeal || !reason.trim()) { toast.error("Reason required"); return; }
    try {
      await createAppeal.mutateAsync({ result: appeal.id, reason: reason.trim() });
      toast.success("Appeal submitted");
      setAppeal(null);
      setReason("");
    } catch (e: any) { toast.error(e?.message ?? "Failed to submit appeal"); }
  }

  const filtered = useMemo(() =>
    results.filter(r =>
      r.course_title.toLowerCase().includes(search.toLowerCase()) ||
      r.course_teacher.toLowerCase().includes(search.toLowerCase())
    ), [results, search]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const stats = {
    total:  results.length,
    gpa:    results.length ? (results.reduce((s, r) => s + (r.gpa ?? 0), 0) / results.length).toFixed(2) : "—",
    passed: results.filter(r => r.pass_fail === "pass").length,
    failed: results.filter(r => r.pass_fail === "fail").length,
  };

  if (isLoading) return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-3">
            <Skeleton className="h-6 w-20 mb-2" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-7 w-7" />
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t">
              <Skeleton className="h-6 w-full" />
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
        {(error as any)?.message?.includes("Cannot connect") ? "Backend offline — start the Django server" : "Failed to load results"}
      </p>
    </div>
  );

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight">My Results</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your grades and academic performance</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Courses", value: stats.total,  color: "text-blue-600" },
          { label: "Avg GPA", value: stats.gpa,    color: "text-purple-600" },
          { label: "Passed",  value: stats.passed, color: "text-emerald-600" },
          { label: "Failed",  value: stats.failed, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card p-3">
            <p className={cn("text-xl font-bold", color)}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search courses…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="h-9 w-full sm:w-32 text-sm"><SelectValue placeholder="Year" /></SelectTrigger>
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

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">No results found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(result => (
            <div key={result.id} className="rounded-xl border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{result.course_title}</p>
                  <p className="text-xs text-muted-foreground truncate">{result.course_teacher}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{result.year} · {result.semester.replace("_", " ")}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-blue-600"
                  onClick={() => setAppeal({ id: result.id, course: result.course_title })} title="Appeal grade">
                  <MessageCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground">Score</p>
                  <p className="text-sm font-semibold">{result.raw_score !== null ? `${result.raw_score}%` : "—"}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground">Grade</p>
                  {result.grade_letter ? (
                    <Badge variant="outline" className={cn("text-xs font-bold mt-0.5", GRADE_COLOR[result.grade_letter] ?? "")}>{result.grade_letter}</Badge>
                  ) : <p className="text-sm text-muted-foreground">—</p>}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground">GPA</p>
                  <p className="text-sm font-semibold">{result.gpa !== null ? result.gpa.toFixed(1) : "—"}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground">Status</p>
                  {result.pass_fail === "pass" ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">Pass</span>
                    </div>
                  ) : result.pass_fail === "fail" ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <XCircle className="h-3.5 w-3.5 text-red-600" />
                      <span className="text-xs font-medium text-red-600">Fail</span>
                    </div>
                  ) : <p className="text-sm text-muted-foreground">—</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!appeal} onOpenChange={() => { setAppeal(null); setReason(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Grade Appeal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg bg-muted/50 p-2.5 text-sm">
              <p className="text-xs text-muted-foreground">Course</p>
              <p className="font-medium">{appeal?.course}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-xs">Reason *</Label>
              <Textarea id="reason" placeholder="Explain why this grade should be reconsidered…"
                value={reason} onChange={e => setReason(e.target.value)}
                className="min-h-[90px] resize-none text-sm" autoFocus />
            </div>
            <p className="text-[10px] text-muted-foreground">Your teacher will review and respond. Unresolved appeals escalate to admin.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setAppeal(null); setReason(""); }} disabled={createAppeal.isPending}>Cancel</Button>
            <Button size="sm" onClick={submitAppeal} disabled={createAppeal.isPending || !reason.trim()}>
              {createAppeal.isPending ? "Submitting…" : "Submit Appeal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
