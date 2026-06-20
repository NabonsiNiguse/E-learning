/**
 * Premium course cards, video cards, and stat cards
 * used across all three dashboard views.
 */
import { Link, useNavigate } from "@tanstack/react-router";
import {
  PlayCircle, Star, Users, Clock, Lock, ArrowRight,
  BookOpen, Zap, Award, TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Course } from "@/lib/mock-data";
import { SparkLine } from "./dashboard-charts";

// ---------------------------------------------------------------------------
// Gradient overlays per course thumbnail
// ---------------------------------------------------------------------------
const OVERLAY_MAP: Record<string, string> = {
  "from-emerald-400 to-teal-600":   "from-emerald-600/90 to-teal-800/80",
  "from-sky-400 to-indigo-600":     "from-sky-600/90 to-indigo-800/80",
  "from-amber-400 to-orange-600":   "from-amber-600/90 to-orange-800/80",
  "from-rose-400 to-pink-600":      "from-rose-600/90 to-pink-800/80",
  "from-violet-400 to-purple-600":  "from-violet-600/90 to-purple-800/80",
  "from-cyan-400 to-blue-600":      "from-cyan-600/90 to-blue-800/80",
};

// Fake "image" pattern overlay — gives depth to gradient thumbnails
function CourseImageBg({ thumbnail, className }: { thumbnail: string; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Base gradient */}
      <div className={cn("absolute inset-0 bg-gradient-to-br", thumbnail)} />
      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      {/* Bottom fade */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t",
        OVERLAY_MAP[thumbnail] ?? "from-black/60 to-transparent"
      )} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Premium course card — used in student & teacher dashboards
// ---------------------------------------------------------------------------
export function PremiumCourseCard({ course }: { course: Course }) {
  const isLocked   = course.locked;
  const hasProgress = course.progress !== undefined;

  return (
    <Card className={cn(
      "group overflow-hidden border-border/60 transition-all duration-300",
      "hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.2)] hover:-translate-y-1",
      isLocked && "opacity-80"
    )}>
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden">
        {course.thumbnailImg ? (
          <>
            <img 
              src={course.thumbnailImg} 
              alt={course.title} 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : course.thumbnail?.startsWith('http') ? (
          <>
            <img 
              src={course.thumbnail} 
              alt={course.title} 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <CourseImageBg thumbnail={course.thumbnail} className="absolute inset-0" />
        )}

        {/* Floating badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <Badge className="bg-white/95 text-foreground border-0 text-[10px] font-semibold shadow-sm">
            {course.level}
          </Badge>
          <Badge className="bg-black/40 backdrop-blur text-white border-white/20 text-[10px]">
            {course.category}
          </Badge>
        </div>

        {/* Lock / play overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {isLocked ? (
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Lock className="h-5 w-5 text-white" />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <PlayCircle className="h-6 w-6 text-white" />
            </div>
          )}
        </div>

        {/* Price tag */}
        <div className="absolute bottom-3 right-3 z-10">
          <span className="bg-white/95 text-foreground text-xs font-bold px-2 py-1 rounded-full shadow-sm">
            ${course.price}
          </span>
        </div>

        {/* Course title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8 z-10">
          <h4 className="text-white font-display font-bold text-sm leading-snug line-clamp-2 drop-shadow">
            {course.title}
          </h4>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Instructor */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-full gradient-primary flex items-center justify-center text-white text-[9px] font-bold shrink-0">
            {course.instructor.split(" ").map((n) => n[0]).join("")}
          </div>
          <span className="text-xs text-muted-foreground truncate">{course.instructor}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span className="font-semibold text-foreground">{course.rating}</span>
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {course.students.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {course.duration}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {course.lessons}
          </span>
        </div>

        {/* Progress bar (if enrolled) */}
        {hasProgress && !isLocked && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-primary">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-1.5" />
          </div>
        )}

        {/* CTA */}
        {isLocked ? (
          <Button asChild size="sm" className="w-full gradient-primary text-white border-0 h-8 text-xs">
            <Link to="/payment/$courseId" params={{ courseId: course.id }}>
              Enroll · ${course.price}
            </Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline" className="w-full h-8 text-xs group-hover:border-primary group-hover:text-primary transition-colors">
            <Link to="/lessons/$courseId" params={{ courseId: course.id }}>
              {(course.progress ?? 0) > 0 ? "Continue" : "Start"} <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Video lesson card — featured short-form content
// ---------------------------------------------------------------------------
interface VideoCardProps {
  title: string;
  instructor: string;
  instructorAvatar: string;
  duration: string;
  thumbnail: string;
  category: string;
  views: number;
  isNew?: boolean;
}

export function VideoCard({
  title, instructor, instructorAvatar, duration,
  thumbnail, category, views, isNew,
}: VideoCardProps) {
  const navigate = useNavigate();
  return (
    <div className="group cursor-pointer" onClick={() => navigate({ to: "/videos" })}>
      {/* Thumbnail */}
      <div className="relative rounded-xl overflow-hidden aspect-video mb-3">
        <div className={cn("absolute inset-0 bg-gradient-to-br", thumbnail)} />
        <div
          className="absolute inset-0 opacity-15"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-11 w-11 rounded-full bg-white/25 backdrop-blur-sm border border-white/40 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/35 transition-all">
            <PlayCircle className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2">
          <span className="bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
            {duration}
          </span>
        </div>

        {/* New badge */}
        {isNew && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-primary text-primary-foreground border-0 text-[10px] gap-1 h-5">
              <Zap className="h-2.5 w-2.5" /> New
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex gap-2.5">
        <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5">
          {instructorAvatar}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">{instructor}</p>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
            <span>{category}</span>
            <span>·</span>
            <span>{views.toLocaleString()} views</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card with sparkline trend
// ---------------------------------------------------------------------------
interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  change?: string;
  changePositive?: boolean;
  gradient: string;
  icon: typeof BookOpen;
  sparkColor?: string;
  to?: string;
}

export function StatCard({
  label, value, sub, change, changePositive = true,
  gradient, icon: Icon, sparkColor, to,
}: StatCardProps) {
  const navigate = useNavigate();
  return (
    <Card
      className={cn(
        "p-5 border-border/60 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15)] transition-all duration-200 hover:-translate-y-0.5 overflow-hidden relative",
        to && "cursor-pointer"
      )}
      onClick={to ? () => navigate({ to: to as any }) : undefined}
    >
      {/* Background accent */}
      <div className={cn(
        "absolute top-0 right-0 h-20 w-20 rounded-full opacity-8 -translate-y-6 translate-x-6 bg-gradient-to-br",
        gradient
      )} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            "h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md",
            gradient
          )}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {change && (
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
              changePositive
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-red-500/10 text-red-600"
            )}>
              {changePositive ? "↑" : "↓"} {change}
            </span>
          )}
        </div>

        <div className="text-2xl font-black font-display tracking-tight">{value}</div>
        <div className="text-sm font-medium mt-0.5">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>

        {sparkColor && (
          <div className="mt-2 -mx-1">
            <SparkLine color={sparkColor} />
          </div>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Mock video data for dashboards — realistic view counts for a small platform
// ---------------------------------------------------------------------------
export const mockVideos: VideoCardProps[] = [
  {
    title: "React Hooks Deep Dive — useEffect & useCallback",
    instructor: "Nabonsi Niguse", instructorAvatar: "NN",
    duration: "18:32", thumbnail: "from-emerald-400 to-teal-600",
    category: "Development", views: 16, isNew: true,
  },
  {
    title: "Figma Auto Layout Masterclass",
    instructor: "Lemi Melkamu", instructorAvatar: "LM",
    duration: "12:15", thumbnail: "from-sky-400 to-indigo-600",
    category: "Design", views: 11,
  },
  {
    title: "Python Pandas: Data Cleaning in 15 Minutes",
    instructor: "Nabonsi Niguse", instructorAvatar: "NN",
    duration: "15:08", thumbnail: "from-amber-400 to-orange-600",
    category: "Data", views: 8, isNew: true,
  },
  {
    title: "SEO Strategy for 2026 — Complete Guide",
    instructor: "Lemi Melkamu", instructorAvatar: "LM",
    duration: "22:44", thumbnail: "from-rose-400 to-pink-600",
    category: "Marketing", views: 6,
  },
];
