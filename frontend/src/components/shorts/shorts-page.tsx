/**
 * ShortsPage — Premium TikTok-style educational shorts feed
 * - Full-screen vertical swipe, one short per screen
 * - Light/dark mode adaptive backgrounds
 * - Like/Save for students only, no comments
 * - Admin: upload, edit, delete
 * - Smooth Framer Motion animations
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Bookmark, BookmarkCheck, Eye, Play, X, Upload,
  ChevronUp, ChevronDown, Zap, BookOpen, Tag, GraduationCap,
  Trash2, EyeOff, TrendingUp, BarChart2, Pencil, Check,
  Share2, Volume2, VolumeX, MoreVertical,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mockShorts, mockCourses, type Short } from "@/lib/mock-data";
import { useApp } from "@/context/app-context";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmt(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000 ? `${(n / 1000).toFixed(1)}k`
    : String(n);
}

const CATEGORY_COLORS: Record<string, string> = {
  Development: "from-emerald-500 to-teal-600",
  Design:      "from-sky-500 to-indigo-600",
  Data:        "from-amber-500 to-orange-600",
  Marketing:   "from-rose-500 to-pink-600",
  Business:    "from-violet-500 to-purple-600",
};

// ---------------------------------------------------------------------------
// Upload / Edit modal (admin only)
// ---------------------------------------------------------------------------
function UploadModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Short>;
  onSave: (s: Omit<Short, "id" | "likes" | "views" | "created_at">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title:              initial?.title ?? "",
    description:        initial?.description ?? "",
    category:           initial?.category ?? "Development",
    duration:           initial?.duration ?? "1:00",
    course_id:          initial?.course_id ?? "c1",
    course_title:       initial?.course_title ?? "Modern Web Development",
    teacher_name:       initial?.teacher_name ?? "",
    teacher_avatar:     initial?.teacher_avatar ?? "",
    thumbnail_img:      initial?.thumbnail_img ?? "",
    thumbnail_gradient: initial?.thumbnail_gradient ?? "from-emerald-500 to-teal-700",
    video_url:          initial?.video_url ?? "",
    tags:               initial?.tags?.join(", ") ?? "",
    is_published:       initial?.is_published ?? false,
  });

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.video_url.trim()) {
      toast.error("Title and video URL are required.");
      return;
    }
    onSave({ ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="bg-background rounded-2xl shadow-2xl w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <h2 className="font-display font-bold text-lg">{initial?.id ? "Edit Short" : "Upload Short"}</h2>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)}
              placeholder="What is the Virtual DOM?" className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={3} placeholder="Short description…" className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40">
                {["Development","Design","Data","Marketing","Business"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Duration</label>
              <input value={form.duration} onChange={(e) => set("duration", e.target.value)}
                placeholder="1:30" className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Video URL (YouTube embed) *</label>
            <input value={form.video_url} onChange={(e) => set("video_url", e.target.value)}
              placeholder="https://www.youtube-nocookie.com/embed/..." className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Thumbnail Image URL</label>
            <input value={form.thumbnail_img} onChange={(e) => set("thumbnail_img", e.target.value)}
              placeholder="https://images.unsplash.com/..." className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tags (comma-separated)</label>
            <input value={form.tags} onChange={(e) => set("tags", e.target.value)}
              placeholder="react, hooks, state" className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => set("is_published", !form.is_published)}
              className={cn("h-5 w-9 rounded-full transition-colors relative", form.is_published ? "bg-primary" : "bg-border")}>
              <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", form.is_published ? "translate-x-4" : "translate-x-0.5")} />
            </div>
            <span className="text-sm font-medium">Publish immediately</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 gradient-primary text-white border-0">
              <Check className="h-4 w-4 mr-1" /> {initial?.id ? "Save changes" : "Upload"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirm
// ---------------------------------------------------------------------------
function DeleteConfirm({ title, onConfirm, onClose }: { title: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-background rounded-2xl shadow-2xl w-full max-w-sm border border-border p-6 text-center space-y-4"
      >
        <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
          <Trash2 className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">Delete Short</h3>
          <p className="text-sm text-muted-foreground mt-1">Remove <span className="font-semibold text-foreground">"{title}"</span>? This cannot be undone.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0" onClick={onConfirm}>Delete</Button>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ShortCard — full-screen immersive card
// ---------------------------------------------------------------------------
function ShortCard({
  short, isActive, isStudent, isAdmin,
  onNext, onPrev, hasPrev, hasNext,
  onDelete, onTogglePublish, onEdit,
}: {
  short: Short;
  isActive: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  onNext: () => void;
  onPrev: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string) => void;
  onEdit: (s: Short) => void;
}) {
  const [liked,     setLiked]     = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [likes,     setLikes]     = useState(short.likes);
  const [playing,   setPlaying]   = useState(false);
  const [muted,     setMuted]     = useState(false);
  const [showDesc,  setShowDesc]  = useState(false);
  const [showMenu,  setShowMenu]  = useState(false);
  const [delConfirm,setDelConfirm]= useState(false);

  useEffect(() => {
    if (!isActive) { setPlaying(false); setShowDesc(false); setShowMenu(false); }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") onNext();
      if (e.key === "ArrowUp")   onPrev();
      if (e.key === " ")         { e.preventDefault(); setPlaying((v) => !v); }
      if (e.key === "Escape")    { setPlaying(false); setShowMenu(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isActive, onNext, onPrev]);

  const handleLike = () => {
    setLiked((v) => !v);
    setLikes((n) => liked ? n - 1 : n + 1);
  };

  const catGradient = CATEGORY_COLORS[short.category] ?? "from-slate-500 to-slate-700";
  const relatedCourse = mockCourses.find((c) => c.id === short.course_id);

  // Build iframe src with mute param
  const iframeSrc = short.video_url.includes("?")
    ? `${short.video_url}&mute=${muted ? 1 : 0}`
    : `${short.video_url}?autoplay=1&mute=${muted ? 1 : 0}&controls=1&rel=0`;

  return (
    <>
      <div className="relative w-full h-full flex items-center justify-center select-none">

        {/* ── Phone-shaped card ── */}
        <div className="relative w-full max-w-[400px] mx-auto h-full max-h-[calc(100vh-10rem)] rounded-3xl overflow-hidden shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] dark:shadow-[0_32px_80px_-12px_rgba(0,0,0,0.8)]">

          {/* Background: thumbnail or gradient */}
          <div className={cn("absolute inset-0 bg-gradient-to-br", catGradient)} />
          {short.thumbnail_img && (
            <img src={short.thumbnail_img} alt={short.title}
              className="absolute inset-0 w-full h-full object-cover" />
          )}

          {/* Cinematic overlay — adaptive for light/dark */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 dark:from-black/95 dark:via-black/30 dark:to-black/50" />

          {/* YouTube iframe */}
          {playing && (
            <iframe
              src={iframeSrc}
              className="absolute inset-0 w-full h-full z-10"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={short.title}
            />
          )}

          {/* Play button */}
          {!playing && (
            <button onClick={() => setPlaying(true)} aria-label="Play"
              className="absolute inset-0 flex items-center justify-center z-10 group">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="h-20 w-20 rounded-full bg-white/15 backdrop-blur-md ring-2 ring-white/30 flex items-center justify-center shadow-2xl group-hover:bg-white/25 transition-colors"
              >
                <Play className="h-9 w-9 text-white fill-white ml-1.5" />
              </motion.div>
            </button>
          )}

          {/* Stop + mute controls when playing */}
          {playing && (
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <button onClick={() => setMuted((v) => !v)}
                className="h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition">
                {muted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
              </button>
              <button onClick={() => setPlaying(false)}
                className="h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          )}

          {/* Top-left: category + draft badge */}
          {!playing && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className={cn(
                "text-[11px] font-bold px-2.5 py-1 rounded-full text-white backdrop-blur-sm",
                "bg-gradient-to-r shadow-lg",
                catGradient
              )}>
                {short.category}
              </span>
              {!short.is_published && (isAdmin || !isStudent) && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/80 backdrop-blur-sm text-white">
                  Draft
                </span>
              )}
            </div>
          )}

          {/* Top-right: duration */}
          {!playing && (
            <div className="absolute top-4 right-4 z-10">
              <span className="text-[11px] font-bold bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
                {short.duration}
              </span>
            </div>
          )}

          {/* Bottom info */}
          {!playing && (
            <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-6 pt-16">
              {/* Teacher row */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ring-2 ring-white/30",
                  "bg-gradient-to-br", catGradient
                )}>
                  {short.teacher_avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold leading-none">{short.teacher_name}</p>
                  <p className="text-white/50 text-[10px] mt-0.5 truncate">{short.course_title}</p>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-white font-display font-bold text-lg leading-snug mb-2 drop-shadow-sm">
                {short.title}
              </h2>

              {/* Description — expandable */}
              <button onClick={(e) => { e.stopPropagation(); setShowDesc((v) => !v); }} className="text-left w-full mb-2">
                <p className={cn("text-white/70 text-xs leading-relaxed", !showDesc && "line-clamp-2")}>
                  {short.description}
                </p>
                {!showDesc && short.description.length > 80 && (
                  <span className="text-white/40 text-xs">more</span>
                )}
              </button>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {short.tags.map((t) => (
                  <span key={t} className="text-white/40 text-[11px] hover:text-white/70 transition-colors cursor-pointer">
                    #{t}
                  </span>
                ))}
              </div>

              {/* Course link */}
              {relatedCourse && (
                <Link to="/courses" className="mt-3 flex items-center gap-2 w-fit">
                  <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 hover:bg-white/20 transition-colors border border-white/10">
                    <BookOpen className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-white/80 text-[11px] font-medium truncate max-w-[180px]">{relatedCourse.title}</span>
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Right action rail ── */}
        <div className="absolute right-2 sm:right-4 bottom-[12%] sm:bottom-[15%] flex flex-col items-center gap-3 sm:gap-5 z-20">

          {/* Like — students only */}
          {isStudent && (
            <motion.button onClick={handleLike} whileTap={{ scale: 0.85 }} className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={liked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-lg",
                  liked
                    ? "bg-red-500 shadow-red-500/40 shadow-[0_0_20px_4px]"
                    : "bg-black/50 backdrop-blur-sm hover:bg-black/70 dark:bg-white/20 dark:hover:bg-white/30"
                )}
              >
                <Heart className={cn("h-5 w-5 text-white transition-all", liked && "fill-white")} />
              </motion.div>
              <span className="text-white text-xs font-bold drop-shadow-lg">{fmt(likes)}</span>
            </motion.button>
          )}

          {/* Save — students only */}
          {isStudent && (
            <motion.button onClick={() => setSaved((v) => !v)} whileTap={{ scale: 0.85 }} className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-lg",
                saved
                  ? "bg-primary shadow-primary/40 shadow-[0_0_20px_4px]"
                  : "bg-black/50 backdrop-blur-sm hover:bg-black/70 dark:bg-white/20 dark:hover:bg-white/30"
              )}>
                {saved
                  ? <BookmarkCheck className="h-5 w-5 text-white fill-white" />
                  : <Bookmark className="h-5 w-5 text-white" />}
              </div>
              <span className="text-white text-xs font-bold drop-shadow-lg">{saved ? "Saved" : "Save"}</span>
            </motion.button>
          )}

          {/* Views — all roles */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-12 w-12 rounded-2xl bg-black/50 backdrop-blur-sm dark:bg-white/20 flex items-center justify-center shadow-lg">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <span className="text-white text-xs font-bold drop-shadow-lg">{fmt(short.views)}</span>
          </div>

          {/* Share — all roles */}
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => toast.info("Link copied!")} className="flex flex-col items-center gap-1.5">
            <div className="h-12 w-12 rounded-2xl bg-black/50 backdrop-blur-sm dark:bg-white/20 hover:bg-black/70 dark:hover:bg-white/30 flex items-center justify-center transition shadow-lg">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-white text-xs font-bold drop-shadow-lg">Share</span>
          </motion.button>

          {/* Admin: more menu */}
          {isAdmin && (
            <div className="relative">
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowMenu((v) => !v)} className="flex flex-col items-center gap-1.5">
                <div className="h-12 w-12 rounded-2xl bg-black/50 backdrop-blur-sm dark:bg-white/20 hover:bg-black/70 dark:hover:bg-white/30 flex items-center justify-center transition shadow-lg">
                  <MoreVertical className="h-5 w-5 text-white" />
                </div>
                <span className="text-white text-xs font-bold drop-shadow-lg">More</span>
              </motion.button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.85, x: 10 }}
                    className="absolute right-14 bottom-0 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden w-44 z-30"
                  >
                    <button onClick={() => { onEdit(short); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/60 transition-colors">
                      <Pencil className="h-4 w-4 text-primary" /> Edit short
                    </button>
                    <button onClick={() => { onTogglePublish(short.id); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/60 transition-colors">
                      <EyeOff className="h-4 w-4 text-amber-500" />
                      {short.is_published ? "Unpublish" : "Publish"}
                    </button>
                    <button onClick={() => { setDelConfirm(true); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── Up/Down nav arrows (desktop) ── */}
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 bottom-4 flex-col items-center gap-2 z-20">
          <motion.button onClick={onPrev} disabled={!hasPrev} whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }}
            className={cn("h-9 w-9 rounded-full backdrop-blur-sm flex items-center justify-center text-white transition-all",
              hasPrev ? "bg-white/15 hover:bg-white/30" : "opacity-20 cursor-not-allowed bg-white/10")}>
            <ChevronUp className="h-4 w-4" />
          </motion.button>
          <motion.button onClick={onNext} disabled={!hasNext} whileHover={{ y: 2 }} whileTap={{ scale: 0.9 }}
            className={cn("h-9 w-9 rounded-full backdrop-blur-sm flex items-center justify-center text-white transition-all",
              hasNext ? "bg-white/15 hover:bg-white/30" : "opacity-20 cursor-not-allowed bg-white/10")}>
            <ChevronDown className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {delConfirm && (
          <DeleteConfirm
            title={short.title}
            onConfirm={() => { onDelete(short.id); setDelConfirm(false); }}
            onClose={() => setDelConfirm(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main ShortsPage
// ---------------------------------------------------------------------------
export function ShortsPage() {
  const { role, courses } = useApp();
  const isStudent = role === "student";
  const isAdmin   = role === "admin";
  const canManage = role === "admin";

  const [shorts,    setShorts]    = useState<Short[]>(mockShorts);
  const [activeIdx, setActive]    = useState(0);
  const [filter,    setFilter]    = useState("all");
  const [uploadModal, setUpload]  = useState<Short | "new" | null>(null);

  const enrolledIds = new Set(
    courses.filter((c) => !c.locked && c.progress !== undefined).map((c) => c.id)
  );

  const categories = [
    "all",
    "my-courses",
    ...Array.from(new Set(mockShorts.map((s) => s.category))),
  ];

  const filtered = shorts.filter((s) => {
    if (isStudent && !s.is_published) return false;
    if (filter === "all") return true;
    if (filter === "my-courses") return enrolledIds.has(s.course_id);
    return s.category === filter;
  });

  const goNext = useCallback(() => setActive((i) => Math.min(i + 1, filtered.length - 1)), [filtered.length]);
  const goPrev = useCallback(() => setActive((i) => Math.max(i - 1, 0)), []);

  useEffect(() => { setActive(0); }, [filter]);

  // Touch swipe
  const touchY  = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchY.current = e.touches[0].clientY; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    const d = touchY.current - e.changedTouches[0].clientY;
    if (Math.abs(d) > 50) d > 0 ? goNext() : goPrev();
  };

  // Wheel scroll with debounce
  const wheelLock = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (wheelLock.current) return;
    if (e.deltaY > 30) goNext(); else if (e.deltaY < -30) goPrev();
    wheelLock.current = setTimeout(() => { wheelLock.current = null; }, 750);
  };

  const handleDelete = (id: string) => {
    setShorts((p) => p.filter((s) => s.id !== id));
    setActive((i) => Math.max(0, i - 1));
    toast.success("Short deleted.");
  };

  const handleTogglePublish = (id: string) => {
    setShorts((p) => p.map((s) => s.id === id ? { ...s, is_published: !s.is_published } : s));
    const s = shorts.find((x) => x.id === id);
    toast.success(s?.is_published ? "Short unpublished." : "Short published.");
  };

  const handleSaveShort = (data: Omit<Short, "id" | "likes" | "views" | "created_at">) => {
    if (uploadModal === "new") {
      const newShort: Short = {
        ...data,
        id: `sh${Date.now()}`,
        likes: 0,
        views: 0,
        created_at: new Date().toISOString().split("T")[0],
      };
      setShorts((p) => [newShort, ...p]);
      toast.success("Short uploaded!");
    } else if (uploadModal && typeof uploadModal === "object") {
      setShorts((p) => p.map((s) => s.id === uploadModal.id ? { ...s, ...data } : s));
      toast.success("Short updated.");
    }
    setUpload(null);
  };

  // Analytics
  const totalViews = shorts.reduce((s, x) => s + x.views, 0);
  const totalLikes = shorts.reduce((s, x) => s + x.likes, 0);
  const published  = shorts.filter((s) => s.is_published).length;

  // Related shorts (same course, not current)
  const relatedShorts = filtered
    .filter((s, i) => i !== activeIdx && s.course_id === filtered[activeIdx]?.course_id)
    .slice(0, 5);

  return (
    <>
      {/* Full-bleed container — overrides AppLayout padding */}
      <div
        className="flex flex-col -mx-4 -my-5 sm:-mx-6 sm:-my-6 lg:-mx-8 lg:-my-8 overflow-hidden"
        style={{ height: "calc(100vh - 4rem)" }}
      >
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border/60 bg-background/80 backdrop-blur-xl shrink-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center shadow-[0_4px_12px_-2px] shadow-primary/40">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-sm text-foreground">Learning Shorts</span>
              <span className="text-muted-foreground text-xs ml-2">{filtered.length} videos</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Analytics pill — admin/teacher */}
            {canManage && (
              <div className="hidden sm:flex items-center gap-3 bg-secondary/80 rounded-full px-3 py-1.5 text-muted-foreground text-[11px] border border-border/60">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{fmt(totalViews)}</span>
                <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{fmt(totalLikes)}</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><TrendingUp className="h-3 w-3" />{published} live</span>
              </div>
            )}

            {/* Upload — admin only */}
            {isAdmin && (
              <Button size="sm"
                className="gradient-primary text-white border-0 shadow-[0_4px_12px_-2px] shadow-primary/40 gap-1.5 h-8 text-xs"
                onClick={() => setUpload("new")}>
                <Upload className="h-3.5 w-3.5" /> Upload
              </Button>
            )}
          </div>
        </div>

        {/* ── Category chips ── */}
        <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none bg-background/60 backdrop-blur-sm shrink-0 border-b border-border/40">
          {categories.map((cat) => {
            const active = filter === cat;
            const grad   = CATEGORY_COLORS[cat];
            return (
              <motion.button
                key={cat}
                onClick={() => setFilter(cat)}
                whileTap={{ scale: 0.93 }}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-200 border",
                  active
                    ? cn("text-white border-transparent shadow-md bg-gradient-to-r", grad || "gradient-primary")
                    : "bg-secondary/60 text-muted-foreground border-border/60 hover:border-primary/30 hover:text-foreground"
                )}
              >
                {cat === "my-courses" && <GraduationCap className="h-3 w-3" />}
                {cat === "all" ? "All" : cat === "my-courses" ? "My Courses" : cat}
              </motion.button>
            );
          })}
        </div>

        {/* ── Main content area ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Feed */}
          <div
            className="flex-1 relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onWheel={onWheel}
          >
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center">
                  <Zap className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground text-sm">No shorts for this filter.</p>
                <button onClick={() => setFilter("all")} className="text-primary text-sm font-medium hover:underline">
                  Show all
                </button>
              </div>
            ) : (
              <>
                {/* Progress dots — left side (desktop) */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 hidden sm:flex flex-col gap-1.5">
                  {filtered.slice(0, 12).map((_, i) => (
                    <motion.button
                      key={i}
                      onClick={() => setActive(i)}
                      animate={{ height: i === activeIdx ? 24 : 6, width: i === activeIdx ? 6 : 6 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={cn("rounded-full transition-colors",
                        i === activeIdx ? "bg-primary" : "bg-foreground/20 hover:bg-foreground/40")}
                    />
                  ))}
                </div>

                {/* Counter */}
                <div className="absolute top-3 right-4 z-10 text-muted-foreground text-xs font-medium bg-background/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-border/40">
                  {activeIdx + 1} / {filtered.length}
                </div>

                {/* Cards — slide animation */}
                <AnimatePresence initial={false} custom={activeIdx}>
                  {filtered.map((short, i) => {
                    if (Math.abs(i - activeIdx) > 1) return null;
                    return (
                      <motion.div
                        key={short.id}
                        custom={i}
                        initial={{ y: i > activeIdx ? "100%" : "-100%", opacity: 0 }}
                        animate={{ y: "0%", opacity: 1 }}
                        exit={{ y: i < activeIdx ? "-100%" : "100%", opacity: 0 }}
                        transition={{ type: "spring", stiffness: 280, damping: 32, mass: 0.8 }}
                        className="absolute inset-0 px-4 py-3 flex items-center justify-center"
                        style={{ display: i === activeIdx ? "flex" : "none" }}
                      >
                        <ShortCard
                          short={short}
                          isActive={i === activeIdx}
                          isStudent={isStudent}
                          isAdmin={isAdmin}
                          onNext={goNext}
                          onPrev={goPrev}
                          hasPrev={activeIdx > 0}
                          hasNext={activeIdx < filtered.length - 1}
                          onDelete={handleDelete}
                          onTogglePublish={handleTogglePublish}
                          onEdit={(s) => setUpload(s)}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* ── Right sidebar (desktop lg+) ── */}
          <div className="hidden lg:flex flex-col w-72 border-l border-border/60 bg-background/80 backdrop-blur-xl overflow-y-auto shrink-0">

            {/* Related */}
            {relatedShorts.length > 0 && (
              <>
                <div className="px-4 py-3 border-b border-border/40">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Tag className="h-3 w-3" /> Related
                  </p>
                </div>
                <div className="divide-y divide-border/40">
                  {relatedShorts.map((s) => (
                    <motion.button
                      key={s.id}
                      whileHover={{ x: 3 }}
                      onClick={() => setActive(filtered.indexOf(s))}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/40 transition-colors"
                    >
                      <div className="relative w-12 aspect-[9/16] rounded-xl overflow-hidden shrink-0">
                        <div className={cn("absolute inset-0 bg-gradient-to-br", CATEGORY_COLORS[s.category] ?? "from-slate-500 to-slate-700")} />
                        {s.thumbnail_img && <img src={s.thumbnail_img} alt={s.title} className="absolute inset-0 w-full h-full object-cover" />}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play className="h-3.5 w-3.5 text-white fill-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-xs font-semibold line-clamp-2 leading-snug">{s.title}</p>
                        <p className="text-muted-foreground text-[10px] mt-1">{s.teacher_name}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span>{s.duration}</span>
                          <span>·</span>
                          <span>{fmt(s.likes)} likes</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </>
            )}

            {/* Analytics — admin */}
            {canManage && (
              <div className="px-4 py-4 border-t border-border/40 mt-auto">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mb-3">
                  <BarChart2 className="h-3 w-3" /> Analytics
                </p>
                <div className="space-y-3">
                  {[
                    { label: "Total views",  value: fmt(totalViews),        icon: Eye,        color: "text-sky-500" },
                    { label: "Total likes",  value: fmt(totalLikes),        icon: Heart,      color: "text-red-500" },
                    { label: "Published",    value: published,              icon: TrendingUp, color: "text-emerald-500" },
                    { label: "Drafts",       value: shorts.length - published, icon: EyeOff, color: "text-amber-500" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className={cn("flex items-center gap-2 text-xs", color)}>
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-muted-foreground">{label}</span>
                      </div>
                      <span className="text-foreground text-xs font-bold tabular-nums">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course link */}
            {filtered[activeIdx] && (
              <div className="p-4 border-t border-border/40">
                <Link to="/courses">
                  <motion.div whileHover={{ x: 3 }}
                    className="flex items-center gap-2.5 rounded-xl bg-secondary/60 border border-border/60 px-3 py-2.5 hover:bg-secondary transition-colors">
                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-foreground text-xs font-medium truncate">{filtered[activeIdx].course_title}</p>
                      <p className="text-muted-foreground text-[10px]">View full course →</p>
                    </div>
                  </motion.div>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile bottom dots ── */}
        <div className="flex sm:hidden items-center justify-center gap-1.5 py-2.5 bg-background/80 backdrop-blur-sm border-t border-border/40 shrink-0">
          {filtered.slice(0, 10).map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setActive(i)}
              animate={{ width: i === activeIdx ? 20 : 6 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn("h-1.5 rounded-full transition-colors",
                i === activeIdx ? "bg-primary" : "bg-foreground/20")}
            />
          ))}
        </div>
      </div>

      {/* Upload / Edit modal */}
      <AnimatePresence>
        {uploadModal !== null && (
          <UploadModal
            initial={uploadModal === "new" ? undefined : uploadModal}
            onSave={handleSaveShort}
            onClose={() => setUpload(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
