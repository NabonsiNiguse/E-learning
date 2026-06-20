/**
 * Floating AI Assistant Widget
 * - Draggable, minimizable, closable
 * - Role-aware responses (student / teacher / admin)
 * - Platform-only answers with quick-action chips
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  Sparkles, X, Minus, Maximize2, Minimize2,
  Send, BookOpen, CreditCard, TrendingUp,
  LifeBuoy, MessageCircle, Bot, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/app-context";
import type { UserRole } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  ts: Date;
}

// ---------------------------------------------------------------------------
// AI response engine (platform-only, role-aware)
// ---------------------------------------------------------------------------
const GREETINGS = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "howdy", "sup"];

function getAIResponse(input: string, role: UserRole): string {
  const q = input.toLowerCase().trim();

  // Greetings
  if (GREETINGS.some((g) => q.startsWith(g) || q === g)) {
    const greetMap: Record<UserRole, string> = {
      student: "Hey! 👋 I'm your Learnly assistant. I can help you with courses, progress, payments, and more. What do you need?",
      teacher: "Hello! 👋 I'm here to help you manage your courses, attendance, and student progress. What can I do for you?",
      admin:   "Hi Admin! 👋 I can assist with platform management, user oversight, and reports. How can I help?",
    };
    return greetMap[role];
  }

  // Courses
  if (q.includes("course") || q.includes("lesson") || q.includes("learn")) {
    const map: Record<UserRole, string> = {
      student: "You can browse all available courses at /courses. Enrolled courses show your progress. Tap 'Resume' on any course to continue learning.",
      teacher: "Go to /courses to manage your courses. You can create, edit, publish, or archive them. Add lessons from the course detail page.",
      admin:   "The /courses page shows all platform courses. You can manage any course, assign teachers, and control publish status.",
    };
    return map[role];
  }

  // Payment
  if (q.includes("pay") || q.includes("price") || q.includes("enroll") || q.includes("purchase") || q.includes("fee")) {
    const map: Record<UserRole, string> = {
      student: "To enroll in a premium course, go to the course page and tap 'Enroll'. Payment is processed securely. View your payment history at /payments.",
      teacher: "Course pricing is set when creating or editing a course. Students pay to enroll in premium courses. Revenue reports are in your dashboard.",
      admin:   "All transactions are visible in the Payments section. You can view, filter, and manage payment records for all users.",
    };
    return map[role];
  }

  // Progress / results
  if (q.includes("progress") || q.includes("grade") || q.includes("result") || q.includes("score") || q.includes("certificate")) {
    const map: Record<UserRole, string> = {
      student: "Your progress is tracked per course. Check /results for quiz and assignment grades. Certificates are awarded on course completion at /certificates.",
      teacher: "Student progress and grades are visible in /results and /attendance. You can also view per-course summaries from your dashboard.",
      admin:   "Full progress reports for all students are in /results. You can filter by course, student, or date range.",
    };
    return map[role];
  }

  // Attendance
  if (q.includes("attendance") || q.includes("absent") || q.includes("present")) {
    const map: Record<UserRole, string> = {
      student: "Your attendance record is at /attendance. It shows your presence across all enrolled courses.",
      teacher: "Mark attendance at /attendance. Select a course and date, then mark each student. Bulk save is supported.",
      admin:   "Full attendance records for all courses are at /attendance. You can view summaries per course or student.",
    };
    return map[role];
  }

  // Messages
  if (q.includes("message") || q.includes("chat") || q.includes("contact") || q.includes("inbox")) {
    return "Head to /messages to view your inbox, send direct messages, or post announcements. Unread messages show a badge in the sidebar.";
  }

  // Support
  if (q.includes("help") || q.includes("support") || q.includes("problem") || q.includes("issue") || q.includes("error")) {
    return "For platform issues, check your internet connection first. If the problem persists, contact your administrator or use the Q&A section at /qa for course-related questions.";
  }

  // Dashboard
  if (q.includes("dashboard") || q.includes("home") || q.includes("overview")) {
    return "Your dashboard at /dashboard gives a full overview — enrolled courses, progress, recent activity, and quick stats tailored to your role.";
  }

  // Users (admin)
  if (q.includes("user") || q.includes("student") || q.includes("teacher")) {
    if (role === "admin") return "Manage all users at /users. You can add, edit roles, or remove users. Student-specific data is at /students.";
    if (role === "teacher") return "View your enrolled students at /students. You can see their progress and attendance records.";
    return "Your profile and account settings are at /profile and /settings.";
  }

  // Quiz / assignment
  if (q.includes("quiz") || q.includes("assignment") || q.includes("test") || q.includes("exam")) {
    const map: Record<UserRole, string> = {
      student: "Find your assignments at /assignments and quizzes at /quizzes. Submit before the deadline to get graded.",
      teacher: "Create and manage assignments at /assignments and quizzes at /quizzes. Results appear in /results after submission.",
      admin:   "All assignments and quizzes across courses are visible at /assignments and /quizzes.",
    };
    return map[role];
  }

  // Off-topic guard
  if (
    q.includes("weather") || q.includes("news") || q.includes("sport") ||
    q.includes("politic") || q.includes("movie") || q.includes("game") ||
    q.includes("joke") || q.includes("recipe")
  ) {
    return "I'm focused on helping you with the Learnly platform. Try asking about courses, payments, progress, or attendance!";
  }

  // Default
  return "I can help with courses, payments, progress, attendance, messages, and more on Learnly. Try one of the quick actions below or ask me anything platform-related!";
}

// ---------------------------------------------------------------------------
// Quick chips
// ---------------------------------------------------------------------------
const CHIPS = [
  { label: "Courses",  icon: BookOpen,      q: "Tell me about courses" },
  { label: "Payment",  icon: CreditCard,    q: "How does payment work?" },
  { label: "Progress", icon: TrendingUp,    q: "How can I check my progress?" },
  { label: "Support",  icon: LifeBuoy,      q: "I need help with an issue" },
  { label: "Hi!",      icon: MessageCircle, q: "Hello" },
];

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------
export function AIWidget() {
  const { role } = useApp();
  const [open, setOpen]         = useState(false);
  const [maximized, setMax]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "ai",
      text: getAIResponse("hello", role),
      ts: new Date(),
    },
  ]);
  const [input, setInput]   = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef           = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);
  const dragControls        = useDragControls();

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: `u${Date.now()}`, role: "user", text: text.trim(), ts: new Date() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const aiMsg: Message = {
        id: `a${Date.now()}`,
        role: "ai",
        text: getAIResponse(text, role),
        ts: new Date(),
      };
      setMessages((p) => [...p, aiMsg]);
      setTyping(false);
    }, 700 + Math.random() * 400);
  }, [role]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <>
      {/* FAB button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className={cn(
              "fixed bottom-6 right-6 z-50",
              "h-14 w-14 rounded-2xl",
              "bg-gradient-to-br from-orange-500 to-amber-500",
              "shadow-[0_8px_32px_-4px_rgba(249,115,22,0.6)]",
              "flex items-center justify-center",
              "border border-orange-400/30"
            )}
            aria-label="Open AI Assistant"
          >
            <Sparkles className="h-6 w-6 text-white" />
            <motion.span
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl bg-orange-400/40"
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            drag
            dragControls={dragControls}
            dragMomentum={false}
            dragElastic={0}
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{ position: "fixed", bottom: maximized ? 0 : 24, right: maximized ? 0 : 24, zIndex: 50 }}
            className={cn(
              "flex flex-col overflow-hidden",
              "bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl",
              "border border-white/30 dark:border-slate-700/50",
              "shadow-[0_24px_80px_-12px_rgba(0,0,0,0.35)]",
              maximized
                ? "w-screen h-screen rounded-none"
                : "w-[360px] h-[520px] rounded-2xl"
            )}
          >
            {/* Header — drag handle */}
            <div
              onPointerDown={(e) => !maximized && dragControls.start(e)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 shrink-0",
                "bg-gradient-to-r from-orange-500 to-amber-500",
                !maximized && "cursor-grab active:cursor-grabbing"
              )}
            >
              <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-none">Learnly AI</p>
                <p className="text-orange-100 text-xs mt-0.5 capitalize">{role} assistant</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMax((p) => !p)}
                  className="h-7 w-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                  aria-label={maximized ? "Minimize" : "Maximize"}
                >
                  {maximized
                    ? <Minimize2 className="h-3.5 w-3.5 text-white" />
                    : <Maximize2 className="h-3.5 w-3.5 text-white" />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <Minus className="h-3.5 w-3.5 text-white" />
                </button>
                <button
                  onClick={() => { setOpen(false); }}
                  className="h-7 w-7 rounded-lg bg-white/15 hover:bg-red-400/60 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex gap-2 items-end", m.role === "user" && "flex-row-reverse")}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "h-7 w-7 rounded-xl flex items-center justify-center shrink-0 text-white",
                    m.role === "ai"
                      ? "bg-gradient-to-br from-orange-500 to-amber-500"
                      : "bg-gradient-to-br from-slate-500 to-slate-600"
                  )}>
                    {m.role === "ai" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  </div>

                  {/* Bubble */}
                  <div className={cn(
                    "max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                    m.role === "ai"
                      ? "bg-secondary/80 dark:bg-slate-800/80 text-foreground rounded-bl-sm"
                      : "bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-br-sm"
                  )}>
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex gap-2 items-end">
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="bg-secondary/80 dark:bg-slate-800/80 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        className="h-1.5 w-1.5 rounded-full bg-orange-400"
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick chips */}
            <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
              {CHIPS.map((c) => (
                <button
                  key={c.label}
                  onClick={() => sendMessage(c.q)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0",
                    "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
                    "border border-orange-200 dark:border-orange-800/40",
                    "hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                  )}
                >
                  <c.icon className="h-3 w-3" />
                  {c.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 pb-4 shrink-0">
              <div className="flex gap-2 items-center bg-secondary/60 dark:bg-slate-800/60 rounded-xl border border-border/60 px-3 py-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask me anything about Learnly…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || typing}
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center transition-all shrink-0",
                    input.trim() && !typing
                      ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm hover:shadow-orange-400/40 hover:scale-105"
                      : "bg-secondary text-muted-foreground cursor-not-allowed"
                  )}
                  aria-label="Send"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
