/**
 * MediaHubPage — Unified YouTube-style video hub
 * Tab "All"       → mixed feed of tutorials + shorts cards
 * Tab "Tutorials" → 16:9 landscape video cards grid
 * Tab "Shorts"    → TikTok-style immersive vertical snap player
 *
 * The search bar filters Tutorials and All tabs in real-time.
 * The Shorts tab has its own in-player search/filter.
 */
import {
  useState, useMemo, useRef, useEffect, useCallback,
} from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Play, Eye, Clock, Flame, Sparkles, CheckCircle2,
  Zap, Heart, BookmarkCheck, Bookmark, LayoutGrid, Clapperboard,
  TrendingUp, Filter, Share2, Volume2, VolumeX, ChevronUp,
  ChevronDown, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { mockVideos, categories, type Video } from "./video-data";
import { mockShorts, mockCourses, type Short } from "@/lib/mock-data";
import { useApp } from "@/context/app-context";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "all" | "tutorials" | "shorts";

// ─── Constants ────────────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  Development: "from-emerald-500 to-teal-600",
  Design:      "from-sky-500 to-indigo-600",
  Data:        "from-amber-500 to-orange-600",
  Marketing:   "from-rose-500 to-pink-600",
  Business:    "from-violet-500 to-purple-600",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtN(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000 ? `${(n / 1000).toFixed(1)}k`
    : String(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH BAR
// ─────────────────────────────────────────────────────────────────────────────
function HeroSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="relative group">
      <Search className={cn(
        "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200",
        value ? "text-primary" : "text-muted-foreground group-focus-within:text-primary",
      )} />
      <Input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search tutorials, shorts, teachers…"
        className={cn(
          "pl-12 pr-12 h-12 text-base rounded-2xl border-2 transition-all duration-200 bg-background shadow-sm",
          "focus-visible:ring-0 focus-visible:border-primary",
          value
            ? "border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.08)]"
            : "border-border hover:border-foreground/20",
        )}
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
            onClick={() => { onChange(""); ref.current?.focus(); }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB BAR
// ─────────────────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: typeof Play }[] = [
  { id: "all",       label: "All",       icon: LayoutGrid   },
  { id: "tutorials", label: "Tutorials", icon: Clapperboard },
  { id: "shorts",    label: "Shorts",    icon: Zap          },
];

function TabBar({ active, onChange, counts }: {
  active: Tab; onChange: (t: Tab) => void; counts: Record<Tab, number>;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <motion.button key={t.id} onClick={() => onChange(t.id)} whileTap={{ scale: 0.96 }}
            className={cn(
              "relative inline-flex items-center gap-2 h-9 pl-3 pr-4 rounded-full text-sm font-medium",
              "border transition-all duration-200 select-none whitespace-nowrap",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              isActive
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-background text-muted-foreground border-border hover:border-foreground/25 hover:text-foreground hover:bg-muted/40",
            )}>
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {t.label}
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              isActive ? "bg-white/15 text-background/80" : "bg-muted text-muted-foreground",
            )}>
              {counts[t.id]}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TUTORIAL CARD  (16:9 landscape)
// ─────────────────────────────────────────────────────────────────────────────
function TutorialCard({ video, onClick }: { video: Video; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const catName = categories.find((c) => c.id === video.category)?.name ?? video.category;
  return (
    <motion.div onClick={onClick} onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group cursor-pointer flex flex-col">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted shadow-sm group-hover:shadow-xl transition-shadow duration-300">
        <img src={video.thumbnail} alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className={cn("absolute inset-0 flex items-center justify-center transition-opacity duration-200", hovered ? "opacity-100" : "opacity-0")}>
          <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center">
            <Play className="h-5 w-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        <span className="absolute bottom-2 right-2 text-[11px] font-semibold bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-lg">{video.duration}</span>
        <div className="absolute top-2 left-2 flex gap-1">
          {video.isNew      && <span className="flex items-center gap-0.5 text-[10px] font-bold bg-emerald-500/85 text-white px-1.5 py-0.5 rounded-full"><Sparkles className="h-2.5 w-2.5" />NEW</span>}
          {video.isPopular  && <span className="flex items-center gap-0.5 text-[10px] font-bold bg-amber-500/85 text-white px-1.5 py-0.5 rounded-full"><Flame className="h-2.5 w-2.5" />HOT</span>}
          {video.isCompleted && <span className="flex items-center gap-0.5 text-[10px] font-bold bg-emerald-600/85 text-white px-1.5 py-0.5 rounded-full"><CheckCircle2 className="h-2.5 w-2.5" />DONE</span>}
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium truncate">{catName}</p>
        <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-150">{video.title}</h3>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
          <img src={video.teacherAvatar} alt={video.teacherName} className="h-4 w-4 rounded-full object-cover ring-1 ring-border shrink-0" />
          <span className="truncate">{video.teacherName}</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-0.5 shrink-0"><Eye className="h-3 w-3" />{fmtN(video.views)}</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-0.5 shrink-0"><Clock className="h-3 w-3" />{video.duration}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALL-TAB ROW CARD  (compact mixed card)
// ─────────────────────────────────────────────────────────────────────────────
function AllCard({ kind, item, onClick }: {
  kind: "tutorial" | "short"; item: Video | Short; onClick: () => void;
}) {
  const isShort = kind === "short";
  const s = item as Short;
  const v = item as Video;
  const thumb   = isShort ? s.thumbnail_img : v.thumbnail;
  const grad    = isShort ? (CAT_COLORS[s.category] ?? "from-slate-500 to-slate-700") : "from-slate-400 to-slate-600";
  const teacher = isShort ? s.teacher_name : v.teacherName;
  const views   = isShort ? s.views : v.views;
  const cat     = isShort ? s.category : (categories.find((c) => c.id === v.category)?.name ?? v.category);

  return (
    <motion.div onClick={onClick} whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="group flex gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-muted/50 transition-colors duration-150">
      <div className={cn("relative shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm", isShort ? "w-16 rounded-xl" : "w-[120px]")}
        style={{ aspectRatio: isShort ? "9/16" : "16/9" }}>
        {thumb
          ? <img src={thumb} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className={cn("w-full h-full bg-gradient-to-br", grad)} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className={cn("absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white", isShort ? "bg-rose-500/80" : "bg-primary/80")}>
          {isShort ? "SHORT" : "VIDEO"}
        </span>
        <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-black/60 text-white px-1 rounded">{item.duration}</span>
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5 truncate">{cat}</p>
        <h4 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">{item.title}</h4>
        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
          <span className="truncate">{teacher}</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-0.5 shrink-0"><Eye className="h-3 w-3" />{fmtN(views)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ query }: { query: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
      <Search className="h-10 w-10 opacity-20" />
      <p className="text-sm font-medium">No results{query ? ` for "${query}"` : ""}</p>
      <p className="text-xs opacity-60">Try a different search term or browse all content</p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMMERSIVE SHORT ITEM  (one snap-slide inside the player)
// Uses IntersectionObserver to auto-play when ≥ 80% visible, pause otherwise.
// ─────────────────────────────────────────────────────────────────────────────
function ImmersiveShortItem({
  short,
  isStudent,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  short: Short;
  isStudent: boolean;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible,   setVisible]   = useState(false);
  const [playing,   setPlaying]   = useState(false);
  const [muted,     setMuted]     = useState(true);   // start muted so autoplay works
  const [liked,     setLiked]     = useState(false);
  const [likes,     setLikes]     = useState(short.likes);
  const [saved,     setSaved]     = useState(false);
  const [showDesc,  setShowDesc]  = useState(false);

  // ── IntersectionObserver: auto-play when fully scrolled into view ──────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.8 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // auto-play / pause driven by visibility
  useEffect(() => {
    if (visible) {
      setPlaying(true);
    } else {
      setPlaying(false);
      setShowDesc(false);
    }
  }, [visible]);

  const handleLike = () => {
    setLiked((v) => !v);
    setLikes((n) => liked ? n - 1 : n + 1);
  };

  const grad       = CAT_COLORS[short.category] ?? "from-slate-500 to-slate-700";
  const relCourse  = mockCourses.find((c) => c.id === short.course_id);
  const iframeSrc  = (() => {
    const base = short.video_url.includes("?")
      ? short.video_url
      : `${short.video_url}?`;
    return `${base}&autoplay=1&mute=${muted ? 1 : 0}&controls=1&rel=0&modestbranding=1`;
  })();

  return (
    // Each item fills one snap-section of the scroll container
    <div
      ref={containerRef}
      className="snap-start shrink-0 w-full h-full flex items-center justify-center relative"
    >
      {/* ── Phone-shaped card ── */}
      <div className="relative w-full max-w-[380px] mx-auto h-full rounded-3xl overflow-hidden
        shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.85)]">

        {/* Background */}
        <div className={cn("absolute inset-0 bg-gradient-to-br", grad)} />
        {short.thumbnail_img && (
          <img src={short.thumbnail_img} alt={short.title}
            className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Cinematic scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/25 to-black/40" />

        {/* ── YouTube iframe (auto-plays when visible) ── */}
        {playing && (
          <iframe
            key={`${short.id}-${muted}`}   // re-mount when mute toggles
            src={iframeSrc}
            className="absolute inset-0 w-full h-full z-10"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={short.title}
          />
        )}

        {/* ── Tap-to-play overlay (shown only when paused) ── */}
        {!playing && (
          <button
            onClick={() => setPlaying(true)}
            aria-label="Play"
            className="absolute inset-0 flex items-center justify-center z-10 group/play"
          >
            <motion.div
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
              className="h-20 w-20 rounded-full bg-white/15 backdrop-blur-md ring-2 ring-white/30
                flex items-center justify-center shadow-2xl group-hover/play:bg-white/25 transition-colors"
            >
              <Play className="h-9 w-9 text-white fill-white ml-1.5" />
            </motion.div>
          </button>
        )}

        {/* ── Top controls (playing state) ── */}
        {playing && (
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button
              onClick={() => setMuted((v) => !v)}
              aria-label={muted ? "Unmute" : "Mute"}
              className="h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition"
            >
              {muted
                ? <VolumeX className="h-4 w-4 text-white" />
                : <Volume2 className="h-4 w-4 text-white" />
              }
            </button>
            <button
              onClick={() => setPlaying(false)}
              aria-label="Pause"
              className="h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        )}

        {/* ── Top labels (thumbnail state) ── */}
        {!playing && (
          <>
            <div className="absolute top-4 left-4 z-10">
              <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full text-white backdrop-blur-sm bg-gradient-to-r shadow-lg", grad)}>
                {short.category}
              </span>
            </div>
            <div className="absolute top-4 right-4 z-10">
              <span className="text-[11px] font-bold bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
                {short.duration}
              </span>
            </div>
          </>
        )}

        {/* ── Bottom-left info overlay ── */}
        {!playing && (
          <div className="absolute bottom-0 left-0 right-14 z-10 px-5 pb-6 pt-20">
            {/* Teacher row + follow */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0",
                "ring-2 ring-white/30 bg-gradient-to-br", grad,
              )}>
                {short.teacher_avatar}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold leading-none">{short.teacher_name}</p>
                <p className="text-white/50 text-[10px] mt-0.5 truncate">{short.course_title}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toast.success(`Following ${short.teacher_name}`); }}
                className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/40 text-white
                  bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
              >
                + Follow
              </button>
            </div>

            {/* Title */}
            <h2 className="text-white font-bold text-base leading-snug mb-1.5 drop-shadow-sm">
              {short.title}
            </h2>

            {/* Description — expandable */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDesc((v) => !v); }}
              className="text-left w-full mb-2"
            >
              <p className={cn("text-white/65 text-[11px] leading-relaxed", !showDesc && "line-clamp-2")}>
                {short.description}
              </p>
              {!showDesc && short.description.length > 70 && (
                <span className="text-white/40 text-[10px]"> more</span>
              )}
            </button>

            {/* Hash tags */}
            <div className="flex flex-wrap gap-1.5">
              {short.tags.map((t) => (
                <span key={t} className="text-white/45 text-[10px] hover:text-white/75 transition-colors cursor-pointer">
                  #{t}
                </span>
              ))}
            </div>

            {/* Course pill */}
            {relCourse && (
              <Link to="/courses" className="mt-3 flex items-center gap-2 w-fit">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 hover:bg-white/20 transition-colors border border-white/10">
                  <BookOpen className="h-3 w-3 text-primary shrink-0" />
                  <span className="text-white/80 text-[10px] font-medium truncate max-w-[160px]">{relCourse.title}</span>
                </div>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Right action rail ── */}
      <div className="absolute right-2 sm:right-[calc(50%-160px)] bottom-[14%] flex flex-col items-center gap-4 z-20">
        {/* Like */}
        <motion.button onClick={handleLike} whileTap={{ scale: 0.82 }}
          className="flex flex-col items-center gap-1">
          <motion.div
            animate={liked ? { scale: [1, 1.35, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={cn(
              "h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200",
              liked
                ? "bg-red-500 shadow-[0_0_20px_4px_rgba(239,68,68,0.4)]"
                : "bg-black/50 backdrop-blur-sm hover:bg-black/70",
            )}
          >
            <Heart className={cn("h-5 w-5 text-white transition-all", liked && "fill-white")} />
          </motion.div>
          <span className="text-white text-[10px] font-bold drop-shadow">{fmtN(likes)}</span>
        </motion.button>

        {/* Save */}
        {isStudent && (
          <motion.button onClick={() => setSaved((v) => !v)} whileTap={{ scale: 0.82 }}
            className="flex flex-col items-center gap-1">
            <div className={cn(
              "h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200",
              saved
                ? "bg-primary shadow-[0_0_20px_4px_hsl(var(--primary)/0.4)]"
                : "bg-black/50 backdrop-blur-sm hover:bg-black/70",
            )}>
              {saved
                ? <BookmarkCheck className="h-5 w-5 text-white fill-white" />
                : <Bookmark className="h-5 w-5 text-white" />
              }
            </div>
            <span className="text-white text-[10px] font-bold drop-shadow">{saved ? "Saved" : "Save"}</span>
          </motion.button>
        )}

        {/* Views */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-11 w-11 rounded-2xl bg-black/50 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Eye className="h-5 w-5 text-white" />
          </div>
          <span className="text-white text-[10px] font-bold drop-shadow">{fmtN(short.views)}</span>
        </div>

        {/* Share */}
        <motion.button whileTap={{ scale: 0.82 }}
          onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied!"); }}
          className="flex flex-col items-center gap-1">
          <div className="h-11 w-11 rounded-2xl bg-black/50 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition shadow-lg">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-white text-[10px] font-bold drop-shadow">Share</span>
        </motion.button>
      </div>

      {/* ── Up / Down arrows (desktop) ── */}
      <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 bottom-4 flex-col items-center gap-2 z-20">
        <motion.button onClick={onPrev} disabled={!hasPrev} whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }}
          className={cn("h-8 w-8 rounded-full backdrop-blur-sm flex items-center justify-center text-white transition-all",
            hasPrev ? "bg-white/15 hover:bg-white/30" : "opacity-20 cursor-not-allowed bg-white/10")}>
          <ChevronUp className="h-4 w-4" />
        </motion.button>
        <motion.button onClick={onNext} disabled={!hasNext} whileHover={{ y: 2 }} whileTap={{ scale: 0.9 }}
          className={cn("h-8 w-8 rounded-full backdrop-blur-sm flex items-center justify-center text-white transition-all",
            hasNext ? "bg-white/15 hover:bg-white/30" : "opacity-20 cursor-not-allowed bg-white/10")}>
          <ChevronDown className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHORTS PLAYER  (scroll-snap container that holds all ImmersiveShortItems)
// Height = viewport minus the AppLayout header (64px) and hub chrome (~200px)
// ─────────────────────────────────────────────────────────────────────────────
function ShortsPlayer({ shorts }: { shorts: Short[] }) {
  const { role } = useApp();
  const isStudent = role === "student";

  // imperative index kept in sync with CSS snap via scroll events
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const wheelLock  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef(0);

  // ── Programmatic navigation ────────────────────────────────────────────────
  const scrollTo = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const target = el.children[idx] as HTMLElement | undefined;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveIdx(idx);
  }, []);

  const goNext = useCallback(() => scrollTo(Math.min(activeIdx + 1, shorts.length - 1)), [activeIdx, shorts.length, scrollTo]);
  const goPrev = useCallback(() => scrollTo(Math.max(activeIdx - 1, 0)), [activeIdx, scrollTo]);

  // ── Keyboard (arrows + space) ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowUp")   { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  // ── Mouse-wheel navigation (debounced) ────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    if (wheelLock.current) return;
    if (e.deltaY > 30)       goNext();
    else if (e.deltaY < -30) goPrev();
    wheelLock.current = setTimeout(() => { wheelLock.current = null; }, 700);
  }, [goNext, goPrev]);

  // ── Touch swipe ────────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientY; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    const delta = touchStart.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 45) delta > 0 ? goNext() : goPrev();
  };

  // ── Sync activeIdx when user manually scrolls / snaps ─────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setActiveIdx(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (shorts.length === 0) return <EmptyState query="" />;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 17rem)" }}>
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 py-2 shrink-0">
        {shorts.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            aria-label={`Go to short ${i + 1}`}
            className={cn(
              "rounded-full transition-all duration-200",
              i === activeIdx
                ? "w-4 h-1.5 bg-foreground"
                : "w-1.5 h-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70",
            )}
          />
        ))}
        <span className="ml-2 text-[10px] text-muted-foreground font-medium tabular-nums">
          {activeIdx + 1} / {shorts.length}
        </span>
      </div>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "flex-1 overflow-y-scroll",
          "snap-y snap-mandatory",
          "scrollbar-hide",
        )}
        style={{ scrollBehavior: "smooth" }}
      >
        {shorts.map((short, idx) => (
          <ImmersiveShortItem
            key={short.id}
            short={short}
            isStudent={isStudent}
            onPrev={goPrev}
            onNext={goNext}
            hasPrev={idx > 0}
            hasNext={idx < shorts.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function MediaHubPage() {
  const navigate  = useNavigate();
  const [tab,   setTab]   = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [sort,  setSort]  = useState<"newest" | "popular">("newest");

  const accessible      = mockVideos.filter((v) => !v.isLocked);
  const publishedShorts = mockShorts.filter((s) => s.is_published !== false);

  // ── Filtered tutorials ────────────────────────────────────────────────────
  const filteredTutorials = useMemo(() => {
    const q = query.toLowerCase();
    return accessible
      .filter((v) => !q
        || v.title.toLowerCase().includes(q)
        || v.teacherName.toLowerCase().includes(q)
        || v.courseName.toLowerCase().includes(q)
        || (categories.find((c) => c.id === v.category)?.name ?? "").toLowerCase().includes(q))
      .sort((a, b) =>
        sort === "popular"
          ? b.views - a.views
          : new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime(),
      );
  }, [query, sort, accessible]);

  // ── Filtered shorts (also supports search query) ──────────────────────────
  const filteredShorts = useMemo(() => {
    const q = query.toLowerCase();
    return publishedShorts
      .filter((s) => !q
        || s.title.toLowerCase().includes(q)
        || s.teacher_name.toLowerCase().includes(q)
        || s.category.toLowerCase().includes(q)
        || s.tags.some((t) => t.includes(q)))
      .sort((a, b) =>
        sort === "popular"
          ? b.views - a.views
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [query, sort, publishedShorts]);

  // ── "All" tab — interleaved 2-tutorial : 1-short ─────────────────────────
  const allItems = useMemo(() => {
    const items: { kind: "tutorial" | "short"; item: Video | Short }[] = [];
    const tuts   = [...filteredTutorials];
    const shorts = [...filteredShorts];
    let ti = 0, si = 0;
    while (ti < tuts.length || si < shorts.length) {
      if (ti < tuts.length)   items.push({ kind: "tutorial", item: tuts[ti++] });
      if (ti < tuts.length)   items.push({ kind: "tutorial", item: tuts[ti++] });
      if (si < shorts.length) items.push({ kind: "short",    item: shorts[si++] });
    }
    return items;
  }, [filteredTutorials, filteredShorts]);

  const counts: Record<Tab, number> = {
    all:       allItems.length,
    tutorials: filteredTutorials.length,
    shorts:    filteredShorts.length,
  };

  const totalViews = [...accessible, ...publishedShorts].reduce((s, v) => s + v.views, 0);
  const goToVideo  = (id: string) => navigate({ to: "/video/$videoId", params: { videoId: id } });

  return (
    <div className="space-y-6 pb-10">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(249,115,22,0.4)]">
              <Play className="h-4 w-4 text-white fill-white ml-0.5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Browse Videos</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap ml-12">
            <span className="flex items-center gap-1.5">
              <Clapperboard className="h-3.5 w-3.5" />
              <strong className="text-foreground">{accessible.length}</strong> tutorials
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <strong className="text-foreground">{publishedShorts.length}</strong> shorts
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <strong className="text-foreground">{fmtN(totalViews)}</strong> views
            </span>
          </div>
        </div>

        {/* Sort pills */}
        <div className="flex items-center gap-2 text-sm shrink-0">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground hidden sm:inline">Sort:</span>
          {(["newest", "popular"] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                sort === s
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
              )}>
              {s === "newest" ? "Newest" : "Popular"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero search bar ── */}
      <HeroSearch value={query} onChange={setQuery} />

      {/* ── Tab bar + result count ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <TabBar active={tab} onChange={setTab} counts={counts} />
        {query && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
            {counts[tab] > 0
              ? <><strong className="text-foreground">{counts[tab]}</strong> results for "<em>{query}</em>"</>
              : <>No results for "<em>{query}</em>"</>
            }
          </motion.p>
        )}
      </div>

      {/* ── Content panels with crossfade ── */}
      <AnimatePresence mode="wait">

        {/* ALL */}
        {tab === "all" && (
          <motion.div key="all"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}>
            {allItems.length === 0 ? <EmptyState query={query} /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                {allItems.map(({ kind, item }) => (
                  <AllCard key={`${kind}-${item.id}`} kind={kind} item={item}
                    onClick={() => kind === "tutorial" ? goToVideo(item.id) : setTab("shorts")} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TUTORIALS */}
        {tab === "tutorials" && (
          <motion.div key="tutorials"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}>
            {filteredTutorials.length === 0 ? <EmptyState query={query} /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredTutorials.map((v) => (
                  <TutorialCard key={v.id} video={v} onClick={() => goToVideo(v.id)} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* SHORTS — immersive TikTok-style snap player */}
        {tab === "shorts" && (
          <motion.div key="shorts"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}>
            {filteredShorts.length === 0
              ? <EmptyState query={query} />
              : <ShortsPlayer shorts={filteredShorts} />
            }
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
