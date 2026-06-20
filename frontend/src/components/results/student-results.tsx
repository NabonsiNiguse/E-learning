/**
 * Student Results — clean, read-only results dashboard.
 * Shows course, score, grade, GPA, and pass/fail status.
 * Supports filtering by year and semester.
 */

import { useState, useEffect } from "react";
import {
  BarChart3, Filter, Download, AlertCircle, CheckCircle2, XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getResults, type StudentResultDetail } from "@/lib/api-results";
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

const PASS_FAIL_COLORS = {
  pass: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  fail: "bg-red-500/10 text-red-700 border-red-200",
};

export function StudentResults() {
  const [results, setResults] = useState<StudentResultDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<string>("");
  const [semester, setSemester] = useState<string>("");

  useEffect(() => {
    loadResults();
  }, [year, semester]);

  async function loadResults() {
    try {
      setLoading(true);
      const params: any = {};
      if (year) params.year = parseInt(year);
      if (semester) params.semester = semester;

      const data = await getResults(params);
      setResults(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error("Failed to load results");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const stats = {
    totalCourses: results.length,
    averageGPA: results.length > 0
      ? (results.reduce((sum, r) => sum + (r.gpa || 0), 0) / results.length).toFixed(2)
      : "0.00",
    passedCourses: results.filter((r) => r.pass_fail === "pass").length,
    failedCourses: results.filter((r) => r.pass_fail === "fail").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Results</h1>
          <p className="text-muted-foreground mt-1">
            View your grades and academic performance
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Courses</p>
          <p className="text-2xl font-bold mt-1">{stats.totalCourses}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Average GPA</p>
          <p className="text-2xl font-bold mt-1">{stats.averageGPA}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Passed</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {stats.passedCourses}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Failed</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {stats.failedCourses}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-border/60">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter Results</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Year</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Semester</label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger>
                <SelectValue placeholder="All semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All semesters</SelectItem>
                <SelectItem value="semester_1">Semester 1</SelectItem>
                <SelectItem value="semester_2">Semester 2</SelectItem>
                <SelectItem value="summer">Summer</SelectItem>
              </SelectContent>
            </Select>
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
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No results found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 bg-muted/30">
                  <TableHead className="font-semibold">Course</TableHead>
                  <TableHead className="text-right font-semibold">Score</TableHead>
                  <TableHead className="text-center font-semibold">Grade</TableHead>
                  <TableHead className="text-center font-semibold">GPA</TableHead>
                  <TableHead className="text-center font-semibold">Status</TableHead>
                  <TableHead className="text-center font-semibold">Period</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id} className="border-border/60 hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{result.course_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.course_teacher}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
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
                    <TableCell className="text-center font-semibold">
                      {result.gpa !== null ? result.gpa.toFixed(1) : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {result.pass_fail === "pass" ? (
                        <div className="flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs font-medium text-emerald-600">Pass</span>
                        </div>
                      ) : result.pass_fail === "fail" ? (
                        <div className="flex items-center justify-center gap-1">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-xs font-medium text-red-600">Fail</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {result.year} {result.semester.replace("_", " ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
