import { useState, useRef } from "react";
import {
  Play, Pause, ChevronLeft, ChevronRight, Download, BookOpen,
  CheckCircle2, Lock, FileText, Video as VideoIcon, Trash2, Eye,
  Clock, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward,
  ThumbsUp, Share2, BookmarkCheck, Bookmark, BarChart2, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockVideos, mockCourses } from "./video-data";
import { useApp } from "@/context/app-context";
import { downloadFile, mimeFromName } from "@/lib/download";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const G: Record<string, string> = {
  "data-structures": "from-indigo-500 to-violet-600",
  "web-dev":         "from-emerald-500 to-teal-600",
  "cs-fundamentals": "from-violet-500 to-purple-600",
  databases:         "from-amber-500 to-orange-600",
  networking:        "from-cyan-500 to-sky-600",
  "math-algebra":    "from-rose-500 to-pink-600",
  "math-calculus":   "from-indigo-500 to-violet-600",
  "math-trig":       "from-pink-500 to-fuchsia-600",
  "math-stats":      "from-orange-500 to-red-600",
  programming:       "from-lime-500 to-green-600",
};

export function VideoPlayerPage() {
  const { role } = useApp();
  const playerRef = useRef<HTMLDivElement>(null);
  const [activeId,    setActiveId]    = useState(mockVideos[0].id);
  const [playing,     setPlaying]     = useState(false);
  const [muted,       setMuted]       = useState(false);
  const [progress,    setProgress]    = useState(35);
  const [liked,       setLiked]       = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [likes,       setLikes]       = useState(1243);
  const [isFullscreen,setIsFullscreen]= useState(false);
  const [editOpen,    setEditOpen]    = useState(false);
  const [statsOpen,   setStatsOpen]   = useState(false);
  const [editTitle,   setEditTitle]   = useState("");

  const cv   = mockVideos.find((v) => v.id === activeId) ?? mockVideos[0];
  const cc   = mockCourses.find((c) => c.id === cv.courseId);
  const cvs  = mockVideos.filter((v) => v.courseId === cv.courseId);
  const rel  = mockVideos.filter((v) => v.category === cv.category && v.id !== cv.id).slice(0, 4);
  const idx  = cvs.findIndex((v) => v.id === activeId);
  const prev = idx > 0 ? cvs[idx - 1] : null;
  const next = idx < cvs.length - 1 ? cvs[idx + 1] : null;
  const canAll = role === "admin" || role === "teacher";
  const grad = G[cv.category] ?? "from-primary to-primary/70";

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
        toast.error("Fullscreen not supported in this browser.");
      });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const handleEditSave = () => {
    if (editTitle.trim()) toast.success(`Video title updated to "${editTitle.trim()}"`);
    setEditOpen(false);
  };

  const switchTo = (id: string) => { setActiveId(id); setPlaying(false); setProgress(0); };
  const handleLike = () => { setLiked((v) => !v); setLikes((n) => liked ? n - 1 : n + 1); };
  const scrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setProgress(Math.round(((e.clientX - r.left) / r.width) * 100));
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] gap-5 items-start">

      {/* LEFT */}
      <div className="space-y-4 min-w-0">

        {/* Player */}
        <div ref={playerRef} className="relative rounded-2xl overflow-hidden bg-black shadow-[0_12px_48px_-8px_rgba(0,0,0,0.45)] group">
          <div className="aspect-video relative">
            <img src={cv.thumbnail} alt={cv.title}
              className={cn("w-full h-full object-cover transition-all duration-500", playing ? "brightness-60" : "brightness-85")} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

            {/* Top badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className={cn("text-[10px] font-bold text-white px-2.5 py-1 rounded-full bg-gradient-to-r shadow-lg", grad)}>
                Lesson {cv.lessonNumber} / {cv.totalLessons}
              </span>
              {cv.isNew && <span className="text-[10px] font-bold bg-emerald-500/90 text-white px-2 py-0.5 rounded-full">NEW</span>}
              {cv.isPopular && <span className="text-[10px] font-bold bg-orange-500/90 text-white px-2 py-0.5 rounded-full">HOT</span>}
            </div>

            {/* Top-right controls */}
            <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setMuted((v) => !v)}
                className="h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 flex items-center justify-center transition">
                {muted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
              </button>
              <button onClick={handleFullscreen}
                className="h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 flex items-center justify-center transition">
                {isFullscreen ? <Minimize className="h-4 w-4 text-white" /> : <Maximize className="h-4 w-4 text-white" />}
              </button>
            </div>

            {/* Center controls */}
            <div className="absolute inset-0 flex items-center justify-center gap-5">
              <button onClick={() => prev && switchTo(prev.id)} disabled={!prev}
                className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/25 disabled:opacity-20 flex items-center justify-center transition opacity-0 group-hover:opacity-100">
                <SkipBack className="h-5 w-5 text-white fill-white" />
              </button>
              <button onClick={() => setPlaying((v) => !v)}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/20 backdrop-blur-md ring-2 ring-white/40 hover:bg-white/30 hover:scale-105 flex items-center justify-center transition-all duration-200 shadow-2xl">
                {playing
                  ? <Pause className="h-7 w-7 sm:h-9 sm:w-9 text-white fill-white" />
                  : <Play  className="h-7 w-7 sm:h-9 sm:w-9 text-white fill-white ml-1" />}
              </button>
              <button onClick={() => next && switchTo(next.id)} disabled={!next}
                className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/25 disabled:opacity-20 flex items-center justify-center transition opacity-0 group-hover:opacity-100">
                <SkipForward className="h-5 w-5 text-white fill-white" />
              </button>
            </div>

            {/* Bottom: scrub + meta */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white/60 text-[10px] tabular-nums w-8">
                  {Math.floor(progress * 0.6)}:{String(Math.floor((progress * 0.6 % 1) * 60)).padStart(2,"0")}
                </span>
                <div className="flex-1 h-1 bg-white/25 rounded-full cursor-pointer group/bar relative" onClick={scrub}>
                  <div className={cn("h-full rounded-full bg-gradient-to-r transition-all", grad)} style={{ width: `${progress}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity -translate-x-1/2"
                    style={{ left: `${progress}%` }} />
                </div>
                <span className="text-white/60 text-[10px] tabular-nums w-10 text-right">{cv.duration}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold text-sm line-clamp-1 flex-1 mr-4">{cv.title}</p>
                <span className="text-white/50 text-[10px] shrink-0">{cv.views.toLocaleString()} views</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info card */}
        <Card className="border-border/60 shadow-[0_4px_32px_-4px_rgba(0,0,0,0.1)] overflow-hidden">
          <div className={cn("h-0.5 w-full bg-gradient-to-r", grad)} />
          <div className="p-4 sm:p-5 space-y-4">

            {/* Title + actions */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold leading-snug flex-1 min-w-0">{cv.title}</h1>
              <div className="flex gap-1.5 shrink-0 flex-wrap">
                {role === "student" && (
                  <>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-xl"
                      onClick={() => { setSaved((v) => !v); toast.success(saved ? "Removed from saved" : "Saved to your library"); }}>
                      {saved ? <BookmarkCheck className="h-3.5 w-3.5 fill-primary text-primary" /> : <Bookmark className="h-3.5 w-3.5" />}
                      {saved ? "Saved" : "Save"}
                    </Button>
                  </>
                )}
                {role === "teacher" && (
                  <>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-xl"
                      onClick={() => { setEditTitle(cv.title); setEditOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />Edit
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-xl text-destructive hover:bg-destructive/10"
                      onClick={() => toast.success("Video removed from course.")}>
                      <Trash2 className="h-3.5 w-3.5" />Remove
                    </Button>
                  </>
                )}
                {role === "admin" && (
                  <>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-xl"
                      onClick={() => setStatsOpen(true)}>
                      <BarChart2 className="h-3.5 w-3.5" />Stats
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-xl text-destructive hover:bg-destructive/10"
                      onClick={() => toast.success("Video removed from platform.")}>
                      <Trash2 className="h-3.5 w-3.5" />Remove
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Teacher + meta */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-9 w-9 ring-2 ring-border shadow-sm">
                  <AvatarImage src={cv.teacherAvatar} alt={cv.teacherName} />
                  <AvatarFallback className="text-xs font-bold">{cv.teacherName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold leading-none">{cv.teacherName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cv.courseName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground sm:ml-auto flex-wrap">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{cv.views.toLocaleString()}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{cv.duration}</span>
                <span>{new Date(cv.uploadDate).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
              </div>
            </div>

            {/* Engagement row */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handleLike}
                className={cn("flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border transition-all",
                  liked ? "bg-primary/10 border-primary/30 text-primary" : "border-border hover:border-primary/30 hover:bg-secondary/60 text-muted-foreground")}>
                <ThumbsUp className={cn("h-3.5 w-3.5", liked && "fill-primary")} />
                {likes.toLocaleString()}
              </button>
              <button onClick={() => setSaved((v) => !v)}
                className={cn("flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border transition-all",
                  saved ? "bg-primary/10 border-primary/30 text-primary" : "border-border hover:border-primary/30 hover:bg-secondary/60 text-muted-foreground")}>
                {saved ? <BookmarkCheck className="h-3.5 w-3.5 fill-primary" /> : <Bookmark className="h-3.5 w-3.5" />}
                {saved ? "Saved" : "Save"}
              </button>
              <button onClick={() => toast.info("Share link copied!")}
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border border-border hover:border-primary/30 hover:bg-secondary/60 text-muted-foreground transition-all">
                <Share2 className="h-3.5 w-3.5" />Share
              </button>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-xl" disabled={!prev}
                  onClick={() => prev && switchTo(prev.id)}>
                  <ChevronLeft className="h-4 w-4" />Prev
                </Button>
                <Button size="sm" className="h-8 text-xs gap-1.5 rounded-xl gradient-primary text-white border-0 shadow-[0_2px_12px_-2px] shadow-primary/40"
                  disabled={!next} onClick={() => next && switchTo(next.id)}>
                  Next<ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="description">
              <TabsList className="w-full h-9">
                <TabsTrigger value="description" className="flex-1 text-xs gap-1.5"><BookOpen className="h-3.5 w-3.5" />Overview</TabsTrigger>
                <TabsTrigger value="materials"   className="flex-1 text-xs gap-1.5"><FileText className="h-3.5 w-3.5" />Materials</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{cv.description}</p>
                <ul className="space-y-1.5">
                  {["Understand the core concepts","Apply through practical examples","Solve real-world problems","Build a strong foundation"].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="materials" className="mt-4 space-y-2">
                {[
                  { name: "Lecture Notes.pdf",    size: "2.4 MB", color: "bg-primary/10 text-primary" },
                  { name: "Code Examples.zip",    size: "1.8 MB", color: "bg-emerald-500/10 text-emerald-600" },
                  { name: "Practice Problems.pdf",size: "856 KB", color: "bg-violet-500/10 text-violet-600" },
                ].map((f) => (
                  <div key={f.name} className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:bg-secondary/50 hover:border-primary/20 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", f.color)}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.size}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg"
                      onClick={() => { downloadFile(f.name, mimeFromName(f.name)); toast.success(`Downloading ${f.name}`); }}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* Related videos */}
        <div className="space-y-3">
          <p className="text-sm font-bold">Related videos</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rel.map((v) => (
              <button key={v.id} onClick={() => switchTo(v.id)}
                className="group flex gap-3 p-3 rounded-xl border border-border/60 hover:bg-secondary/40 hover:border-primary/20 hover:shadow-[0_2px_16px_-4px_rgba(0,0,0,0.1)] transition-all text-left">
                <div className="relative w-28 sm:w-32 aspect-video shrink-0 rounded-lg overflow-hidden bg-black">
                  <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Play className="h-5 w-5 text-white fill-white" />
                  </div>
                  <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-black/70 text-white px-1 py-0.5 rounded">{v.duration}</span>
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <p className="text-xs font-semibold line-clamp-2 group-hover:text-primary transition-colors">{v.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{v.teacherName}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Eye className="h-3 w-3" />{v.views.toLocaleString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: playlist */}
      <div className="lg:sticky lg:top-4 h-fit">
        <Card className="border-border/60 shadow-[0_4px_32px_-4px_rgba(0,0,0,0.1)] overflow-hidden">
          {/* Course header — no blue, uses category gradient */}
          <div className={cn("p-4 bg-gradient-to-br text-white relative overflow-hidden", grad)}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
            <div className="relative">
              <p className="font-bold text-sm leading-snug line-clamp-2">{cv.courseName}</p>
              <p className="text-white/70 text-xs mt-1">{cv.lessonNumber} of {cv.totalLessons} lessons</p>
              {cc && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-white/80">
                    <span>Course progress</span>
                    <span className="font-bold">{cc.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${cc.progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lesson list */}
          <ScrollArea className="h-[380px] lg:h-[500px]">
            <div className="p-2 space-y-0.5">
              {cvs.map((v, i) => {
                const isCurrent   = v.id === activeId;
                const isCompleted = i < idx;
                const isLocked    = !canAll && i > idx + 1;
                return (
                  <button key={v.id} disabled={isLocked} onClick={() => !isLocked && switchTo(v.id)}
                    className={cn(
                      "w-full flex gap-3 p-2.5 rounded-xl text-left transition-all duration-150",
                      isCurrent ? "bg-primary/10 border border-primary/20 shadow-[0_0_0_1px] shadow-primary/10" : "hover:bg-secondary/60 border border-transparent",
                      isLocked && "opacity-35 cursor-not-allowed",
                    )}>
                    <div className="relative w-20 aspect-video shrink-0 rounded-lg overflow-hidden bg-black">
                      <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                      {isLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Lock className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                      {isCompleted && !isCurrent && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 fill-emerald-400/30" />
                        </div>
                      )}
                      {isCurrent && (
                        <>
                          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", grad)} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <VideoIcon className="h-4 w-4 text-white" />
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] font-semibold text-muted-foreground">Lesson {v.lessonNumber}</span>
                        <span className="text-[10px] text-muted-foreground">{v.duration}</span>
                      </div>
                      <p className={cn("text-xs font-semibold line-clamp-2 leading-snug", isCurrent ? "text-primary" : "text-foreground")}>
                        {v.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>

    {/* Edit video dialog */}
    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pencil className="h-4 w-4 text-primary" /> Edit video
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-10" />
          </div>
          <div className="rounded-xl bg-secondary/50 border border-border px-3.5 py-2.5 text-xs text-muted-foreground">
            Course: {cv.courseName} · Lesson {cv.lessonNumber}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button size="sm" className="gradient-primary text-white border-0" onClick={handleEditSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Stats dialog */}
    <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="h-4 w-4 text-primary" /> Video analytics
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {[
            { label: "Total views",    value: cv.views.toLocaleString() },
            { label: "Likes",          value: likes.toLocaleString() },
            { label: "Avg watch time", value: cv.duration },
            { label: "Course",         value: cv.courseName },
            { label: "Lesson",         value: `${cv.lessonNumber} of ${cv.totalLessons}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold">{value}</span>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setStatsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
