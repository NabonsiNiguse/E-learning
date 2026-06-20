/**
 * CourseQAPanel — inline role-based Q&A forum for the Course Player.
 *
 * Lives inside the tabbed panel (About / Notes / Q&A).
 * Uses the existing QAContext — no new state, no mock data.
 *
 * Roles:
 *   student   → ask questions, answer threads, edit/delete own posts
 *   teacher   → answer, endorse accepted answers, moderate (hide/delete)
 *   admin     → full moderation + unhide
 */
import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, X, Send, Trash2, Pencil, CheckCircle2,
  MessageSquare, Clock, ChevronDown, EyeOff, Eye,
  HelpCircle, GraduationCap, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useQA } from "@/context/qa-context";
import { useApp } from "@/context/app-context";
import type { QAQuestion, QAAnswer } from "@/lib/mock-qa";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function initials(user: { first_name: string; last_name: string } | null) {
  if (!user) return "??";
  return `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase();
}

// ─── Avatar with optional instructor ring ────────────────────────────────────
function Avatar({ abbr, instructor = false, size = "sm" }: {
  abbr: string; instructor?: boolean; size?: "xs" | "sm" | "md";
}) {
  const dim = size === "xs" ? "h-6 w-6 text-[9px]"
            : size === "sm" ? "h-8 w-8 text-[11px]"
            : "h-10 w-10 text-xs";
  return (
    <div className="relative shrink-0">
      <div className={cn(
        "rounded-full gradient-primary flex items-center justify-center text-white font-bold select-none",
        dim,
        instructor && "ring-2 ring-emerald-500 ring-offset-1 ring-offset-background",
      )}>
        {abbr}
      </div>
      {instructor && (
        <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
          <GraduationCap className="h-2 w-2 text-white" />
        </div>
      )}
    </div>
  );
}

// ─── Role pill ────────────────────────────────────────────────────────────────
function RolePill({ role }: { role: string }) {
  const cls = role === "teacher" || role === "admin"
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
    : "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25";
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide",
      "px-1.5 py-0.5 rounded-full border", cls,
    )}>
      {(role === "teacher" || role === "admin") && <ShieldCheck className="h-2 w-2" />}
      {role}
    </span>
  );
}

// ─── Inline ask / edit form ───────────────────────────────────────────────────
function AskForm({ courseId, courseTitle, onClose, initial, questionId }: {
  courseId: string; courseTitle: string; onClose: () => void;
  initial?: { title: string; body: string }; questionId?: string;
}) {
  const { askQuestion, editQuestion } = useQA();
  const { currentUser, role } = useApp();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body,  setBody]  = useState(initial?.body  ?? "");
  const valid = title.trim().length > 0 && body.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    const userId = currentUser?.id?.toString() ?? "";
    if (questionId) {
      editQuestion(questionId, title, body, userId, role);
    } else {
      askQuestion(courseId, courseTitle, title, body, {
        id:     userId,
        name:   currentUser?.full_name ?? "Student",
        avatar: initials(currentUser),
      });
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}
      className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-primary" />
          {questionId ? "Edit question" : "Ask a question"}
        </p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <Input
        value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="Summarise your question…" className="h-9 text-sm bg-background" autoFocus
      />
      <Textarea
        value={body} onChange={(e) => setBody(e.target.value)}
        placeholder="Provide context, what you've tried, a code snippet…"
        className="min-h-[96px] resize-none text-sm bg-background leading-relaxed"
        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit(); }}
      />
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">Cancel</Button>
        <Button size="sm" onClick={submit} disabled={!valid}
          className="h-8 text-xs gradient-primary text-white border-0 gap-1.5">
          <Send className="h-3.5 w-3.5" />
          {questionId ? "Save changes" : "Post question"}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Reply / Answer form ──────────────────────────────────────────────────────
function ReplyForm({ questionId, isInstructor }: {
  questionId: string; isInstructor: boolean;
}) {
  const { postAnswer } = useQA();
  const { currentUser, role } = useApp();
  const [draft, setDraft] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(() => {
    if (!draft.trim()) return;
    // Optimistic — context.postAnswer is synchronous state update → instant UI
    postAnswer(questionId, draft, {
      id:     currentUser?.id?.toString() ?? "",
      name:   currentUser?.full_name ?? "Unknown",
      avatar: initials(currentUser),
      role:   (role === "admin" || role === "teacher") ? role : "teacher",
    });
    setDraft("");
  }, [draft, questionId, currentUser, role, postAnswer]);

  return (
    <div className="flex gap-2.5 items-start pt-1">
      <Avatar abbr={initials(currentUser)} instructor={isInstructor} size="xs" />
      <div className="flex-1 space-y-1.5">
        <Textarea
          ref={textRef} value={draft} onChange={(e) => setDraft(e.target.value)}
          placeholder={isInstructor ? "Write an instructor answer…" : "Add a comment or answer…"}
          className="min-h-[68px] resize-none text-sm bg-background leading-relaxed"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Ctrl+Enter to post</span>
          <Button size="sm" onClick={submit} disabled={!draft.trim()}
            className="h-7 text-xs gradient-primary text-white border-0 gap-1">
            <Send className="h-3 w-3" />
            {isInstructor ? "Post answer" : "Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Single answer row ────────────────────────────────────────────────────────
function AnswerRow({ answer, question, canEndorse, canModerate, isOwner }: {
  answer: QAAnswer; question: QAQuestion;
  canEndorse: boolean; canModerate: boolean; isOwner: boolean;
}) {
  const { acceptAnswer, deleteAnswer, editAnswer } = useQA();
  const { currentUser, role } = useApp();
  const userId      = currentUser?.id?.toString() ?? "";
  const isInstructor = answer.owner_role === "teacher" || answer.owner_role === "admin";

  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(answer.body);

  const saveEdit = () => {
    if (!draft.trim()) return;
    editAnswer(answer.id, question.id, draft, userId, role);
    setEditing(false);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.18 }}
      className={cn(
        "rounded-xl border p-3.5 space-y-2.5 transition-colors duration-150",
        answer.is_accepted
          ? "border-emerald-500/35 bg-emerald-500/5"
          : "border-border/60 bg-secondary/20",
      )}>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Avatar abbr={answer.owner_avatar} instructor={isInstructor} size="xs" />
          <span className="text-xs font-semibold">{answer.owner_name}</span>
          <RolePill role={answer.owner_role} />
          {answer.is_accepted && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded-full">
              <CheckCircle2 className="h-2.5 w-2.5" /> Instructor Endorsed
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{timeAgo(answer.created_at)}</span>
        </div>

        <div className="flex items-center gap-1">
          {canEndorse && !answer.is_accepted && (
            <button onClick={() => acceptAnswer(answer.id, question.id, userId, role)}
              className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-500/10 px-2 py-1 rounded-lg transition-colors">
              <CheckCircle2 className="h-3 w-3" /> Endorse
            </button>
          )}
          {(isOwner || canModerate) && !editing && (
            <button onClick={() => { setDraft(answer.body); setEditing(true); }}
              className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center transition-colors">
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {(isOwner || canModerate) && (
            <button onClick={() => deleteAnswer(answer.id, question.id, userId, role)}
              className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {editing ? (
        <div className="space-y-2">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)}
            className="min-h-[72px] resize-none text-sm bg-background" autoFocus />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit} className="h-7 text-xs gradient-primary text-white border-0">Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 text-xs">Cancel</Button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{answer.body}</p>
      )}
    </motion.div>
  );
}

// ─── Expandable question thread card ─────────────────────────────────────────
function QuestionCard({ question, userId, isInstructor, canModerate }: {
  question: QAQuestion; userId: string; isInstructor: boolean; canModerate: boolean;
}) {
  const { deleteQuestion, setQuestionState } = useQA();
  const { role } = useApp();

  const [expanded, setExpanded] = useState(false);
  const [editing,  setEditing]  = useState(false);

  const isOwner = question.owner_id === userId;
  const canEdit = isOwner || role === "admin";

  // Accepted answer always first, then chronological
  const sortedAnswers = useMemo(() => [...question.answers].sort((a, b) => {
    if (a.is_accepted !== b.is_accepted) return a.is_accepted ? -1 : 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }), [question.answers]);

  const accepted = sortedAnswers.find((a) => a.is_accepted);
  const stateColor =
    question.state === "answered" ? "text-emerald-600"
    : question.state === "hidden"  ? "text-muted-foreground"
    : "text-sky-600";

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.18 }}>
      <div className={cn(
        "rounded-xl border transition-all duration-150",
        question.state === "hidden"
          ? "border-dashed border-border/40 opacity-65 bg-muted/20"
          : expanded
          ? "border-primary/20 bg-background shadow-[0_4px_20px_-4px_rgba(0,0,0,0.07)]"
          : "border-border/60 bg-background hover:border-border hover:shadow-sm",
      )}>

        {/* ── Summary row (always visible, click to expand) ── */}
        <button className="w-full text-left px-4 py-3.5 group" onClick={() => setExpanded((v) => !v)}>
          <div className="flex items-start gap-3">
            <Avatar abbr={question.owner_avatar} size="sm" />
            <div className="flex-1 min-w-0">
              {/* Meta */}
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className="text-xs font-semibold">{question.owner_name}</span>
                <RolePill role="student" />
                <span className="text-[10px] text-muted-foreground">{timeAgo(question.created_at)}</span>
                <span className={cn("flex items-center gap-0.5 text-[10px] font-medium", stateColor)}>
                  {question.state === "answered" && <CheckCircle2 className="h-2.5 w-2.5" />}
                  {question.state === "hidden"   && <EyeOff className="h-2.5 w-2.5" />}
                  {question.state === "open"     && <MessageSquare className="h-2.5 w-2.5" />}
                  {question.state}
                </span>
              </div>
              {/* Title */}
              <p className="text-sm font-semibold leading-snug">{question.title}</p>
              {/* Snippet + footer when collapsed */}
              {!expanded && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{question.body}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  {question.answers.length} {question.answers.length === 1 ? "answer" : "answers"}
                </span>
                {accepted && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Endorsed by {accepted.owner_name}
                  </span>
                )}
              </div>
            </div>

            {/* Chevron */}
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }} className="shrink-0 mt-1">
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </div>
        </button>

        {/* ── Expanded thread ── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div key="body"
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
              className="overflow-hidden">
              <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-4">

                {/* Full body */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {question.body}
                </p>

                {/* Action strip — edit / delete / moderate */}
                <div className="flex items-center gap-1.5 flex-wrap -mt-1">
                  {canEdit && !editing && (
                    <button onClick={() => setEditing(true)}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary transition-colors">
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  )}
                  {(isOwner || canModerate) && (
                    <button onClick={() => deleteQuestion(question.id, userId, role)}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive px-2 py-1 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  )}
                  {canModerate && question.state !== "hidden" && (
                    <button onClick={() => setQuestionState(question.id, "hidden", userId, role)}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-amber-600 px-2 py-1 rounded-lg hover:bg-amber-500/10 transition-colors">
                      <EyeOff className="h-3 w-3" /> Hide
                    </button>
                  )}
                  {role === "admin" && question.state === "hidden" && (
                    <button onClick={() => setQuestionState(question.id,
                      question.answers.length > 0 ? "answered" : "open", userId, role)}
                      className="flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-700 px-2 py-1 rounded-lg hover:bg-sky-500/10 transition-colors">
                      <Eye className="h-3 w-3" /> Unhide
                    </button>
                  )}
                </div>

                {/* Inline edit form */}
                <AnimatePresence>
                  {editing && (
                    <AskForm courseId={question.course_id} courseTitle={question.course_title}
                      questionId={question.id}
                      initial={{ title: question.title, body: question.body }}
                      onClose={() => setEditing(false)} />
                  )}
                </AnimatePresence>

                {/* Answers list */}
                {sortedAnswers.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {sortedAnswers.length} Answer{sortedAnswers.length !== 1 ? "s" : ""}
                    </p>
                    <AnimatePresence>
                      {sortedAnswers.map((ans) => (
                        <AnswerRow key={ans.id} answer={ans} question={question}
                          canEndorse={isInstructor} canModerate={canModerate}
                          isOwner={ans.owner_id === userId} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Empty state (student) */}
                {sortedAnswers.length === 0 && !isInstructor && (
                  <div className="flex items-center gap-2.5 rounded-xl bg-sky-500/5 border border-sky-500/20 px-3 py-2.5">
                    <Clock className="h-4 w-4 text-sky-500 shrink-0" />
                    <p className="text-xs text-sky-600">
                      Your question is open — a teacher will answer soon.
                    </p>
                  </div>
                )}

                {/* Reply / Answer form — hidden for hidden questions */}
                {question.state !== "hidden" && (
                  <div className="border-t border-border/40 pt-3">
                    <ReplyForm questionId={question.id} isInstructor={isInstructor} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main export: CourseQAPanel ───────────────────────────────────────────────
export function CourseQAPanel({ courseId, courseTitle }: {
  courseId: string;
  courseTitle: string;
}) {
  const { getVisibleQuestions } = useQA();
  const { currentUser, role }   = useApp();

  const userId      = currentUser?.id?.toString() ?? "";
  const isInstructor = role === "teacher" || role === "admin" || role === "super_admin";
  const canModerate  = role === "teacher" || role === "admin" || role === "super_admin";

  const [search,   setSearch]   = useState("");
  const [askOpen,  setAskOpen]  = useState(false);

  // Only show questions for this course
  const courseQuestions = getVisibleQuestions(role, userId, courseId);

  const filtered = useMemo(() => {
    if (!search.trim()) return courseQuestions;
    const q = search.toLowerCase();
    return courseQuestions.filter(
      (x) => x.title.toLowerCase().includes(q) || x.body.toLowerCase().includes(q)
    );
  }, [courseQuestions, search]);

  // Stats for the header strip
  const openCount     = courseQuestions.filter((q) => q.state === "open").length;
  const answeredCount = courseQuestions.filter((q) => q.state === "answered").length;

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <p className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Course Q&amp;A
          </p>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              {openCount} open
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {answeredCount} answered
            </span>
            <span>{courseQuestions.length} total</span>
          </div>
        </div>

        {/* Any role can ask a question */}
        <Button
          size="sm"
          onClick={() => setAskOpen((v) => !v)}
          className={cn(
            "h-8 text-xs gap-1.5 transition-all",
            askOpen
              ? "bg-secondary text-foreground border border-border"
              : "gradient-primary text-white border-0 shadow-[0_4px_12px_-2px] shadow-primary/30",
          )}
        >
          {askOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {askOpen ? "Cancel" : "Ask a question"}
        </Button>
      </div>

      {/* ── Ask form (toggles with AnimatePresence) ── */}
      <AnimatePresence>
        {askOpen && (
          <AskForm
            courseId={courseId}
            courseTitle={courseTitle}
            onClose={() => setAskOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Search bar ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions in this course…"
          className="pl-9 h-9 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Results count ── */}
      {search && (
        <p className="text-xs text-muted-foreground">
          {filtered.length > 0
            ? <><strong className="text-foreground">{filtered.length}</strong> result{filtered.length !== 1 ? "s" : ""} for "<em>{search}</em>"</>
            : <>No results for "<em>{search}</em>"</>
          }
        </p>
      )}

      {/* ── Questions feed ── */}
      <ScrollArea className="max-h-[520px] pr-1">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
            <MessageSquare className="h-10 w-10 opacity-20" />
            {courseQuestions.length === 0 ? (
              <>
                <p className="text-sm font-medium">No questions yet for this lesson</p>
                <p className="text-xs opacity-70">Be the first to ask a question!</p>
                <Button variant="outline" size="sm" onClick={() => setAskOpen(true)} className="mt-1">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Ask the first question
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">No questions match "{search}"</p>
                <button onClick={() => setSearch("")} className="text-xs text-primary hover:underline">
                  Clear search
                </button>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div className="space-y-2.5 pb-2">
            <AnimatePresence initial={false}>
              {filtered.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  userId={userId}
                  isInstructor={isInstructor}
                  canModerate={canModerate}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </ScrollArea>
    </div>
  );
}
