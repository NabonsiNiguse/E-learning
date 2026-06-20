import { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search, Play, Eye, Trash2, Upload, BarChart2,
  CheckCircle2, Lock, TrendingUp, ChevronRight, ChevronLeft,
  Flame, Sparkles, GraduationCap, Code2, Database, Network,
  Calculator, BarChart, Cpu, Globe, Bookmark, BookmarkCheck,
  Clock, Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/app-context";
import { mockVideos, mockCourses, categories, type Video } from "./video-data";
import { toast } from "sonner";

// ─── Design tokens ────────────────────────────────────────────────────────────
// Accent palette — no blue anywhere
// Primary action:  emerald-500  (#10b981)
// Warm accent:     amber-400    (#fbbf24)
// Surface:         slate-900 / slate-800 / slate-700 (dark) or white/slate-50 (light)
// Text:            slate-900 (heading), slate-500 (meta), slate-400 (muted)

// ─── Category metadata — charcoal-safe, no blue ───────────────────────────────
const CAT_META: Record<string, { icon: React.ElementType; chip: string; dot: string }> = {
  all:               { icon: Play,          chip: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",          dot: "bg-slate-400" },
  "data-structures": { icon: Cpu,           chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",          dot: "bg-slate-500" },
  "web-dev":         { icon: Globe,         chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",   dot: "bg-emerald-500" },
  "cs-fundamentals": { icon: Code2,         chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",          dot: "bg-slate-500" },
  databases:         { icon: Database,      chip: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",           dot: "bg-amber-500" },
  networking:        { icon: Network,       chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",          dot: "bg-slate-400" },
  "math-algebra":    { icon: Calculator,    chip: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400",               dot: "bg-rose-500" },
  "math-calculus":   { icon: BarChart,      chip: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",           dot: "bg-amber-400" },
  "math-trig":       { icon: GraduationCap, chip: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400",               dot: "bg-rose-400" },
  "math-stats":      { icon: BarChart2,     chip: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",           dot: "bg-amber-500" },
  programming:       { icon: Code2,         chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",   dot: "bg-emerald-400" },
};

// ─── Video card ───────────────────────────────────────────────────────────────
function VideoCard({
  video,
  bookmarked = false,
  onBookmark,
}: {
  video: Video;
  bookmarked?: boolean;
  onBookmark?: (id: string) => void;
}) {
  const meta     = CAT_META[video.category] ?? CAT_META.all;
  const CatIcon  = meta.icon;
  const catName  = categories.find((c) => c.id === video.category)?.name ?? video.category;
  const watchPct = Math.round((video.lessonNumber / video.totalLessons) * 100);

  return (
    <div className="group cursor-pointer flex flex-col transition-all duration-300 ease-out hover:-translate-y-1">
      {/* Thumbnail */}
      <div className={cn(
        "relative aspect-video rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800",
        "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.14),0_1px_2px_-1px_rgba(0,0,0,0.08)]",
        "transition-shadow duration-300 ease-out",
        "group-hover:shadow-[0_14px_36px_-8px_rgba(0,0,0,0.24),0_4px_8px_-4px_rgba(0,0,0,0.1)]",
      )}>
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
        {/* Rich bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        {/* Top vignette for badge legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent" />

        {/* Locked */}
        {video.isLocked && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[3px] flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-full bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
              <Lock className="h-4 w-4 text-white/60" />
            </div>
            <span className="text-white/50 text-[11px] font-medium tracking-wide">Enroll to unlock</span>
          </div>
        )}

        {/* Play button */}
        {!video.isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center",
              "bg-white/15 backdrop-blur-md ring-1 ring-white/30",
              "shadow-[0_4px_20px_rgba(0,0,0,0.35)]",
              "scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100",
              "transition-all duration-300 ease-out",
            )}>
              <Play className="h-5 w-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Duration */}
        <span className="absolute bottom-2.5 right-2.5 text-[11px] font-semibold tabular-nums bg-black/55 backdrop-blur-sm text-white/90 px-2 py-0.5 rounded-lg ring-1 ring-white/10">
          {video.duration}
        </span>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1">
          {video.isNew && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold bg-emerald-500/85 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full ring-1 ring-white/10">
              <Sparkles className="h-2.5 w-2.5" />NEW
            </span>
          )}
          {video.isPopular && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold bg-amber-500/85 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full ring-1 ring-white/10">
              <Flame className="h-2.5 w-2.5" />HOT
            </span>
          )}
          {video.isCompleted && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold bg-emerald-600/85 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full ring-1 ring-white/10">
              <CheckCircle2 className="h-2.5 w-2.5" />DONE
            </span>
          )}
        </div>

        {/* Bookmark */}
        {onBookmark && (
          <button
            onClick={(e) => { e.stopPropagation(); onBookmark(video.id); }}
            className={cn(
              "absolute top-2.5 right-2.5 h-7 w-7 rounded-full flex items-center justify-center",
              "transition-all duration-200 ease-out",
              bookmarked
                ? "bg-emerald-500 opacity-100 shadow-[0_0_14px_2px_rgba(16,185,129,0.4)] ring-1 ring-white/20"
                : "bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-emerald-500 hover:shadow-[0_0_14px_2px_rgba(16,185,129,0.4)]",
            )}
          >
            {bookmarked
              ? <BookmarkCheck className="h-3.5 w-3.5 text-white" />
              : <Bookmark className="h-3.5 w-3.5 text-white" />}
          </button>
        )}

        {/* Progress bar — emerald */}
        {!video.isCompleted && video.lessonNumber > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/15">
            <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${watchPct}%` }} />
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md", meta.chip)}>
            <CatIcon className="h-2.5 w-2.5" />
            {catName.split(" ")[0]}
          </span>
          <span className="text-[10px] text-slate-400 tabular-nums">
            {video.lessonNumber}/{video.totalLessons} lessons
          </span>
        </div>

        <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
          {video.title}
        </h3>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <img src={video.teacherAvatar} alt={video.teacherName}
            className="h-4 w-4 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0" />
          <span className="truncate text-slate-500 dark:text-slate-400">{video.teacherName}</span>
          <span className="shrink-0 text-slate-300 dark:text-slate-600">·</span>
          <span className="flex items-center gap-0.5 shrink-0 tabular-nums">
            <Eye className="h-3 w-3" />{video.views.toLocaleString()}
          </span>
          <span className="shrink-0 text-slate-300 dark:text-slate-600">·</span>
          <span className="flex items-center gap-0.5 shrink-0">
            <Clock className="h-3 w-3" />{video.duration}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Continue watching rail ───────────────────────────────────────────────────
function ContinueRail({ videos, onPlay }: { videos: Video[]; onPlay: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: "l" | "r") =>
    ref.current?.scrollBy({ left: dir === "r" ? 300 : -300, behavior: "smooth" });
  if (videos.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Continue watching</h3>
        <div className="flex gap-1">
          {(["l", "r"] as const).map((d) => (
            <button key={d} onClick={() => scroll(d)}
              className={cn(
                "h-6 w-6 rounded-full border flex items-center justify-center",
                "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900",
                "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                "hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm",
                "transition-all duration-200 ease-out active:scale-95",
              )}>
              {d === "l" ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </div>

      <div ref={ref} className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
        {videos.map((v) => {
          const pct = Math.round((v.lessonNumber / v.totalLessons) * 100);
          return (
            <div key={v.id} onClick={() => onPlay(v.id)} className="shrink-0 w-[220px] snap-start group cursor-pointer transition-all duration-300 ease-out hover:-translate-y-0.5">
              <div className={cn(
                "relative aspect-video rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800",
                "shadow-sm transition-shadow duration-300",
                "group-hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.18)]",
              )}>
                <img src={v.thumbnail} alt={v.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

                {/* Emerald progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/15">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md ring-1 ring-white/35 flex items-center justify-center shadow-md">
                    <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                  </div>
                </div>

                <span className="absolute bottom-2.5 right-2 text-[10px] font-semibold bg-black/60 backdrop-blur-sm text-white/90 px-1.5 py-0.5 rounded">
                  {v.duration}
                </span>
                <span className="absolute bottom-2.5 left-2 text-[10px] text-white/60 tabular-nums">{pct}%</span>
              </div>
              <div className="mt-1.5">
                <p className="text-[10px] text-slate-400 truncate">{v.courseName}</p>
                <p className="text-xs font-medium line-clamp-1 mt-0.5 text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{v.title}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Category filter bar ─────────────────────────────────────────────────────
function CategoryStrip({ active, onChange, videos }: {
  active: string; onChange: (id: string) => void; videos: Video[];
}) {
  const counts = categories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.id] = cat.id === "all" ? videos.length : videos.filter((v) => v.category === cat.id).length;
    return acc;
  }, {});
  const visible = categories.filter((c) => counts[c.id] > 0);

  return (
    <div
      role="toolbar"
      aria-label="Filter by category"
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5"
    >
      {visible.map((cat) => {
        const meta     = CAT_META[cat.id] ?? CAT_META.all;
        const Icon     = meta.icon;
        const isActive = active === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            aria-pressed={isActive}
            aria-label={`${cat.name}, ${counts[cat.id]} videos`}
            className={cn(
              "group relative shrink-0 inline-flex items-center gap-2",
              "h-9 pl-2.5 pr-3.5 rounded-full",
              "text-xs font-medium select-none whitespace-nowrap",
              "border outline-none",
              "transition-all duration-200 ease-out",
              "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1",
              !isActive && [
                "bg-background border-border text-muted-foreground",
                "hover:border-foreground/25 hover:text-foreground hover:bg-muted/50",
                "hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] hover:-translate-y-px",
              ],
              isActive && [
                "bg-foreground border-foreground text-background",
                "shadow-[0_2px_12px_-2px_rgba(0,0,0,0.2),0_0_0_3px_hsl(var(--foreground)/0.08)]",
              ],
            )}
          >
            {/* Icon bubble */}
            <span className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
              "transition-transform duration-200 group-hover:scale-110",
              isActive ? "bg-white/15" : meta.chip,
            )}>
              <Icon className="h-3 w-3" aria-hidden="true" />
            </span>

            {/* Label */}
            <span>{cat.name}</span>

            {/* Count badge */}
            <span className={cn(
              "tabular-nums text-[10px] font-semibold leading-none",
              "px-1.5 py-0.5 rounded-full",
              "transition-colors duration-200",
              isActive
                ? "bg-white/15 text-background/75"
                : "bg-muted text-muted-foreground group-hover:text-foreground/50",
            )}>
              {counts[cat.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StatsRow({ accessible }: { accessible: Video[] }) {
  const completed  = accessible.filter((v) => v.isCompleted).length;
  const inProgress = accessible.filter((v) => !v.isCompleted && v.lessonNumber > 1).length;
  const totalViews = accessible.reduce((s, v) => s + v.views, 0);

  return (
    <div className="flex items-center gap-5 text-sm text-slate-400 flex-wrap">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        <strong className="text-slate-700 dark:text-slate-300 font-semibold">{accessible.length}</strong> videos
      </span>
      <span className="flex items-center gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        <strong className="text-slate-700 dark:text-slate-300 font-semibold">{completed}</strong> completed
      </span>
      <span className="flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5 text-amber-400" />
        <strong className="text-slate-700 dark:text-slate-300 font-semibold">{inProgress}</strong> in progress
      </span>
      <span className="hidden sm:flex items-center gap-1.5">
        <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
        <strong className="text-slate-700 dark:text-slate-300 font-semibold">{(totalViews / 1000).toFixed(1)}k</strong> views
      </span>
    </div>
  );
}

// ─── STUDENT view ─────────────────────────────────────────────────────────────
export function VideosPage() {
  const navigate = useNavigate();
  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState("all");
  const [sort,      setSort]      = useState("newest");
  const [tab,       setTab]       = useState<"all" | "saved" | "courses">("all");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set(["v2", "v9"]));

  const toggleBookmark = (id: string) =>
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      toast.success(next.has(id) ? "Saved" : "Removed from saved");
      return next;
    });

  const accessible       = mockVideos.filter((v) => !v.isLocked);
  const continueWatching = accessible.filter((v) => !v.isCompleted && v.lessonNumber > 1);

  const filtered = accessible
    .filter((v) => {
      if (tab === "saved") return bookmarks.has(v.id);
      const q = search.toLowerCase();
      return (
        (!q || v.title.toLowerCase().includes(q) ||
          v.courseName.toLowerCase().includes(q) ||
          v.teacherName.toLowerCase().includes(q)) &&
        (category === "all" || v.category === category)
      );
    })
    .sort((a, b) => {
      if (sort === "popular")     return b.views - a.views;
      if (sort === "recommended") return (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0);
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    });

  return (
    <div className="space-y-8 pb-8">

      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Video Library</h1>
        <StatsRow accessible={accessible} />
      </div>

      {/* Continue watching */}
      <ContinueRail videos={continueWatching} onPlay={(id) => navigate({ to: "/video/$videoId", params: { videoId: id } })} />

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-slate-200 dark:border-slate-800">
        {([
          { id: "all",     label: "All videos" },
          { id: "saved",   label: `Saved${bookmarks.size > 0 ? ` (${bookmarks.size})` : ""}` },
          { id: "courses", label: "My courses" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors duration-150",
              tab === t.id
                ? "border-slate-800 dark:border-slate-200 text-slate-900 dark:text-slate-100"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Courses tab */}
      {tab === "courses" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockCourses.map((c) => {
            const meta = CAT_META[c.category] ?? CAT_META.all;
            const Icon = meta.icon;
            const done  = accessible.filter((v) => v.courseId === c.id && v.isCompleted).length;
            const total = accessible.filter((v) => v.courseId === c.id).length;
            return (
              <div key={c.id} className={cn(
                "group cursor-pointer rounded-xl p-4",
                "bg-white dark:bg-slate-900",
                "border border-slate-200 dark:border-slate-800",
                "transition-all duration-200 ease-out",
                "hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700",
                "hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.1)]",
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", meta.chip)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug line-clamp-2 text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{c.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.teacherName}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{done}/{total} lessons</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{c.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* All / Saved */}
      {tab !== "courses" && (
        <div className="space-y-5">
          {tab === "all" && (
            <div className="space-y-3">
              <CategoryStrip active={category} onChange={setCategory} videos={accessible} />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search videos, courses, teachers…"
                    className="pl-9 h-9 text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 placeholder:text-slate-400"
                  />
                  {search && (
                    <button onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      ×
                    </button>
                  )}
                </div>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-9 w-[150px] text-sm shrink-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="popular">Most popular</SelectItem>
                    <SelectItem value="recommended">Recommended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {filtered.length} {filtered.length === 1 ? "video" : "videos"}
              {category !== "all" && ` in ${categories.find((c) => c.id === category)?.name}`}
            </p>
            {(category !== "all" || search) && (
              <button onClick={() => { setSearch(""); setCategory("all"); }}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
              <Search className="h-8 w-8 opacity-20" />
              <p className="text-sm font-medium">No videos found</p>
              <p className="text-xs opacity-60">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((v) => (
                <div key={v.id} onClick={() => navigate({ to: "/video/$videoId", params: { videoId: v.id } })}>
                  <VideoCard
                    video={v}
                    bookmarked={bookmarks.has(v.id)}
                    onBookmark={toggleBookmark}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
