import { useState, useMemo } from "react";
import {
  CheckCircle2, Unlock, AlertCircle, Search, Plus, Edit2, Clock,
  Shield, ChevronDown, ChevronUp, X, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useResults, useGradingScales, useApproveResult, useUnlockResult,
  useCreateGradingScale, useUpdateGradingScale,
} from "@/lib/use-api";
import { getResultAuditLog, type AdminResult, type AuditLogEntry, type GradingScale, type GradingRule } from "@/lib/api-results";
import { toast } from "sonner";

const STATUS_STYLE: Record<string, string> = {
  draft:     "bg-amber-500/10 text-amber-700 border-amber-200",
  submitted: "bg-blue-500/10 text-blue-700 border-blue-200",
  approved:  "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  unlocked:  "bg-purple-500/10 text-purple-700 border-purple-200",
};

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

const SEMESTER_LABEL: Record<string, string> = {
  semester_1: "Semester 1",
  semester_2: "Semester 2",
  summer:     "Summer",
};

// ─── Grading Scale Form ───────────────────────────────────────────────────
const EMPTY_RULE = () => ({ letter: "", min_score: 0, max_score: 100, gpa_points: 0, pass_fail: "pass" as const });

function ScaleFormDialog({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: GradingScale;
}) {
  const createMutation = useCreateGradingScale();
  const updateMutation = useUpdateGradingScale();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [name, setName]         = useState(initial?.name ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? false);
  const [rules, setRules]       = useState<Omit<GradingRule, "id">[]>(
    initial?.rules?.map(r => ({ letter: r.letter, min_score: r.min_score, max_score: r.max_score, gpa_points: r.gpa_points, pass_fail: r.pass_fail }))
    ?? [EMPTY_RULE()]
  );

  function updateRule(i: number, field: string, value: string | number) {
    setRules(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Name required"); return; }
    if (rules.some(r => !r.letter.trim())) { toast.error("All rules need a letter grade"); return; }
    const payload = { name: name.trim(), is_active: isActive, rules };
    try {
      if (initial) {
        await updateMutation.mutateAsync({ id: initial.id, data: payload });
        toast.success("Scale updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Scale created");
      }
      onClose();
    } catch (e: any) { toast.error(e?.message ?? "Failed to save"); }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{initial ? "Edit Grading Scale" : "New Grading Scale"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Standard 2025" className="h-9 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4" />
            <Label htmlFor="is_active" className="text-xs cursor-pointer">Set as active scale</Label>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Grading Rules</Label>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setRules(p => [...p, EMPTY_RULE()])}>
                <Plus className="h-3 w-3" /> Add Rule
              </Button>
            </div>
            <div className="space-y-2">
              {rules.map((rule, i) => (
                <div key={i} className="grid grid-cols-[60px_1fr_1fr_1fr_80px_28px] gap-1.5 items-center">
                  <Input value={rule.letter} onChange={e => updateRule(i, "letter", e.target.value)} placeholder="A+" className="h-8 text-xs text-center" />
                  <Input type="number" value={rule.min_score} onChange={e => updateRule(i, "min_score", parseFloat(e.target.value))} placeholder="Min" className="h-8 text-xs" />
                  <Input type="number" value={rule.max_score} onChange={e => updateRule(i, "max_score", parseFloat(e.target.value))} placeholder="Max" className="h-8 text-xs" />
                  <Input type="number" step="0.1" value={rule.gpa_points} onChange={e => updateRule(i, "gpa_points", parseFloat(e.target.value))} placeholder="GPA" className="h-8 text-xs" />
                  <Select value={rule.pass_fail} onValueChange={v => updateRule(i, "pass_fail", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass">Pass</SelectItem>
                      <SelectItem value="fail">Fail</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => setRules(p => p.filter((_, idx) => idx !== i))}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">Letter · Min% · Max% · GPA · Pass/Fail</p>
          </div>
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={isPending} className="gap-1">
            <Save className="h-3 w-3" />
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Admin Component ─────────────────────────────────────────────────
export function AdminResultsStrict() {
  const [year, setYear]               = useState("all");
  const [semester, setSemester]       = useState("all");
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded]       = useState<Set<number>>(new Set());
  const [auditResult, setAuditResult] = useState<AdminResult | null>(null);
  const [auditLogs, setAuditLogs]     = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [scaleDialog, setScaleDialog] = useState<{ open: boolean; scale?: GradingScale }>({ open: false });

  const params = {
    ...(year !== "all"     ? { year: parseInt(year) } : {}),
    ...(semester !== "all" ? { semester }             : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  };

  const { data: raw, isLoading, error } = useResults(params);
  const results: AdminResult[] = Array.isArray(raw) ? raw : (raw as any)?.results ?? [];
  const { data: scalesRaw } = useGradingScales();
  const scales: GradingScale[] = Array.isArray(scalesRaw) ? scalesRaw : (scalesRaw as any)?.results ?? [];

  const approveMutation = useApproveResult();
  const unlockMutation  = useUnlockResult();

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  async function approve(id: number) {
    try {
      await approveMutation.mutateAsync(id);
      toast.success("Approved");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  }

  async function unlock(id: number) {
    try {
      await unlockMutation.mutateAsync(id);
      toast.success("Unlocked for correction");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  }

  async function openAudit(result: AdminResult) {
    setAuditResult(result);
    setAuditLoading(true);
    try {
      const logs = await getResultAuditLog(result.id);
      setAuditLogs(Array.isArray(logs) ? logs : (logs as any)?.results ?? []);
    } catch { setAuditLogs([]); }
    finally { setAuditLoading(false); }
  }

  function toggleExpand(id: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() =>
    results.filter(r => {
      const q = search.toLowerCase();
      return (
        r.student_detail.full_name.toLowerCase().includes(q) ||
        r.course_title.toLowerCase().includes(q) ||
        r.course_teacher.toLowerCase().includes(q)
      );
    }), [results, search]);

  const stats = {
    total:     results.length,
    draft:     results.filter(r => r.status === "draft").length,
    submitted: results.filter(r => r.status === "submitted").length,
    approved:  results.filter(r => r.status === "approved").length,
  };

  if (isLoading) return (
    <div className="space-y-4 max-w-4xl mx-auto">
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
          <div key={i} className="rounded-xl border bg-card overflow-hidden">
            <div className="p-3 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
            <div className="border-t px-3 py-2.5 bg-muted/30">
              <Skeleton className="h-3 w-full" />
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
    <div className="space-y-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Results Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Approve, unlock, and manage all student results</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Total",     value: stats.total,     color: "text-blue-600" },
          { label: "Draft",     value: stats.draft,     color: "text-amber-600" },
          { label: "Submitted", value: stats.submitted, color: "text-sky-600" },
          { label: "Approved",  value: stats.approved,  color: "text-emerald-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card p-3">
            <p className={cn("text-xl font-bold", color)}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="results">
        <TabsList className="h-8 text-xs">
          <TabsTrigger value="results" className="text-xs px-3">Results</TabsTrigger>
          <TabsTrigger value="grading" className="text-xs px-3">Grading Scales</TabsTrigger>
        </TabsList>

        {/* ── Results Tab ── */}
        <TabsContent value="results" className="space-y-3 mt-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search student, course, or teacher…"
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-full sm:w-36 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="unlocked">Unlocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No results found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(result => {
                const isExpanded = expanded.has(result.id);
                return (
                  <div key={result.id} className="rounded-xl border bg-card overflow-hidden">
                    <div className="p-3 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{result.student_detail.full_name}</p>
                          <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5 shrink-0", STATUS_STYLE[result.status])}>
                            {result.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{result.course_title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {result.course_teacher} · {result.year} {SEMESTER_LABEL[result.semester] ?? result.semester}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold">
                          {result.raw_score !== null ? `${result.raw_score}%` : "—"}
                        </span>
                        {result.grade_letter && (
                          <Badge variant="outline" className={cn("text-xs font-bold", GRADE_COLOR[result.grade_letter] ?? "")}>
                            {result.grade_letter}
                          </Badge>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleExpand(result.id)}>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t px-3 py-2.5 bg-muted/30 space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">GPA</p>
                            <p className="font-medium">{result.gpa !== null ? result.gpa.toFixed(1) : "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pass/Fail</p>
                            <p className={cn("font-medium capitalize", result.pass_fail === "pass" ? "text-emerald-600" : result.pass_fail === "fail" ? "text-red-600" : "")}>
                              {result.pass_fail ?? "—"}
                            </p>
                          </div>
                          {result.submitted_at && (
                            <div>
                              <p className="text-muted-foreground">Submitted</p>
                              <p className="font-medium">{new Date(result.submitted_at).toLocaleDateString()}</p>
                            </div>
                          )}
                          {result.approved_at && (
                            <div>
                              <p className="text-muted-foreground">Approved</p>
                              <p className="font-medium">{new Date(result.approved_at).toLocaleDateString()}</p>
                            </div>
                          )}
                          {result.unlocked_at && (
                            <div>
                              <p className="text-muted-foreground">Unlocked</p>
                              <p className="font-medium">{new Date(result.unlocked_at).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {result.status === "submitted" && (
                            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => approve(result.id)} disabled={approveMutation.isPending}>
                              <CheckCircle2 className="h-3 w-3" /> Approve
                            </Button>
                          )}
                          {(result.status === "submitted" || result.status === "approved") && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => unlock(result.id)} disabled={unlockMutation.isPending}>
                              <Unlock className="h-3 w-3" /> Unlock
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => openAudit(result)}>
                            <Shield className="h-3 w-3" /> Audit Log
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Grading Scales Tab ── */}
        <TabsContent value="grading" className="space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Grading Scales</p>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setScaleDialog({ open: true })}>
              <Plus className="h-3 w-3" /> New Scale
            </Button>
          </div>
          {scales.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No grading scales found</div>
          ) : (
            <div className="space-y-3">
              {scales.map((scale) => (
                <div key={scale.id} className="rounded-xl border bg-card p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-sm">{scale.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {scale.rules?.length ?? 0} rules · by {scale.created_by?.full_name ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {scale.is_active && (
                        <Badge className="text-[10px] h-4 px-1.5 bg-emerald-500/10 text-emerald-700 border border-emerald-200">
                          Active
                        </Badge>
                      )}
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => setScaleDialog({ open: true, scale })}
                        title="Edit scale"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(scale.rules ?? []).map((rule) => (
                      <div key={rule.id} className="rounded-lg bg-muted/40 p-2 text-center">
                        <Badge variant="outline" className="text-xs font-bold mb-1">{rule.letter}</Badge>
                        <p className="text-[10px] text-muted-foreground">{rule.min_score}–{rule.max_score}%</p>
                        <p className="text-[10px] font-medium">{rule.gpa_points} GPA</p>
                        <p className={cn("text-[10px] font-medium", rule.pass_fail === "pass" ? "text-emerald-600" : "text-red-600")}>
                          {rule.pass_fail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Audit Log Dialog */}
      <Dialog open={!!auditResult} onOpenChange={() => setAuditResult(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Audit Log — {auditResult?.student_detail.full_name}
            </DialogTitle>
          </DialogHeader>
          {auditLoading ? (
            <div className="py-8 text-center">
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No audit logs</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {auditLogs.map(log => (
                <div key={log.id} className="rounded-lg bg-muted/40 p-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold capitalize">{log.action.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-muted-foreground">{log.performed_by_detail?.full_name} · {log.performed_by_role}</p>
                  {log.note && <p className="mt-1 text-muted-foreground italic">{log.note}</p>}
                  {(log.old_value || log.new_value) && (
                    <div className="mt-1.5 grid grid-cols-2 gap-1">
                      {log.old_value && (
                        <div className="rounded bg-red-50 border border-red-100 p-1.5">
                          <p className="text-[10px] text-red-500 font-medium mb-0.5">Before</p>
                          <p className="text-[10px] font-mono break-all">{JSON.stringify(log.old_value)}</p>
                        </div>
                      )}
                      {log.new_value && (
                        <div className="rounded bg-emerald-50 border border-emerald-100 p-1.5">
                          <p className="text-[10px] text-emerald-600 font-medium mb-0.5">After</p>
                          <p className="text-[10px] font-mono break-all">{JSON.stringify(log.new_value)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Grading Scale Create/Edit Dialog */}
      <ScaleFormDialog
        open={scaleDialog.open}
        onClose={() => setScaleDialog({ open: false })}
        initial={scaleDialog.scale}
      />
    </div>
  );
}
