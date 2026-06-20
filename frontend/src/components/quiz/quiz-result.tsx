import { CheckCircle2, XCircle, Clock, Trophy, RotateCcw, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Quiz, QuizAttempt } from "@/lib/mock-data";

interface QuizResultProps {
  quiz: Quiz;
  attempt: QuizAttempt;
  onRetake?: () => void;
  onBack: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function QuizResult({ quiz, attempt, onRetake, onBack }: QuizResultProps) {
  const pct = attempt.score;

  const grade =
    pct >= 90 ? { label: "Excellent", color: "text-emerald-600", bg: "from-emerald-400 to-teal-500" } :
    pct >= 75 ? { label: "Good",      color: "text-sky-600",     bg: "from-sky-400 to-indigo-500" } :
    pct >= 60 ? { label: "Fair",      color: "text-amber-600",   bg: "from-amber-400 to-orange-500" } :
                { label: "Needs work",color: "text-red-600",     bg: "from-red-400 to-rose-500" };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ── Score card ── */}
      <Card className="border-border shadow-soft overflow-hidden">
        <div className={cn("bg-gradient-to-br p-8 text-white text-center", grade.bg)}>
          <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <div className="text-5xl font-display font-extrabold">{pct}%</div>
          <div className="text-white/90 text-lg font-medium mt-1">{grade.label}</div>
          <div className="mt-3 flex items-center justify-center gap-2">
            {attempt.passed ? (
              <Badge className="bg-white/20 text-white border-white/30 gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Passed
              </Badge>
            ) : (
              <Badge className="bg-white/20 text-white border-white/30 gap-1">
                <XCircle className="h-3.5 w-3.5" /> Not passed
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
          {[
            { label: "Correct",   value: `${attempt.correct_count}/${attempt.total_questions}` },
            { label: "Time taken",value: formatTime(attempt.time_taken_seconds) },
            { label: "Pass mark", value: `${quiz.passing_score}%` },
          ].map((s) => (
            <div key={s.label} className="p-4 text-center">
              <div className="text-xl font-bold font-display">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Answer review ── */}
      <div className="space-y-3">
        <h3 className="font-semibold text-base">Answer review</h3>
        {quiz.questions.map((q, i) => {
          const chosen  = attempt.answers[q.id];
          const correct = q.correct_option_id;
          const isRight = chosen === correct;

          return (
            <Card key={q.id} className={cn(
              "border shadow-soft overflow-hidden",
              isRight ? "border-emerald-500/30" : "border-red-500/30"
            )}>
              {/* Question header */}
              <div className={cn(
                "flex items-start gap-3 px-5 py-3.5 border-b",
                isRight ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
              )}>
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  isRight ? "bg-emerald-500" : "bg-red-500"
                )}>
                  {isRight
                    ? <CheckCircle2 className="h-4 w-4 text-white" />
                    : <XCircle className="h-4 w-4 text-white" />
                  }
                </div>
                <div className="flex-1">
                  <span className="text-xs text-muted-foreground">Q{i + 1}</span>
                  <p className="text-sm font-medium mt-0.5">{q.text}</p>
                </div>
              </div>

              {/* Options */}
              <div className="px-5 py-3 space-y-2">
                {q.options.map((opt, oi) => {
                  const isChosen  = opt.id === chosen;
                  const isCorrect = opt.id === correct;
                  return (
                    <div
                      key={opt.id}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
                        isCorrect ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
                        isChosen  ? "bg-red-500/10 text-red-700 dark:text-red-400" :
                                    "text-muted-foreground"
                      )}
                    >
                      <span className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0",
                        isCorrect ? "border-emerald-500 bg-emerald-500 text-white" :
                        isChosen  ? "border-red-500 bg-red-500 text-white" :
                                    "border-border"
                      )}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className={cn(isCorrect || isChosen ? "font-medium" : "")}>{opt.text}</span>
                      {isCorrect && <span className="ml-auto text-xs text-emerald-600 font-medium">Correct</span>}
                      {isChosen && !isCorrect && <span className="ml-auto text-xs text-red-600 font-medium">Your answer</span>}
                    </div>
                  );
                })}

                {/* Explanation */}
                {q.explanation && (
                  <div className="mt-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Explanation: </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 pb-4">
        <Button variant="outline" className="gap-1.5" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back to quizzes
        </Button>
        {onRetake && (
          <Button className="gradient-primary text-white border-0 shadow-glow gap-1.5" onClick={onRetake}>
            <RotateCcw className="h-4 w-4" /> Retake quiz
          </Button>
        )}
      </div>
    </div>
  );
}
