import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, CheckCircle2, Lock, Clock, FileText, Star, Users,
  ChevronLeft, ChevronRight, Download, BookOpen, Pencil, Plus,
  Trash2, Eye, EyeOff, GripVertical, Award, Settings, Zap,
  X, Volume2, VolumeX, Maximize, Minimize, SkipForward, SkipBack,
  Heart, Bookmark, BookmarkCheck, Share2,
  StickyNote, Save, RotateCcw, ThumbsUp, Lightbulb,
  AlignLeft, List, Target, ChevronDown, ChevronUp,
  GraduationCap, Globe, Twitter, PlayCircle, MessageSquare,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input as LInput } from "@/components/ui/input";
import {
  Dialog as LDialog,
  DialogContent as LDialogContent,
  DialogHeader as LDialogHeader,
  DialogTitle as LDialogTitle,
  DialogFooter as LDialogFooter,
} from "@/components/ui/dialog";
import { Label as LLabel } from "@/components/ui/label";
import { mockLessons, type Lesson, type Course } from "@/lib/mock-data";
import { useApp } from "@/context/app-context";
import { useQA } from "@/context/qa-context";
import { CourseQAPanel } from "@/components/qa/course-qa-panel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/lessons/$courseId")({
  head: () => ({ meta: [{ title: "Course Player — Learnly" }] }),
  component: LessonPage,
});

// ─── Module definition ────────────────────────────────────────────────────────
// Groups flat lessons into named modules for the accordion curriculum sidebar.
const MODULES = [
  { id: "m1", title: "Module 1: Getting Started",        lessonIds: ["l1", "l2"] },
  { id: "m2", title: "Module 2: Core React Concepts",    lessonIds: ["l3", "l4", "l5"] },
  { id: "m3", title: "Module 3: Advanced Patterns",      lessonIds: ["l6", "l7", "l8"] },
];

// ─── Type helpers ─────────────────────────────────────────────────────────────
const TYPE_CFG = {
  video:      { icon: Play,     label: "Video",      color: "text-primary",    bg: "bg-primary/10" },
  reading:    { icon: BookOpen, label: "Reading",    color: "text-amber-600",  bg: "bg-amber-500/10" },
  quiz:       { icon: Zap,      label: "Quiz",       color: "text-violet-600", bg: "bg-violet-500/10" },
  assignment: { icon: FileText, label: "Assignment", color: "text-emerald-600",bg: "bg-emerald-500/10" },
} as const;

function TypeBadge({ type }: { type: Lesson["type"] }) {
  const cfg = TYPE_CFG[type] ?? TYPE_CFG.video;
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide", cfg.bg, cfg.color)}>
      <Icon className="h-2.5 w-2.5" />{cfg.label}
    </span>
  );
}

// ─── Per-lesson meta (likes, saves, notes) ────────────────────────────────────
interface LessonMeta {
  liked: boolean;
  likes: number;
  saved: boolean;
  notes: string;
  notesSaved: boolean;
  noteSavedAt: string | null; // e.g. "04:23"
}

const LESSON_LIKES: Record<string, number> = {
  l1: 14, l2: 12, l3: 16, l4: 9, l5: 7, l6: 6, l7: 5, l8: 8,
};

function useLessonMeta(lessons: Lesson[]) {
  const [meta, setMeta] = useState<Record<string, LessonMeta>>(() =>
    Object.fromEntries(lessons.map((l) => [l.id, {
      liked: false,
      likes: LESSON_LIKES[l.id] ?? 5,
      saved: false,
      notes: l.id === "l3"
        ? "Key takeaways:\n- Hooks let you use state in functional components\n- useEffect runs after render\n- Always clean up side effects"
        : "",
      notesSaved: false,
      noteSavedAt: null,
    }]))
  );

  const toggleLike = useCallback((id: string) => {
    setMeta((p) => ({
      ...p,
      [id]: { ...p[id], liked: !p[id].liked, likes: p[id].liked ? p[id].likes - 1 : p[id].likes + 1 },
    }));
  }, []);

  const toggleSave = useCallback((id: string) => {
    setMeta((p) => ({ ...p, [id]: { ...p[id], saved: !p[id].saved } }));
  }, []);

  const updateNotes = useCallback((id: string, notes: string) => {
    setMeta((p) => ({ ...p, [id]: { ...p[id], notes, notesSaved: false } }));
  }, []);

  // saveNotes receives the current playback timestamp from the player
  const saveNotes = useCallback((id: string, timestamp: string) => {
    setMeta((p) => ({ ...p, [id]: { ...p[id], notesSaved: true, noteSavedAt: timestamp } }));
    toast.success(`Note saved at ${timestamp} ✓`);
  }, []);

  return { meta, toggleLike, toggleSave, updateNotes, saveNotes };
}

// ─── Premium Video Player ─────────────────────────────────────────────────────
// Exposes current playback time via a ref so the Notes panel can stamp it.
function VideoPlayer({
  lesson,
  onNext, onPrev, hasNext, hasPrev,
  onMarkComplete,
  progressRef,        // mutable ref parent can read
}: {
  lesson: Lesson;
  onNext: () => void; onPrev: () => void;
  hasNext: boolean;   hasPrev: boolean;
  onMarkComplete: () => void;
  progressRef: React.MutableRefObject<number>;
}) {
  const [playing,    setPlaying]    = useState(false);
  const [progress,   setProgress]   = useState(lesson.completed ? 100 : 0);
  const [muted,      setMuted]      = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [hovering,   setHovering]   = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep parent ref in sync
  useEffect(() => { progressRef.current = progress; }, [progress, progressRef]);

  // Simulate playback
  useEffect(() => {
    if (playing && progress < 100) {
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) { clearInterval(intervalRef.current!); setPlaying(false); return 100; }
          return Math.min(p + 0.4, 100);
        });
      }, 300);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, progress]);

  // Reset on lesson change
  useEffect(() => {
    setPlaying(false);
    setProgress(lesson.completed ? 100 : 0);
  }, [lesson.id, lesson.completed]);

  const formatTime = (pct: number) => {
    const [m, s] = lesson.duration.split(":").map(Number);
    const total   = m * 60 + (s ?? 0);
    const elapsed = Math.round((pct / 100) * total);
    return `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    setProgress(Math.round(pct));
  };

  return (
    <div
      className={cn(
        "group/player relative rounded-2xl overflow-hidden bg-black",
        "shadow-[0_20px_60px_-12px_rgba(0,0,0,0.5)] dark:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.8)]",
        fullscreen && "fixed inset-0 z-50 rounded-none"
      )}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* ── Thumbnail area ── */}
      <div className="relative aspect-video select-none">
        <img
          src={lesson.thumbnail}
          alt={lesson.title}
          className={cn(
            "w-full h-full object-cover transition-all duration-700",
            playing ? "brightness-50 scale-[1.02]" : "brightness-90"
          )}
        />

        {/* Gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

        {/* Top-left: lesson info */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <TypeBadge type={lesson.type} />
          <span className="text-[11px] font-bold bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
            {lesson.duration}
          </span>
        </div>

        {/* Top-right: completed badge */}
        {lesson.completed && !playing && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
          </div>
        )}

        {/* Center transport controls — always visible, scale up on hover */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center gap-5 transition-all duration-200",
          hovering || !playing ? "opacity-100" : "opacity-0"
        )}>
          {/* Prev */}
          <motion.button
            whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
            onClick={onPrev} disabled={!hasPrev}
            aria-label="Previous lesson"
            className="h-11 w-11 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 disabled:opacity-25 flex items-center justify-center transition"
          >
            <SkipBack className="h-5 w-5 text-white fill-white" />
          </motion.button>

          {/* Play/Pause */}
          <motion.button
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? "Pause" : "Play"}
            className="h-[72px] w-[72px] rounded-full bg-white/20 backdrop-blur-md ring-2 ring-white/40 hover:bg-white/30 flex items-center justify-center shadow-2xl transition"
          >
            <AnimatePresence mode="wait">
              {playing
                ? <motion.div key="pause" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}>
                    <Pause className="h-9 w-9 text-white fill-white" />
                  </motion.div>
                : <motion.div key="play" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}>
                    <Play className="h-9 w-9 text-white fill-white ml-1" />
                  </motion.div>
              }
            </AnimatePresence>
          </motion.button>

          {/* Next */}
          <motion.button
            whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
            onClick={onNext} disabled={!hasNext}
            aria-label="Next lesson"
            className="h-11 w-11 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 disabled:opacity-25 flex items-center justify-center transition"
          >
            <SkipForward className="h-5 w-5 text-white fill-white" />
          </motion.button>
        </div>

        {/* Playing status pulse */}
        {playing && (
          <div className="absolute bottom-16 left-4 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-white/70 text-[11px] font-semibold">LIVE</span>
          </div>
        )}
      </div>

      {/* ── Controls bar ── */}
      <div className="bg-black/95 backdrop-blur-sm px-5 py-3 space-y-2.5">
        {/* Seekbar */}
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-[11px] tabular-nums w-10 text-right shrink-0">
            {formatTime(progress)}
          </span>
          <div
            role="slider"
            aria-label="Seek"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="flex-1 h-2 bg-white/15 rounded-full overflow-visible cursor-pointer group/seek relative"
            onClick={handleSeek}
          >
            {/* Fill */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white shadow-lg opacity-0 group-hover/seek:opacity-100 transition-opacity -translate-x-1/2"
              style={{ left: `${progress}%` }}
            />
          </div>
          <span className="text-white/50 text-[11px] tabular-nums w-10 shrink-0">
            {lesson.duration}
          </span>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMuted((v) => !v)}
              aria-label={muted ? "Unmute" : "Mute"}
              className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            >
              {muted ? <VolumeX className="h-4 w-4 text-white/70" /> : <Volume2 className="h-4 w-4 text-white/70" />}
            </button>
            <span className="text-white/40 text-xs">
              {playing ? "Playing…" : progress > 0 ? "Paused" : "Ready to play"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mark complete — appears when ≥95% watched and not yet complete */}
            <AnimatePresence>
              {progress >= 95 && !lesson.completed && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 10 }}
                  onClick={onMarkComplete}
                  className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark complete
                </motion.button>
              )}
            </AnimatePresence>

            <button
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            >
              {fullscreen
                ? <Minimize className="h-4 w-4 text-white/70" />
                : <Maximize className="h-4 w-4 text-white/70" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Notes Panel (with timestamp save) ───────────────────────────────────────
function NotesPanel({
  lessonId, lesson, meta, onUpdate, onSave, getTimestamp,
}: {
  lessonId: string;
  lesson: Lesson;
  meta: LessonMeta;
  onUpdate: (id: string, notes: string) => void;
  onSave: (id: string, timestamp: string) => void;
  getTimestamp: () => string;  // reads current playback time from player
}) {
  const [showTips, setShowTips] = useState(false);
  const wordCount = meta.notes.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <StickyNote className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">My Notes</p>
            <p className="text-xs text-muted-foreground mt-0.5">{wordCount} words · {lesson.title}</p>
          </div>
        </div>
        <button
          onClick={() => setShowTips((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-secondary"
        >
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          Tips
          {showTips ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Timestamp banner — shown after first save */}
      {meta.noteSavedAt && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-700 dark:text-emerald-300"
        >
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Last saved at <strong>{meta.noteSavedAt}</strong>
        </motion.div>
      )}

      {/* Tips panel */}
      <AnimatePresence>
        {showTips && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 space-y-1.5">
              {[
                "Summarize key concepts in your own words",
                "Use timestamps to bookmark important moments",
                "Write questions to research later",
                "List action items and practice exercises",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <Lightbulb className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
                  {tip}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Textarea */}
      <Textarea
        value={meta.notes}
        onChange={(e) => onUpdate(lessonId, e.target.value)}
        placeholder={`Take notes for this lesson…\n\nTry:\n• Key concepts at this timestamp\n• Questions to follow up\n• Action items`}
        className="min-h-[220px] font-mono text-sm resize-none rounded-xl border-border/60 focus:border-primary/40 bg-secondary/20 leading-relaxed"
      />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => onSave(lessonId, getTimestamp())}
          className={cn(
            "gap-1.5 flex-1 h-9",
            meta.notesSaved
              ? "bg-emerald-500 hover:bg-emerald-600 text-white border-0"
              : "gradient-primary text-white border-0 shadow-[0_4px_12px_-2px] shadow-primary/40"
          )}
        >
          {meta.notesSaved
            ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved</>
            : <><Save className="h-3.5 w-3.5" /> Save note</>
          }
        </Button>
        <Button
          size="sm" variant="outline"
          onClick={() => { onUpdate(lessonId, ""); toast.info("Notes cleared."); }}
          className="gap-1.5 h-9"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Clear
        </Button>
      </div>
    </div>
  );
}

// ─── About / Overview panel ───────────────────────────────────────────────────
function AboutPanel({ lesson, course }: { lesson: Lesson; course: Course | undefined }) {
  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <AlignLeft className="h-4 w-4 text-primary" /> About this lesson
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{lesson.description}</p>
      </div>

      {/* Learning objectives */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Learning objectives
        </h3>
        <ul className="space-y-2">
          {[
            "Understand the core concepts covered in this lesson",
            "Apply the techniques through hands-on practical examples",
            "Solve real-world problems using what you've learned",
            "Build a strong foundation for the next lesson",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Instructor card */}
      {course && (
        <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" /> Your instructor
          </h3>
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white text-lg font-black shrink-0 shadow-[0_4px_16px_-4px] shadow-primary/40">
              {course.instructor.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{course.instructor}</p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{course.category} Expert · {course.level} Level</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{course.students} students</span>
                <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />{course.rating}</span>
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{course.lessons} lessons</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {course.description}
          </p>
          <div className="flex gap-2">
            <button onClick={() => toast.info("Instructor profile coming soon.")}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
              <Globe className="h-3.5 w-3.5" /> View profile
            </button>
          </div>
        </div>
      )}

      {/* Resources */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          Resources
          {lesson.resources.length > 0 && (
            <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
              {lesson.resources.length}
            </span>
          )}
        </h3>
        {lesson.resources.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No resources for this lesson.</p>
        ) : (
          <div className="space-y-2">
            {lesson.resources.map((r) => {
              const iconMap: Record<string, string> = { pdf: "📄", zip: "🗜️", doc: "📝" };
              return (
                <div key={r.name}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-background hover:bg-secondary/50 hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => toast.info("Download available in production.")}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 text-base">
                      {iconMap[r.type] ?? "📎"}
                    </div>
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.size} · {r.type.toUpperCase()}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Curriculum Sidebar (accordion modules + lesson rows) ─────────────────────
function CurriculumSidebar({
  lessons,
  activeId,
  onSelect,
  completedCount,
  course,
}: {
  lessons: Lesson[];
  activeId: string;
  onSelect: (id: string) => void;
  completedCount: number;
  course: Course | undefined;
}) {
  // Keep all modules open by default; user can collapse individually
  const [openModules, setOpenModules] = useState<Set<string>>(
    () => new Set(MODULES.map((m) => m.id))
  );

  const toggleModule = (mid: string) =>
    setOpenModules((prev) => {
      const next = new Set(prev);
      next.has(mid) ? next.delete(mid) : next.add(mid);
      return next;
    });

  const progressPct = Math.round((completedCount / Math.max(lessons.length, 1)) * 100);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header: course name + progress ── */}
      <div className="px-4 pt-4 pb-3 border-b border-border/60 space-y-3 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Course content</p>
            <p className="text-sm font-bold leading-snug line-clamp-2 text-foreground">{course?.title}</p>
          </div>
          <span className="shrink-0 text-lg font-black text-primary tabular-nums leading-none mt-0.5">
            {progressPct}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <Progress value={progressPct} className="h-2 rounded-full" />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{completedCount}/{lessons.length} lessons done</span>
            {progressPct === 100 && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <Award className="h-3 w-3" /> Certificate ready!
              </span>
            )}
          </div>
        </div>

        {/* Quick dot navigation */}
        <div className="flex gap-1 flex-wrap">
          {lessons.map((l) => (
            <button
              key={l.id}
              onClick={() => onSelect(l.id)}
              title={l.title}
              className={cn(
                "rounded-full transition-all duration-200",
                l.id === activeId
                  ? "w-5 h-2 bg-primary"
                  : l.completed
                  ? "w-2 h-2 bg-emerald-500"
                  : "w-2 h-2 bg-border hover:bg-primary/40"
              )}
            />
          ))}
        </div>
      </div>

      {/* ── Module accordions ── */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {MODULES.map((mod) => {
            const modLessons     = mod.lessonIds
              .map((id) => lessons.find((l) => l.id === id))
              .filter(Boolean) as Lesson[];
            const modCompleted   = modLessons.filter((l) => l.completed).length;
            const modIsOpen      = openModules.has(mod.id);
            const modHasActive   = modLessons.some((l) => l.id === activeId);

            if (modLessons.length === 0) return null;

            return (
              <div key={mod.id} className="mb-1">
                {/* Module header button */}
                <button
                  onClick={() => toggleModule(mod.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                    modHasActive
                      ? "bg-primary/5 hover:bg-primary/8"
                      : "hover:bg-secondary/50"
                  )}
                >
                  {/* Module icon */}
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black transition-colors",
                    modHasActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}>
                    {mod.id.replace("m", "")}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs font-bold truncate",
                      modHasActive ? "text-primary" : "text-foreground"
                    )}>
                      {mod.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {modCompleted}/{modLessons.length} completed
                    </p>
                  </div>

                  {/* Completion ring */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {modCompleted === modLessons.length ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-medium">{modCompleted}/{modLessons.length}</span>
                    )}
                    <motion.div
                      animate={{ rotate: modIsOpen ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  </div>
                </button>

                {/* Lesson rows inside module */}
                <AnimatePresence initial={false}>
                  {modIsOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-6 border-l-2 border-border/50 pl-3 pb-1 space-y-0.5">
                        {modLessons.map((l, li) => {
                          const isActive    = l.id === activeId;
                          const lessonNum   = `${mod.id.replace("m", "")}.${li + 1}`;

                          return (
                            <motion.button
                              key={l.id}
                              whileHover={{ x: 2 }}
                              onClick={() => onSelect(l.id)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group/lesson",
                                isActive
                                  ? "bg-primary/12 border border-primary/25 shadow-sm"
                                  : "hover:bg-secondary/60 border border-transparent"
                              )}
                            >
                              {/* Lesson status icon */}
                              <div className={cn(
                                "h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all",
                                l.completed
                                  ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                                  : isActive
                                  ? "bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.35)]"
                                  : "bg-secondary group-hover/lesson:bg-primary/20"
                              )}>
                                {l.completed ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                ) : isActive ? (
                                  <Play className="h-3 w-3 text-white fill-white ml-0.5" />
                                ) : (
                                  <Play className="h-3 w-3 text-muted-foreground group-hover/lesson:text-primary ml-0.5 transition-colors" />
                                )}
                              </div>

                              {/* Title + meta */}
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-muted-foreground font-medium mb-0.5 flex items-center gap-1.5">
                                  <span>{lessonNum}</span>
                                  <TypeBadge type={l.type} />
                                </p>
                                <p className={cn(
                                  "text-xs font-semibold leading-snug line-clamp-2",
                                  isActive ? "text-primary" : "text-foreground group-hover/lesson:text-primary transition-colors"
                                )}>
                                  {l.title}
                                </p>
                              </div>

                              {/* Duration */}
                              <span className={cn(
                                "text-[10px] shrink-0 tabular-nums",
                                isActive ? "text-primary font-semibold" : "text-muted-foreground"
                              )}>
                                {l.duration}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Teacher/Admin management view (unchanged) ───────────────────────────────
function LessonManagerView({
  course, lessons, setLessons,
}: {
  course: Course | undefined;
  lessons: Lesson[];
  setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
}) {
  const [addOpen, setAddOpen]           = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editTarget, setEditTarget]     = useState<Lesson | null>(null);
  const [newTitle, setNewTitle]         = useState("");
  const [newDuration, setNewDuration]   = useState("");
  const [newType, setNewType]           = useState<Lesson["type"]>("video");
  const [newDesc, setNewDesc]           = useState("");

  function handleAdd() {
    if (!newTitle.trim()) { toast.error("Title is required."); return; }
    const lesson: Lesson = {
      id: `l${Date.now()}`,
      order: lessons.length + 1,
      title: newTitle.trim(),
      duration: newDuration || "0:00",
      completed: false,
      type: newType,
      description: newDesc.trim(),
      thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop",
      resources: [],
    };
    setLessons((p) => [...p, lesson]);
    toast.success("Lesson added.");
    setNewTitle(""); setNewDuration(""); setNewDesc(""); setNewType("video");
    setAddOpen(false);
  }

  function handleEditSave() {
    if (!editTarget || !editTarget.title.trim()) { toast.error("Title is required."); return; }
    setLessons((p) => p.map((l) => l.id === editTarget.id ? editTarget : l));
    toast.success("Lesson updated.");
    setEditTarget(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-xs text-muted-foreground">
            <Link to="/courses" className="hover:text-foreground transition-colors">Courses</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">{course?.title}</span>
          </div>
          <h2 className="text-xl font-display font-bold">Manage Lessons</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{lessons.length} lessons · {course?.duration}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-3.5 w-3.5" />Settings
          </Button>
          <Button size="sm" className="gradient-primary text-white border-0 shadow-[0_4px_12px_-2px] shadow-primary/40 gap-1.5"
            onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />Add lesson
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-[260px_1fr] gap-4">
        <Card className="overflow-hidden border-border shadow-soft">
          <div className="relative aspect-video overflow-hidden">
            {course?.thumbnailImg
              ? <img src={course.thumbnailImg} alt={course?.title} className="w-full h-full object-cover" />
              : <div className={cn("w-full h-full bg-gradient-to-br", course?.thumbnail)} />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <Badge className="bg-white/20 backdrop-blur text-white border-white/30 text-[10px]">{course?.level}</Badge>
              <p className="text-white font-semibold text-sm mt-1 line-clamp-1">{course?.title}</p>
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Lessons",  value: lessons.length,   icon: BookOpen, color: "text-primary",    bg: "bg-primary/10" },
            { label: "Students", value: course?.students, icon: Users,    color: "text-sky-600",    bg: "bg-sky-500/10" },
            { label: "Rating",   value: course?.rating,   icon: Star,     color: "text-amber-600",  bg: "bg-amber-500/10" },
            { label: "Duration", value: course?.duration, icon: Clock,    color: "text-violet-600", bg: "bg-violet-500/10" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="p-4 border-border shadow-soft flex items-center gap-3">
              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", bg, color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-base font-bold font-display leading-none">{value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-border shadow-soft overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <p className="text-sm font-semibold">Lessons</p>
          <p className="text-xs text-muted-foreground">{lessons.length} total</p>
        </div>
        <div className="divide-y divide-border">
          {lessons.map((l, i) => (
            <div key={l.id} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/30 transition-colors group">
              <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0 cursor-grab" />
              <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                <img src={l.thumbnail} alt={l.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Play className="h-4 w-4 text-white fill-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground">#{i + 1}</span>
                  <TypeBadge type={l.type} />
                </div>
                <p className="text-sm font-semibold truncate">{l.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{l.description}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{l.duration}</span>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditTarget({ ...l })}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => { setLessons((p) => p.map((x) => x.id === l.id ? { ...x, completed: !x.completed } : x)); toast.success("Toggled."); }}>
                  {l.completed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => { setLessons((p) => p.filter((x) => x.id !== l.id)); toast.success("Removed."); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Add dialog */}
      <LDialog open={addOpen} onOpenChange={setAddOpen}>
        <LDialogContent className="max-w-md">
          <LDialogHeader><LDialogTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4 text-primary" /> Add lesson</LDialogTitle></LDialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><LLabel className="text-xs">Title *</LLabel><LInput value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Introduction to Hooks" className="h-10" autoFocus /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><LLabel className="text-xs">Duration</LLabel><LInput value={newDuration} onChange={(e) => setNewDuration(e.target.value)} placeholder="12:30" className="h-10" /></div>
              <div className="space-y-1.5"><LLabel className="text-xs">Type</LLabel>
                <select value={newType} onChange={(e) => setNewType(e.target.value as Lesson["type"])} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="video">Video</option><option value="reading">Reading</option><option value="quiz">Quiz</option><option value="assignment">Assignment</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5"><LLabel className="text-xs">Description</LLabel><Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Brief description…" className="min-h-[70px] resize-none text-sm" /></div>
          </div>
          <LDialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" className="gradient-primary text-white border-0" onClick={handleAdd}>Add lesson</Button>
          </LDialogFooter>
        </LDialogContent>
      </LDialog>

      {/* Edit dialog */}
      <LDialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)}>
        <LDialogContent className="max-w-md">
          <LDialogHeader><LDialogTitle className="flex items-center gap-2 text-base"><Pencil className="h-4 w-4 text-primary" /> Edit lesson</LDialogTitle></LDialogHeader>
          {editTarget && (
            <div className="space-y-3 py-2">
              <div className="space-y-1.5"><LLabel className="text-xs">Title *</LLabel><LInput value={editTarget.title} onChange={(e) => setEditTarget({ ...editTarget, title: e.target.value })} className="h-10" autoFocus /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><LLabel className="text-xs">Duration</LLabel><LInput value={editTarget.duration} onChange={(e) => setEditTarget({ ...editTarget, duration: e.target.value })} className="h-10" /></div>
                <div className="space-y-1.5"><LLabel className="text-xs">Type</LLabel>
                  <select value={editTarget.type} onChange={(e) => setEditTarget({ ...editTarget, type: e.target.value as Lesson["type"] })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="video">Video</option><option value="reading">Reading</option><option value="quiz">Quiz</option><option value="assignment">Assignment</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5"><LLabel className="text-xs">Description</LLabel><Textarea value={editTarget.description} onChange={(e) => setEditTarget({ ...editTarget, description: e.target.value })} className="min-h-[70px] resize-none text-sm" /></div>
            </div>
          )}
          <LDialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button size="sm" className="gradient-primary text-white border-0" onClick={handleEditSave}>Save changes</Button>
          </LDialogFooter>
        </LDialogContent>
      </LDialog>

      {/* Settings dialog */}
      <LDialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <LDialogContent className="max-w-sm">
          <LDialogHeader><LDialogTitle className="flex items-center gap-2 text-base"><Settings className="h-4 w-4 text-primary" /> Course settings</LDialogTitle></LDialogHeader>
          <div className="space-y-3 py-2 text-sm text-muted-foreground">
            <p>Course: <span className="font-medium text-foreground">{course?.title}</span></p>
            <p>Level: <span className="font-medium text-foreground">{course?.level}</span></p>
            <p>Students enrolled: <span className="font-medium text-foreground">{course?.students}</span></p>
            <p>Rating: <span className="font-medium text-foreground">{course?.rating} ★</span></p>
            <p className="text-xs pt-1">Full course settings are managed from the Courses page.</p>
          </div>
          <LDialogFooter><Button variant="outline" size="sm" onClick={() => setSettingsOpen(false)}>Close</Button></LDialogFooter>
        </LDialogContent>
      </LDialog>
    </div>
  );
}

// ─── Main LessonPage ─────────────────────────────────────────────────────────
function LessonPage() {
  const { courseId }  = Route.useParams();
  const { courses, role, currentUser } = useApp();
  const qaCtx         = useQA();
  const course        = courses.find((c) => c.id === courseId) ?? courses[0];
  const [lessons, setLessons] = useState<Lesson[]>(mockLessons);
  const [activeId, setActiveId] = useState(
    () => mockLessons.find((l) => !l.completed)?.id ?? mockLessons[0].id
  );
  const [curriculumOpen, setCurriculumOpen] = useState(true);

  // Ref that VideoPlayer writes its progress into — Notes panel reads this
  const playerProgressRef = useRef<number>(0);

  const { meta, toggleLike, toggleSave, updateNotes, saveNotes } = useLessonMeta(lessons);

  const activeLesson   = lessons.find((l) => l.id === activeId) ?? lessons[0];
  const activeIdx      = lessons.findIndex((l) => l.id === activeId);
  const prevLesson     = activeIdx > 0 ? lessons[activeIdx - 1] : null;
  const nextLesson     = activeIdx < lessons.length - 1 ? lessons[activeIdx + 1] : null;
  const completedCount = lessons.filter((l) => l.completed).length;

  const markComplete = useCallback((id: string) => {
    setLessons((p) => p.map((l) => l.id === id ? { ...l, completed: true } : l));
    toast.success("🎉 Lesson completed!");
    const idx = lessons.findIndex((l) => l.id === id);
    if (idx < lessons.length - 1) {
      setTimeout(() => setActiveId(lessons[idx + 1].id), 700);
    }
  }, [lessons]);

  // Derive current playback timestamp string from the player progress ref
  const getTimestamp = useCallback((): string => {
    const [m, s] = activeLesson.duration.split(":").map(Number);
    const total   = m * 60 + (s ?? 0);
    const elapsed = Math.round((playerProgressRef.current / 100) * total);
    return `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  }, [activeLesson.duration]);

  // ── Locked gate (student can't access premium content) ──────────────────
  if (course?.locked && role === "student") {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto pt-8">
          <Card className="overflow-hidden border-border shadow-soft">
            <div className="relative h-52 overflow-hidden">
              {course.thumbnailImg
                ? <img src={course.thumbnailImg} alt={course.title} className="w-full h-full object-cover" />
                : <div className={cn("w-full h-full bg-gradient-to-br", course.thumbnail)} />}
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-white/15 backdrop-blur ring-2 ring-white/30 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <div className="p-6 text-center space-y-4">
              <h2 className="text-xl font-display font-bold">{course.title}</h2>
              <p className="text-sm text-muted-foreground">This course requires enrollment. Enroll now to unlock all lessons.</p>
              <Button asChild className="gradient-primary text-white border-0 w-full shadow-[0_4px_16px_-4px] shadow-primary/40">
                <Link to={`/payment/${course.id}` as any}>Enroll · ${course.price}</Link>
              </Button>
              <Link to="/courses" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back to courses
              </Link>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // ── Teacher / Admin management view ─────────────────────────────────────
  if (role === "teacher" || role === "admin" || role === "super_admin") {
    return (
      <AppLayout>
        <LessonManagerView course={course} lessons={lessons} setLessons={setLessons} />
      </AppLayout>
    );
  }

  // ── Student: immersive two-column course player ──────────────────────────
  return (
    <AppLayout>
      <div className="flex flex-col gap-0 -mx-4 -my-5 sm:-mx-6 sm:-my-6 lg:-mx-8 lg:-my-8">

        {/* ── Top nav bar (breadcrumb + toggle) ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 border-b border-border/60 bg-background/80 backdrop-blur-sm shrink-0 z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <Link to="/courses" className="hover:text-foreground transition-colors shrink-0">Courses</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="font-medium text-foreground truncate max-w-[140px] sm:max-w-[240px]">
              {course?.title}
            </span>
            <ChevronRight className="h-3 w-3 shrink-0 hidden sm:block" />
            <span className="text-primary font-medium truncate max-w-[120px] hidden sm:block">
              {activeLesson.title}
            </span>
          </div>

          {/* Curriculum toggle (visible on all sizes) */}
          <button
            onClick={() => setCurriculumOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all",
              curriculumOpen
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{curriculumOpen ? "Hide" : "Show"} curriculum</span>
          </button>
        </div>

        {/* ── Two-column player layout ── */}
        <div className={cn(
          "flex flex-col lg:flex-row flex-1 min-h-0 transition-all duration-300",
        )}>
          {/* ── LEFT COLUMN (70%) — video player + tabs ── */}
          <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

            {/* ── Video Player ── */}
            <VideoPlayer
              lesson={activeLesson}
              onNext={() => nextLesson && setActiveId(nextLesson.id)}
              onPrev={() => prevLesson && setActiveId(prevLesson.id)}
              hasNext={!!nextLesson}
              hasPrev={!!prevLesson}
              onMarkComplete={() => markComplete(activeLesson.id)}
              progressRef={playerProgressRef}
            />

            {/* ── Lesson title + interaction bar ── */}
            <div className="space-y-3">
              {/* Title row */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <TypeBadge type={activeLesson.type} />
                    <span className="text-xs text-muted-foreground">
                      Lesson {activeLesson.order} of {lessons.length}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-display font-bold leading-snug">
                    {activeLesson.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />{activeLesson.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />{course?.students?.toLocaleString()} students
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />{course?.rating}
                    </span>
                    <span>by <strong className="text-foreground">{course?.instructor}</strong></span>
                  </div>
                </div>
                {!activeLesson.completed && (
                  <Button
                    size="sm"
                    className="gradient-primary text-white border-0 shadow-[0_4px_12px_-2px] shadow-primary/40 gap-1.5 shrink-0"
                    onClick={() => markComplete(activeLesson.id)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark complete
                  </Button>
                )}
              </div>

              {/* Like / Save / Share */}
              <div className="flex items-center gap-2 py-3 border-y border-border/60">
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => toggleLike(activeLesson.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                    meta[activeLesson.id]?.liked
                      ? "bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-800/40"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground border border-border/60"
                  )}>
                  <motion.div animate={meta[activeLesson.id]?.liked ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
                    <Heart className={cn("h-4 w-4", meta[activeLesson.id]?.liked && "fill-red-500 text-red-500")} />
                  </motion.div>
                  <span>{meta[activeLesson.id]?.likes}</span>
                </motion.button>

                <motion.button whileTap={{ scale: 0.85 }} onClick={() => toggleSave(activeLesson.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                    meta[activeLesson.id]?.saved
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground border border-border/60"
                  )}>
                  {meta[activeLesson.id]?.saved
                    ? <BookmarkCheck className="h-4 w-4 fill-primary text-primary" />
                    : <Bookmark className="h-4 w-4" />}
                  <span>{meta[activeLesson.id]?.saved ? "Saved" : "Save"}</span>
                </motion.button>

                <button
                  onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied!"); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-secondary/60 text-muted-foreground hover:text-foreground border border-border/60 transition-all"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{Math.round((meta[activeLesson.id]?.likes ?? 5) * 0.85 + 10)} found helpful</span>
                </div>
              </div>

              {/* Prev / Next */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" className="h-10 gap-1.5 justify-start rounded-xl text-xs"
                  disabled={!prevLesson} onClick={() => prevLesson && setActiveId(prevLesson.id)}>
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  <span className="truncate">{prevLesson?.title ?? "Previous"}</span>
                </Button>
                <Button size="sm"
                  className="h-10 gap-1.5 justify-end rounded-xl gradient-primary text-white border-0 shadow-[0_4px_12px_-2px] shadow-primary/40 text-xs"
                  disabled={!nextLesson} onClick={() => nextLesson && setActiveId(nextLesson.id)}>
                  <span className="truncate">{nextLesson?.title ?? "Next"}</span>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </Button>
              </div>
            </div>

            {/* ── Tabbed panel: About + Notes + Q&A ── */}
            <Card className="border-border/60 shadow-soft overflow-hidden">
              {/* Top accent stripe */}
              <div className="h-0.5 w-full bg-gradient-to-r from-primary via-orange-400 to-primary/20" />

              <Tabs defaultValue="about" className="p-5">
                <TabsList className="w-full grid grid-cols-3 h-10 mb-5">
                  <TabsTrigger value="about" className="gap-2 text-sm">
                    <BookOpen className="h-4 w-4" /> About
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-2 text-sm">
                    <StickyNote className="h-4 w-4" />
                    Notes
                    {meta[activeLesson.id]?.notes && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="qa" className="gap-2 text-sm">
                    <MessageSquare className="h-4 w-4" />
                    Q&amp;A
                    {/* Live unread indicator */}
                    {(() => {
                      const courseQs = course
                        ? qaCtx.getVisibleQuestions(role, currentUser?.id?.toString() ?? "", course.id)
                        : [];
                      const open = courseQs.filter((q) => q.state === "open").length;
                      return open > 0 ? (
                        <span className="ml-0.5 h-4 min-w-4 px-1 rounded-full bg-sky-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {open}
                        </span>
                      ) : null;
                    })()}
                  </TabsTrigger>
                </TabsList>

                {/* About / Overview */}
                <TabsContent value="about">
                  <AboutPanel lesson={activeLesson} course={course} />
                </TabsContent>

                {/* Notes with timestamp */}
                <TabsContent value="notes">
                  <NotesPanel
                    lessonId={activeLesson.id}
                    lesson={activeLesson}
                    meta={meta[activeLesson.id]}
                    onUpdate={updateNotes}
                    onSave={saveNotes}
                    getTimestamp={getTimestamp}
                  />
                </TabsContent>

                {/* Q&A forum */}
                <TabsContent value="qa">
                  {course ? (
                    <CourseQAPanel
                      courseId={course.id}
                      courseTitle={course.title}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                      <MessageSquare className="h-8 w-8 opacity-20" />
                      <p className="text-sm">Course information unavailable.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* ── RIGHT COLUMN (30%) — sticky curriculum sidebar ── */}
          <AnimatePresence>
            {curriculumOpen && (
              <motion.aside
                key="curriculum"
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 32 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                  "shrink-0 border-l border-border/60 bg-background",
                  "lg:w-[340px] xl:w-[360px]",
                  // On mobile sits below; on lg+ becomes sticky full-height column
                  "lg:sticky lg:top-0 lg:h-[calc(100vh-4rem)] flex flex-col",
                )}
              >
                <CurriculumSidebar
                  lessons={lessons}
                  activeId={activeId}
                  onSelect={(id) => {
                    setActiveId(id);
                    // On mobile, close the panel after selecting
                    if (window.innerWidth < 1024) setCurriculumOpen(false);
                  }}
                  completedCount={completedCount}
                  course={course}
                />
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
