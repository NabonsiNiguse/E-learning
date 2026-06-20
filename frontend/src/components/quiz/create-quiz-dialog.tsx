import { useState } from "react";
import { Plus, Trash2, X, Save, GripVertical } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useQuiz } from "@/context/quiz-context";
import { useApp } from "@/context/app-context";
import { mockCourses, type QuizQuestion, type QuizOption } from "@/lib/mock-data";
import { toast } from "sonner";

interface CreateQuizDialogProps {
  open: boolean;
  onClose: () => void;
}

function makeOption(text = ""): QuizOption {
  return { id: crypto.randomUUID().slice(0, 8), text };
}

function makeQuestion(): QuizQuestion {
  return {
    id: crypto.randomUUID().slice(0, 8),
    text: "",
    options: [makeOption(), makeOption(), makeOption(), makeOption()],
    correct_option_id: "",
    explanation: "",
  };
}

export function CreateQuizDialog({ open, onClose }: CreateQuizDialogProps) {
  const { addQuiz } = useQuiz();
  const { currentUser } = useApp();

  const instructorName   = currentUser?.full_name ?? "Sara Bekele";
  const instructorAvatar = `${currentUser?.first_name?.[0] ?? "S"}${currentUser?.last_name?.[0] ?? "B"}`;
  const myCourses = mockCourses.filter(
    (c) => c.instructor === instructorName || currentUser?.role === "admin"
  );

  const [title, setTitle]           = useState("");
  const [instructions, setInstructions] = useState("");
  const [courseId, setCourseId]     = useState(myCourses[0]?.id ?? "");
  const [timeLimit, setTimeLimit]   = useState(15);
  const [passingScore, setPassing]  = useState(70);
  const [questions, setQuestions]   = useState<QuizQuestion[]>([makeQuestion()]);

  const addQuestion = () => setQuestions((q) => [...q, makeQuestion()]);

  const removeQuestion = (idx: number) =>
    setQuestions((q) => q.filter((_, i) => i !== idx));

  const updateQuestion = (idx: number, patch: Partial<QuizQuestion>) =>
    setQuestions((q) => q.map((item, i) => i === idx ? { ...item, ...patch } : item));

  const updateOption = (qIdx: number, oIdx: number, text: string) =>
    setQuestions((q) => q.map((item, i) => {
      if (i !== qIdx) return item;
      const opts = item.options.map((o, j) => j === oIdx ? { ...o, text } : o);
      return { ...item, options: opts };
    }));

  const isValid = title.trim() &&
    courseId &&
    questions.length > 0 &&
    questions.every((q) =>
      q.text.trim() &&
      q.correct_option_id &&
      q.options.every((o) => o.text.trim())
    );

  const handleSave = () => {
    if (!isValid) { toast.error("Please fill in all fields and select a correct answer for each question."); return; }
    const course = myCourses.find((c) => c.id === courseId);
    const now = new Date();
    const until = new Date(now); until.setDate(until.getDate() + 14);
    addQuiz({
      title: title.trim(),
      instructions: instructions.trim() || "Answer all questions carefully.",
      course_id: courseId,
      course_title: course?.title ?? "",
      created_by: instructorName,
      created_by_avatar: instructorAvatar,
      time_limit_minutes: timeLimit,
      status: "upcoming",
      questions,
      passing_score: passingScore,
      available_from: now.toISOString(),
      available_until: until.toISOString(),
      attempts_allowed: 1,
    });
    toast.success(`Quiz "${title}" created.`);
    setTitle(""); setInstructions(""); setQuestions([makeQuestion()]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[680px] gap-0 p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Create new quiz
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Basic info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Quiz title <span className="text-destructive">*</span></Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. React Fundamentals Quiz" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Course <span className="text-destructive">*</span></Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {myCourses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Time limit (min)</Label>
                <Input type="number" min={1} max={180} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Passing score (%)</Label>
                <Input type="number" min={1} max={100} value={passingScore} onChange={(e) => setPassing(Number(e.target.value))} className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Instructions</Label>
              <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions shown to students before they start…" className="min-h-[72px] resize-none text-sm" />
            </div>
          </div>

          <Separator />

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{questions.length} question{questions.length !== 1 ? "s" : ""}</p>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={addQuestion}>
                <Plus className="h-3.5 w-3.5" /> Add question
              </Button>
            </div>

            {questions.map((q, qi) => (
              <div key={q.id} className="rounded-xl border border-border p-4 space-y-3 bg-secondary/20">
                <div className="flex items-start gap-2">
                  <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {qi + 1}
                  </span>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={q.text}
                      onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                      placeholder="Question text…"
                      className="h-9 text-sm"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oi) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuestion(qi, { correct_option_id: opt.id })}
                            className={cn(
                              "h-5 w-5 rounded-full border-2 shrink-0 transition-colors",
                              q.correct_option_id === opt.id
                                ? "border-primary bg-primary"
                                : "border-border hover:border-primary/60"
                            )}
                          >
                            {q.correct_option_id === opt.id && (
                              <span className="flex items-center justify-center h-full w-full">
                                <span className="h-2 w-2 rounded-full bg-white" />
                              </span>
                            )}
                          </button>
                          <Input
                            value={opt.text}
                            onChange={(e) => updateOption(qi, oi, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                            className="h-8 text-xs flex-1"
                          />
                        </div>
                      ))}
                    </div>
                    <Input
                      value={q.explanation ?? ""}
                      onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
                      placeholder="Explanation (shown after submission)…"
                      className="h-8 text-xs text-muted-foreground"
                    />
                  </div>
                  {questions.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeQuestion(qi)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-secondary/20 shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4 mr-1" />Cancel</Button>
          <Button size="sm" className="gradient-primary text-white border-0 shadow-glow gap-1.5" onClick={handleSave} disabled={!isValid}>
            <Save className="h-4 w-4" />Save quiz
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
