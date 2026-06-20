/**
 * GradeCalculator — inline score estimator for students.
 *
 * Lives directly on the student dashboard beside "My courses".
 * No modal, no navigation. Inputs update the result instantly.
 *
 * Weights:
 *   Assignments  40%
 *   Quizzes      30%
 *   Attendance   20%
 *   Participation 10%
 */
import { useState, useMemo } from "react";
import { Calculator, RotateCcw, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAttendance } from "@/context/attendance-context";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Weights — must sum to 100
// ---------------------------------------------------------------------------
const WEIGHTS = [
  { key: "assignments",   label: "Assignments",   weight: 40, placeholder: "e.g. 85" },
  { key: "quizzes",       label: "Quizzes",       weight: 30, placeholder: "e.g. 78" },
  { key: "attendance",    label: "Attendance",    weight: 20, placeholder: "auto-filled" },
  { key: "participation", label: "Participation", weight: 10, placeholder: "e.g. 90" },
] as const;

type ScoreKey = typeof WEIGHTS[number]["key"];

// ---------------------------------------------------------------------------
// Grade label from numeric score
// ---------------------------------------------------------------------------
function gradeLabel(score: number): { letter: string; color: string; bg: string } {
  if (score >= 90) return { letter: "A",  color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20" };
  if (score >= 80) return { letter: "B",  color: "text-sky-600",     bg: "bg-sky-500/10 border-sky-500/20" };
  if (score >= 70) return { letter: "C",  color: "text-amber-600",   bg: "bg-amber-500/10 border-amber-500/20" };
  if (score >= 60) return { letter: "D",  color: "text-orange-600",  bg: "bg-orange-500/10 border-orange-500/20" };
  return              { letter: "F",  color: "text-red-600",     bg: "bg-red-500/10 border-red-500/20" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function GradeCalculator() {
  const { records } = useAttendance();

  // Derive real attendance score for student "u3" (mock student)
  const realAttendanceScore = useMemo(() => {
    const mine   = records.filter((r) => r.student_id === "u3");
    const total  = mine.length;
    if (total === 0) return null;
    const present = mine.filter((r) => r.status === "present" || r.status === "late").length;
    return Math.round((present / total) * 100);
  }, [records]);

  const [scores, setScores] = useState<Record<ScoreKey, string>>({
    assignments:   "",
    quizzes:       "",
    attendance:    realAttendanceScore !== null ? String(realAttendanceScore) : "",
    participation: "",
  });

  // Sync attendance field when real data loads
  const [prevReal, setPrevReal] = useState(realAttendanceScore);
  if (prevReal !== realAttendanceScore && realAttendanceScore !== null) {
    setPrevReal(realAttendanceScore);
    setScores((s) => ({ ...s, attendance: String(realAttendanceScore) }));
  }

  const setScore = (key: ScoreKey, raw: string) => {
    // Allow only 0–100
    const n = raw.replace(/[^0-9.]/g, "");
    if (n === "" || (parseFloat(n) >= 0 && parseFloat(n) <= 100)) {
      setScores((s) => ({ ...s, [key]: n }));
    }
  };

  const reset = () =>
    setScores({
      assignments:   "",
      quizzes:       "",
      attendance:    realAttendanceScore !== null ? String(realAttendanceScore) : "",
      participation: "",
    });

  // Calculate weighted score — only include fields that have a value
  const { finalScore, filledCount } = useMemo(() => {
    let weightedSum  = 0;
    let totalWeight  = 0;
    let filled       = 0;

    WEIGHTS.forEach(({ key, weight }) => {
      const val = parseFloat(scores[key]);
      if (!isNaN(val) && scores[key] !== "") {
        weightedSum += val * weight;
        totalWeight += weight;
        filled++;
      }
    });

    if (totalWeight === 0) return { finalScore: null, filledCount: 0 };
    // Scale to 100 based on filled weights only
    return {
      finalScore: Math.round((weightedSum / totalWeight) * 10) / 10,
      filledCount: filled,
    };
  }, [scores]);

  const grade = finalScore !== null ? gradeLabel(finalScore) : null;
  const allFilled = filledCount === WEIGHTS.length;

  return (
    <Card className="p-6 border-border shadow-soft flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shadow-soft">
            <Calculator className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-base leading-none">Grade Estimator</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Enter scores to estimate your grade</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={reset}
          title="Reset"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Score inputs */}
      <div className="space-y-3 flex-1">
        {WEIGHTS.map(({ key, label, weight, placeholder }) => {
          const isAuto = key === "attendance" && realAttendanceScore !== null;
          return (
            <div key={key} className="grid grid-cols-[1fr_80px_52px] items-center gap-3">
              <div className="min-w-0">
                <Label className="text-xs font-medium text-foreground/80">{label}</Label>
                <p className="text-[10px] text-muted-foreground">{weight}% weight</p>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={scores[key]}
                  onChange={(e) => setScore(key, e.target.value)}
                  placeholder={isAuto ? String(realAttendanceScore) : placeholder}
                  className={cn(
                    "h-8 text-sm text-right pr-7 tabular-nums",
                    isAuto && "bg-primary-soft/40 border-primary/20"
                  )}
                  readOnly={isAuto}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  /100
                </span>
              </div>
              {/* Contribution preview */}
              <div className="text-right">
                {scores[key] !== "" && !isNaN(parseFloat(scores[key])) ? (
                  <span className="text-xs font-medium tabular-nums text-foreground/70">
                    {Math.round(parseFloat(scores[key]) * weight / 100)}
                    <span className="text-muted-foreground font-normal">pts</span>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Separator className="my-4" />

      {/* Result */}
      {finalScore !== null ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              Estimated grade
              {!allFilled && (
                <span className="ml-1 text-amber-500">
                  ({filledCount}/{WEIGHTS.length} fields)
                </span>
              )}
            </p>
            <p className="text-3xl font-bold font-display tabular-nums">
              {finalScore}
              <span className="text-base font-normal text-muted-foreground ml-0.5">/ 100</span>
            </p>
          </div>
          <div className={cn(
            "flex items-center justify-center h-14 w-14 rounded-xl border-2 text-2xl font-bold font-display",
            grade?.bg, grade?.color
          )}>
            {grade?.letter}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Info className="h-4 w-4 shrink-0" />
          <p className="text-xs">
            {realAttendanceScore !== null
              ? "Attendance auto-filled. Enter assignment and quiz scores."
              : "Enter at least one score to see your estimate."}
          </p>
        </div>
      )}

      {/* Weight legend */}
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
        {WEIGHTS.map(({ key, label, weight }) => (
          <span key={key} className="text-[10px] text-muted-foreground">
            {label} <span className="font-medium text-foreground/60">{weight}%</span>
          </span>
        ))}
      </div>
    </Card>
  );
}
