/**
 * Admin Results — full control panel with grading system and approval tools.
 * Admins can view all data, manage grading rules, unlock results, and approve submissions.
 */

import { useState, useEffect } from "react";
import {
  Settings, Lock, Unlock, CheckCircle2, AlertCircle, Plus, Edit2, Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  getResults, approveResult, unlockResult, getResultAuditLog,
  getGradingScales, createGradingScale, updateGradingScale,
  type StudentResultDetail, type GradingScale, type AuditLogEntry,
} from "@/lib/api-results";
import { toast } from "sonner";

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  "A": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  "B+": "bg-sky-500/10 text-sky-700 border-sky-200",
  "B": "bg-sky-500/10 text-sky-700 border-sky-200",
  "C+": "bg-amber-500/10 text-amber-700 border-amber-200",
  "C": "bg-amber-500/10 text-amber-700 border-amber-200",
  "D": "bg-orange-500/10 text-orange-700 border-orange-200",
  "F": "bg-red-500/10 text-red-700 border-red-200",
};

export function AdminResults() {
  const [results, setResults] = useState<StudentResultDetail[]>([]);
  const [scales, setScales] = useState<GradingScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [selectedResult, setSelectedResult] = useState<StudentResultDetail | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showGradingDialog, setShowGradingDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [resultsData, scalesData] = await Promise.all([
        getResults(),
        getGradingScales(),
      ]);
      setResults(Array.isArray(resultsData) ? resultsData : resultsData.results || []);
      setScales(scalesData);
    } catch (error) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(resultId: number) {
    try {
      await approveResult(resultId);
      toast.success("Result approved");
      loadData();
    } catch (error) {
      toast.error("Failed to approve result");
      console.error(error);
    }
  }

  async function handleUnlock(resultId: number) {
    try {
      await unlockResult(resultId);
      toast.success("Result unlocked");
      loadData();
    } catch (error) {
      toast.error("Failed to unlock result");
      console.error(error);
    }
  }

  async function handleViewAuditLog(result: StudentResultDetail) {
    try {
      const logs = await getResultAuditLog(result.id);
      setAuditLogs(logs);
      setSelectedResult(result);
      setShowAuditLog(true);
    } catch (error) {
      toast.error("Failed to load audit log");
      console.error(error);
    }
  }

  const stats = {
    totalResults: results.length,
    draftCount: results.filter((r) => r.status === "draft").length,
    submittedCount: results.filter((r) => r.status === "submitted").length,
    approvedCount: results.filter((r) => r.status === "approved").length,
    activeScale: scales.find((s) => s.is_active),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Results Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage grading rules, approve results, and maintain data integrity
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Results</p>
          <p className="text-2xl font-bold mt-1">{stats.totalResults}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Draft</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {stats.draftCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Submitted</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {stats.submittedCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Approved</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {stats.approvedCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Active Scale</p>
          <p className="text-lg font-bold mt-1 truncate">
            {stats.activeScale?.name || "None"}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="results" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="grading">Grading Scales</TabsTrigger>
        </TabsList>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <Card className="border-border/60 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading results...
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No results found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 bg-muted/30">
                      <TableHead className="font-semibold">Student</TableHead>
                      <TableHead className="font-semibold">Course</TableHead>
                      <TableHead className="text-center font-semibold">Score</TableHead>
                      <TableHead className="text-center font-semibold">Grade</TableHead>
                      <TableHead className="text-center font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.id} className="border-border/60 hover:bg-muted/30">
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">
                              {result.student_detail.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {result.student_detail.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{result.course_title}</TableCell>
                        <TableCell className="text-center font-semibold">
                          {result.raw_score !== null ? `${result.raw_score}%` : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {result.grade_letter ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-bold text-sm",
                                GRADE_COLORS[result.grade_letter] || ""
                              )}
                            >
                              {result.grade_letter}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-medium",
                              result.status === "draft"
                                ? "bg-amber-500/10 text-amber-700 border-amber-200"
                                : result.status === "submitted"
                                  ? "bg-blue-500/10 text-blue-700 border-blue-200"
                                  : result.status === "approved"
                                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                                    : "bg-purple-500/10 text-purple-700 border-purple-200"
                            )}
                          >
                            {result.status.charAt(0).toUpperCase() +
                              result.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {result.status === "submitted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(result.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          {result.status !== "draft" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnlock(result.id)}
                            >
                              <Unlock className="h-4 w-4 mr-1" />
                              Unlock
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewAuditLog(result)}
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Grading Scales Tab */}
        <TabsContent value="grading" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Grading Scales</h3>
            <Button onClick={() => setShowGradingDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Scale
            </Button>
          </div>

          <div className="grid gap-4">
            {scales.map((scale) => (
              <Card key={scale.id} className="p-4 border-border/60">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold">{scale.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {scale.rules.length} rules
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {scale.is_active && (
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
                        Active
                      </Badge>
                    )}
                    <Button size="sm" variant="ghost">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {scale.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-bold">
                          {rule.letter}
                        </Badge>
                        <span className="text-muted-foreground">
                          {rule.min_score}–{rule.max_score}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">{rule.gpa_points} GPA</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            rule.pass_fail === "pass"
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                              : "bg-red-500/10 text-red-700 border-red-200"
                          )}
                        >
                          {rule.pass_fail}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Audit Log Dialog */}
      {showAuditLog && selectedResult && (
        <Dialog open={showAuditLog} onOpenChange={setShowAuditLog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Audit Log — {selectedResult.student_detail.full_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No audit logs</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-muted/30 rounded text-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.performed_by_detail.full_name} ({log.performed_by_role})
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {log.note && (
                      <p className="text-xs text-muted-foreground mb-2">{log.note}</p>
                    )}
                    {log.old_value && (
                      <p className="text-xs">
                        <span className="text-muted-foreground">Before:</span>{" "}
                        {JSON.stringify(log.old_value)}
                      </p>
                    )}
                    {log.new_value && (
                      <p className="text-xs">
                        <span className="text-muted-foreground">After:</span>{" "}
                        {JSON.stringify(log.new_value)}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
