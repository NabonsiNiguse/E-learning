/**
 * QAPage — role-aware Q&A board.
 *
 * Student  : ask questions, view/edit/delete own questions, read answers
 * Teacher  : answer questions in their courses, mark accepted, hide spam
 * Admin    : full moderation — hide/unhide, delete anything, answer anything
 */
import { useState, useMemo } from "react";
import {
  HelpCircle, Plus, Search, CheckCircle2, MessageSquare,
  EyeOff, Eye, Trash2, Pencil, ChevronDown, ChevronUp,
  BookOpen, Clock, Check, X, Send,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useQA } from "@/context/qa-context";
import { useApp } from "@/context/app-context";
import { mockCourses } from "@/lib/mock-data";
import type { QAQuestion, QAAnswer, QAState } from "@/lib/mock-qa";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const STATE_CONFIG: Record<QAState, { label: string; color: string; bg: string }> = {
  open:     { label: "Open",     color: "text-sky-600",     bg: "bg-sky-500/10 border-sky-500/20" },
  answered: { label: "Answered", color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20" },
  hidden:   { label: "Hidden",   color: "text-slate-500",   bg: "bg-slate-500/10 border-slate-500/20" },
};

function StateBadge({ state }: { state: QAState }) {
  const cfg = STATE_CONFIG[state];
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
      cfg.bg, cfg.color,
    )}>
      {state === "answered" && <CheckCircle2 className="h-2.5 w-2.5" />}
      {state === "hidden"   && <EyeOff className="h-2.5 w-2.5" />}
      {state === "open"     && <MessageSquare className="h-2.5 w-2.5" />}
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Ask / Edit question dialog
// ---------------------------------------------------------------------------
function AskDialog({
  onClose,
  initial,
  questionId,
}: {
  onClose: () => void;
  initial?: { title: string; body: string; courseId: string; courseTitle: string };
  questionId?: string;
}) {
  const { askQuestion, editQuestion } = useQA();
  const { currentUser, role } = useApp();

  const [title,    setTitle]    = useState(initial?.title    ?? "");
  const [body,     setBody]     = useState(initial?.body     ?? "");
  const [courseId, setCourseId] = useState(initial?.courseId ?? "");

  const availableCourses = mockCourses.filter((c) => !c.locked);
  const isEdit = !!questionId;

  const handleSubmit = () => {
    if (!title.trim() || !body.trim() || !courseId) return;
    const course = mockCourses.find((c) => c.id === courseId)!;

    if (isEdit) {
      editQuestion(questionId, title, body, currentUser?.id?.toString() ?? "", role);
    } else {
      askQuestion(
        courseId,
        course.title,
        title,
        body,
        {
          id:     currentUser?.id?.toString() ?? "",
          name:   currentUser?.full_name ?? "",
          avatar: currentUser ? `${currentUser.first_name[0]}${currentUser.last_name[0]}` : "??",
        },
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg border-border shadow-soft">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            {isEdit ? "Edit question" : "Ask a question"}
          </h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {!isEdit && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select a course…" />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Question title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarise your question in one line…"
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Details</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Provide context, code snippets, or what you've already tried…"
              className="min-h-[120px] resize-none text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-secondary/20">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="gradient-primary text-white border-0 shadow-glow gap-1.5"
            onClick={handleSubmit}
            disabled={!title.trim() || !body.trim() || (!isEdit && !courseId)}
          >
            <Send className="h-3.5 w-3.5" />
            {isEdit ? "Save changes" : "Post question"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Answer row
// ---------------------------------------------------------------------------
function AnswerRow({
  answer,
  question,
  canManage,
}: {
  answer: QAAnswer;
  question: QAQuestion;
  canManage: boolean;
}) {
  const { deleteAnswer, acceptAnswer, editAnswer } = useQA();
  const { currentUser, role } = useApp();
  const userId = currentUser?.id?.toString() ?? "";

  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(answer.body);

  const isOwner = answer.owner_id === userId;
  const canEdit = isOwner || role === "admin";

  const handleSave = () => {
    if (!draft.trim()) return;
    editAnswer(answer.id, question.id, draft, userId, role);
    setEditing(false);
  };

  return (
    <div className={cn(
      "rounded-xl border p-4 space-y-3",
      answer.is_accepted
        ? "border-emerald-500/30 bg-emerald-500/5"
        : "border-border bg-secondary/20",
    )}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
            {answer.owner_avatar}
          </div>
          <span className="text-sm font-medium">{answer.owner_name}</span>
          <Badge variant="outline" className="text-[10px] capitalize">{answer.owner_role}</Badge>
          {answer.is_accepted && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
              <CheckCircle2 className="h-3 w-3" /> Accepted
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">{formatDate(answer.created_at)}</span>
          {/* Accept — teacher/admin who owns the question's course, or admin */}
          {canManage && !answer.is_accepted && (
            <Button
              variant="ghost" size="sm"
              className="h-6 px-2 text-[10px] text-emerald-600 hover:bg-emerald-500/10 gap-1"
              onClick={() => acceptAnswer(answer.id, question.id, userId, role)}
            >
              <Check className="h-3 w-3" /> Accept
            </Button>
          )}
          {canEdit && !editing && (
            <Button
              variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => { setDraft(answer.body); setEditing(true); }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          {canEdit && (
            <Button
              variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => deleteAnswer(answer.id, question.id, userId, role)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[80px] resize-none text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs gradient-primary text-white border-0" onClick={handleSave}>Save</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{answer.body}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Question card (expandable)
// ---------------------------------------------------------------------------
function QuestionCard({ question }: { question: QAQuestion }) {
  const { deleteQuestion, setQuestionState, postAnswer, editQuestion } = useQA();
  const { currentUser, role } = useApp();
  const userId = currentUser?.id?.toString() ?? "";

  const [expanded,    setExpanded]    = useState(false);
  const [answerDraft, setAnswerDraft] = useState("");
  const [editOpen,    setEditOpen]    = useState(false);

  const isOwner    = question.owner_id === userId;
  const isAdmin    = role === "admin";
  const isTeacher  = role === "teacher";
  const canAnswer  = isTeacher || isAdmin;
  const canDelete  = isOwner || isAdmin;
  const canModerate = isTeacher || isAdmin;

  const handlePostAnswer = () => {
    if (!answerDraft.trim()) return;
    postAnswer(question.id, answerDraft, {
      id:     userId,
      name:   currentUser.full_name,
      avatar: `${currentUser.first_name[0]}${currentUser.last_name[0]}`,
      role:   role as "teacher" | "admin",
    });
    setAnswerDraft("");
  };

  return (
    <>
      <Card className={cn(
        "border-border shadow-soft transition-all duration-200 ease-out hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-0.5",
        question.state === "hidden" && "opacity-60 border-dashed",
      )}>
        <div className="p-5">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <StateBadge state={question.state} />
                <Badge variant="outline" className="text-[10px]">
                  <BookOpen className="h-2.5 w-2.5 mr-1" />
                  {question.course_title}
                </Badge>
              </div>
              <h3 className="font-semibold text-base leading-snug">{question.title}</h3>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Moderation: hide / unhide */}
              {canModerate && question.state !== "hidden" && (
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-amber-600"
                  title="Hide question"
                  onClick={() => setQuestionState(question.id, "hidden", userId, role)}
                >
                  <EyeOff className="h-3.5 w-3.5" />
                </Button>
              )}
              {isAdmin && question.state === "hidden" && (
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-sky-600"
                  title="Unhide question"
                  onClick={() => setQuestionState(question.id, question.answers.length > 0 ? "answered" : "open", userId, role)}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              )}
              {/* Edit — owner or admin */}
              {(isOwner || isAdmin) && (
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {/* Delete — owner or admin */}
              {canDelete && (
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteQuestion(question.id, userId, role)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Body preview */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{question.body}</p>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
            <span className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full gradient-primary flex items-center justify-center text-white text-[9px] font-semibold">
                {question.owner_avatar}
              </div>
              {question.owner_name}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(question.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {question.answers.length} answer{question.answers.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Expand toggle */}
          <Button
            variant="outline" size="sm"
            className="w-full h-8 text-xs gap-1.5"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? "Collapse" : `View full question${question.answers.length > 0 ? " & answers" : ""}`}
          </Button>
        </div>

        {/* Expanded section */}
        {expanded && (
          <div className="border-t border-border px-5 py-5 space-y-5">
            {/* Full body */}
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{question.body}</p>

            {/* Answers */}
            {question.answers.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {question.answers.length} Answer{question.answers.length !== 1 ? "s" : ""}
                </p>
                {question.answers.map((ans) => (
                  <AnswerRow
                    key={ans.id}
                    answer={ans}
                    question={question}
                    canManage={canAnswer}
                  />
                ))}
              </div>
            )}

            {/* Post answer — teacher / admin only */}
            {canAnswer && question.state !== "hidden" && (
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground">Post an answer</p>
                <Textarea
                  value={answerDraft}
                  onChange={(e) => setAnswerDraft(e.target.value)}
                  placeholder="Write a clear, helpful answer…"
                  className="min-h-[100px] resize-none text-sm"
                />
                <Button
                  size="sm"
                  className="gradient-primary text-white border-0 shadow-glow gap-1.5"
                  onClick={handlePostAnswer}
                  disabled={!answerDraft.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                  Post answer
                </Button>
              </div>
            )}

            {/* No answers yet — student view */}
            {!canAnswer && question.answers.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-sky-500/5 border border-sky-500/20 px-4 py-3 text-xs text-sky-600">
                <Clock className="h-4 w-4 shrink-0" />
                Your question is open — a teacher will answer soon.
              </div>
            )}
          </div>
        )}
      </Card>

      {editOpen && (
        <AskDialog
          questionId={question.id}
          initial={{
            title:       question.title,
            body:        question.body,
            courseId:    question.course_id,
            courseTitle: question.course_title,
          }}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page export
// ---------------------------------------------------------------------------
export function QAPage() {
  const { getVisibleQuestions } = useQA();
  const { currentUser, role }   = useApp();
  const userId = currentUser?.id?.toString() ?? "u3";

  const [askOpen,      setAskOpen]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [stateFilter,  setStateFilter]  = useState<QAState | "all">("all");

  const allVisible = getVisibleQuestions(role, userId);

  const filtered = useMemo(() => {
    return allVisible.filter((q) => {
      if (courseFilter !== "all" && q.course_id !== courseFilter) return false;
      if (stateFilter  !== "all" && q.state     !== stateFilter)  return false;
      if (search) {
        const s = search.toLowerCase();
        if (!q.title.toLowerCase().includes(s) && !q.body.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [allVisible, courseFilter, stateFilter, search]);

  const courses = [...new Map(allVisible.map((q) => [q.course_id, q.course_title])).entries()];

  // Stats
  const openCount     = allVisible.filter((q) => q.state === "open").length;
  const answeredCount = allVisible.filter((q) => q.state === "answered").length;
  const hiddenCount   = allVisible.filter((q) => q.state === "hidden").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-display font-bold">Q&amp;A</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {role === "student"
              ? "Ask questions and get answers from your teachers"
              : role === "teacher"
              ? "Answer student questions and manage course Q&A"
              : "Moderate all questions and answers across courses"}
          </p>
        </div>
        {role === "student" && (
          <Button
            className="gradient-primary text-white border-0 shadow-glow gap-1.5"
            onClick={() => setAskOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Ask a question
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4 border-border shadow-soft flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
            <MessageSquare className="h-4 w-4 text-sky-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-display leading-none">{openCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Open</p>
          </div>
        </Card>
        <Card className="p-4 border-border shadow-soft flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-display leading-none">{answeredCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Answered</p>
          </div>
        </Card>
        {(role === "admin" || role === "teacher") && (
          <Card className="p-4 border-border shadow-soft flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-500/10 flex items-center justify-center shrink-0">
              <EyeOff className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xl font-bold font-display leading-none">{hiddenCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Hidden</p>
            </div>
          </Card>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4 border-border shadow-soft">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions…"
              className="pl-9 h-10"
            />
          </div>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="h-10 w-[200px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map(([id, title]) => (
                <SelectItem key={id} value={id}>{title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stateFilter} onValueChange={(v) => setStateFilter(v as QAState | "all")}>
            <SelectTrigger className="h-10 w-[150px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="answered">Answered</SelectItem>
              {(role === "admin" || role === "teacher") && (
                <SelectItem value="hidden">Hidden</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Question list */}
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {filtered.length} question{filtered.length !== 1 ? "s" : ""}
        </p>

        {filtered.length === 0 ? (
          <Card className="border-border shadow-soft">
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <HelpCircle className="h-10 w-10 opacity-20" />
              <p className="text-sm font-medium">No questions found</p>
              {role === "student" && (
                <Button variant="outline" size="sm" onClick={() => setAskOpen(true)}>
                  Ask the first question
                </Button>
              )}
            </div>
          </Card>
        ) : (
          filtered.map((q) => <QuestionCard key={q.id} question={q} />)
        )}
      </div>

      {askOpen && <AskDialog onClose={() => setAskOpen(false)} />}
    </div>
  );
}
