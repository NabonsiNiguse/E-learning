import { useState, useEffect, useCallback, useRef } from "react";
import {
  Clock, ChevronLeft, ChevronRight, AlertTriangle,
  CheckCircle2, XCircle, Flag, AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Quiz, QuizAttempt } from "@/lib/mock-data";
import { useQuiz } from "@/context/quiz-context";
import { useApp } from "@/context/app-context";

interface QuizTakerProps {
  quiz: Quiz;
  onFinish: (attempt: QuizAttempt) => void;
  onCancel: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function QuizTaker({ quiz, onFinish, onCancel }: QuizTakerProps) {
  const { submitAttempt } = useQuiz();
  const { currentUser } = useApp();

  const totalSeconds   = quiz.time_limit_minutes * 60;
  const [timeLeft, setTimeLeft]       = useState(totalSeconds);
  const [current, setCurrent]         = useState(0);
  const [answers, setAnswers]         = useState<Record<string, string>>({});
  const [flagged, setFlagged]         = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted]     = useState(false);

  // Use a ref so handleSubmit always reads the latest answers/timeLeft
  const answersRef  = useRef(answers);
  const startTime   = useRef(Date.now());
  const submittedRef = useRef(false);

  useEffect(() => { answersRef.current = answers; }, [answers]);

  // ── Build and dispatch the attempt ──────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return; // prevent double-fire
    submittedRef.current = true;
    setSubmitted(true);

    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
    const latest    = answersRef.current;
    const correct   = quiz.questions.filter(
      (q) => latest[q.id] === q.correct_option_id
    ).length;
    const score = Math.round((correct / quiz.questions.length) * 100);

    const submission = await submitAttempt(Number(quiz.id), Object.entries(latest).map(([question_id, answer]) => ({ question_id, answer })) );
    // submission may be null on failure — build a local fallback
    const attempt = submission ?? {
      id: `att-${Date.now()}`,
      quiz_id: String(quiz.id),
      student_id: currentUser?.id?.toString() ?? "u3",
      student_name: currentUser?.full_name ?? "Student",
      answers: latest,
      score,
      correct_count: correct,
      total_questions: quiz.questions.length,
      time_taken_seconds: timeTaken,
      passed: score >= quiz.passing_score,
      submitted_at: new Date().toISOString(),
    };

    onFinish(attempt as QuizAttempt);
  }, [quiz, submitAttempt, currentUser, onFinish]);

  // ── Countdown timer — uses handleSubmit ref, no stale closure ───────────
  useEffect(() => {
    if (submitted) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, submitted, handleSubmit]);

  const q          = quiz.questions[current];
  const answered   = Object.keys(answers).length;
  const progress   = (answered / quiz.questions.length) * 100;
  const isLowTime  = timeLeft <= 60;
  const isCritical = timeLeft <= 30;
  const unanswered = quiz.questions.length - answered;

  const toggleFlag = () =>
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(q.id) ? next.delete(q.id) : next.add(q.id);
      return next;
    });

  // ── Instructions screen shown before starting (no changes needed here)
  // ── Question nav dots ────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* ── Top bar ── */}
      <Card className="border-border shadow-soft p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg truncate">{quiz.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{quiz.course_title}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Timer */}
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold transition-colors",
              isCritical ? "bg-destructive/10 text-destructive animate-pulse" :
              isLowTime  ? "bg-amber-500/10 text-amber-600" :
                           "bg-secondary text-foreground"
            )}>
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
              {isLowTime && (
                <span className="text-[10px] font-medium ml-1">
                  {isCritical ? "HURRY!" : "Low"}
                </span>
              )}
            </div>
            <Button
              variant="outline" size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={onCancel}
            >
              Exit
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{answered} of {quiz.questions.length} answered</span>
            <span className="flex items-center gap-1">
              {unanswered > 0 && (
                <span className="text-amber-600 font-medium">{unanswered} remaining</span>
              )}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </Card>

      {/* ── Question nav dots ── */}
      <div className="flex flex-wrap gap-1.5">
        {quiz.questions.map((question, i) => (
          <button
            key={question.id}
            onClick={() => setCurrent(i)}
            title={`Question ${i + 1}${flagged.has(question.id) ? " (flagged)" : ""}${answers[question.id] ? " (answered)" : ""}`}
            className={cn(
              "h-8 w-8 rounded-lg text-xs font-semibold transition-all duration-150 border",
              i === current
                ? "gradient-primary text-white border-transparent shadow-glow"
                : answers[question.id]
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-secondary text-muted-foreground border-border hover:border-primary/40",
              flagged.has(question.id) && i !== current && "border-amber-400 text-amber-600 bg-amber-500/5"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* ── Question card ── */}
      <Card className="border-border shadow-soft p-6">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-start gap-3 flex-1">
            <span className="h-7 w-7 rounded-full gradient-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {current + 1}
            </span>
            <p className="text-base font-medium leading-relaxed">{q.text}</p>
          </div>
          <button
            onClick={toggleFlag}
            title={flagged.has(q.id) ? "Remove flag" : "Flag for review"}
            className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
              flagged.has(q.id)
                ? "bg-amber-500/10 text-amber-600"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Flag className="h-4 w-4" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {q.options.map((opt, oi) => {
            const selected = answers[q.id] === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.id }))}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all duration-150",
                  selected
                    ? "border-primary bg-primary/8 shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                    : "border-border hover:border-primary/40 hover:bg-secondary/50"
                )}
              >
                <span className={cn(
                  "h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                  selected ? "border-primary bg-primary text-white" : "border-border text-muted-foreground"
                )}>
                  {String.fromCharCode(65 + oi)}
                </span>
                <span className={cn("text-sm flex-1 text-left", selected && "font-medium")}>{opt.text}</span>
                {selected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          className="gap-1.5"
          disabled={current === 0}
          onClick={() => setCurrent((c) => c - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>

        <div className="flex items-center gap-2">
          {current < quiz.questions.length - 1 ? (
            <Button
              className="gradient-primary text-white border-0 gap-1.5"
              onClick={() => setCurrent((c) => c + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="gradient-primary text-white border-0 gap-1.5"
              onClick={() => setShowConfirm(true)}
            >
              Submit quiz
            </Button>
          )}
        </div>
      </div>

      {/* ── Submit confirmation overlay ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm p-6 border-border shadow-soft text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Submit quiz?</h3>
              <p className="text-sm text-muted-foreground mt-2">
                You've answered <strong>{answered}</strong> of <strong>{quiz.questions.length}</strong> questions.
              </p>
              {unanswered > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2 mt-3 text-xs text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {unanswered} question{unanswered > 1 ? "s" : ""} left unanswered will be marked incorrect.
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Keep reviewing</Button>
              <Button className="gradient-primary text-white border-0" onClick={handleSubmit}>
                Yes, submit
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
