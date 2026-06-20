/**
 * Teacher Results — editable score entry for assigned students.
 * Teachers can only edit raw scores, not grades or GPA.
 * Scores lock after submission.
 */

import { useState, useEffect } from "react";
import {
  Edit2, Save, X, Lock, Send, AlertCircle, CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getResults, updateResultScore, submitResult,
  type StudentResultDetail,
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

interface EditingState {
  resultId: number;
  value: string;
}

export function TeacherResults() {
  const [results, setResults] = useState<StudentResultDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [submitDialog, setSubmitDialog] = useState<{
    resultId: number;
    studentName: string;
  } | null>(null);

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    try {
      setLoading(true);
      const data = await getResults();
      setResults(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error("Failed to load results");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveScore(resultId: number) {
    if (!editing || editing.resultId !== resultId) return;

    const score = parseFloat(editing.value);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Score must be between 0 and 100");
      return;
    }

    try {
      await updateResultScore(resultId, score);
      toast.success("Score saved");
      setEditing(null);
      loadResults();
    } catch (error) {
      toast.error("Failed to save score");
      console.error(error);
    }
  }

  async function handleSubmitResult(resultId: number) {
    try {
      setSubmitting(resultId);
      await submitResult(resultId);
      toast.success("Result submitted and locked");
      setSubmitDialog(null);
      loadResults();
    } catch (error) {
      toast.error("Failed to submit result");
      console.error(error);
    } finally {
      setSubmitting(null);
    }
  }

  const stats = {
    totalStudents: results.length,
    draftCount: results.filter((r) => r.status === "draft").length,
    submittedCount: results.filter((r) => r.status === "submitted").length,
    approvedCount: results.filter((r) => r.status === "approved").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Score Entry</h1>
        <p className="text-muted-foreground mt-1">
          Enter and manage student scores. Grades are calculated automatically.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Students</p>
          <p className="text-2xl font-bold mt-1">{stats.totalStudents}</p>
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
      </div>

      {/* Info Banner */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Score Entry Only</p>
            <p className="text-sm text-blue-800 mt-1">
              You can only enter raw scores (0–100). Grades and GPA are calculated
              automatically from the official grading scale. After submission, scores
              are locked and cannot be edited.
            </p>
          </div>
        </div>
      </Card>

      {/* Results Table */}
      <Card className="border-border/60 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading results...
          </div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No results to manage</p>
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
                  <TableHead className="text-center font-semibold">GPA</TableHead>
                  <TableHead className="text-center font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id} className="border-border/60 hover:bg-muted/30">
                    <TableCell className="font-medium">
                      {result.student_detail.full_name}
                    </TableCell>
                    <TableCell>{result.course_title}</TableCell>
                    <TableCell className="text-center">
                      {editing?.resultId === result.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editing.value}
                            onChange={(e) =>
                              setEditing({ ...editing, value: e.target.value })
                            }
                            className="w-20 text-center"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveScore(result.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditing(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-semibold">
                            {result.raw_score !== null ? `${result.raw_score}%` : "—"}
                          </span>
                          {result.status === "draft" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setEditing({
                                  resultId: result.id,
                                  value: result.raw_score?.toString() || "",
                                })
                              }
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          {result.status !== "draft" && (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      )}
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
                    <TableCell className="text-center font-semibold">
                      {result.gpa !== null ? result.gpa.toFixed(1) : "—"}
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
                              : "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                        )}
                      >
                        {result.status.charAt(0).toUpperCase() +
                          result.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {result.status === "draft" && result.raw_score !== null && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setSubmitDialog({
                              resultId: result.id,
                              studentName: result.student_detail.full_name,
                            })
                          }
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Submit
                        </Button>
                      )}
                      {result.status !== "draft" && (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs font-medium">Locked</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Submit Confirmation Dialog */}
      {submitDialog && (
        <Dialog open={!!submitDialog} onOpenChange={() => setSubmitDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Score</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are about to submit the score for{" "}
                <span className="font-semibold">{submitDialog.studentName}</span>.
                After submission, the score will be locked and cannot be edited
                without admin approval.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSubmitDialog(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSubmitResult(submitDialog.resultId)}
                disabled={submitting === submitDialog.resultId}
              >
                {submitting === submitDialog.resultId ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
