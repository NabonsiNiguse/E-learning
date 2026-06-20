import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search, Users, Lock, PlayCircle, Settings, BookOpen,
  Plus, Trash2, AlertCircle, DollarSign, Eye, EyeOff,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/app-context";
import { cn } from "@/lib/utils";
import {
  useCourses, useEnrollments, useDeleteCourse,
  useCreateCourse, usePublishCourse,
} from "@/lib/use-api";
import type { ApiCourseListItem } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/courses")({
  head: () => ({ meta: [{ title: "Courses — Learnly" }] }),
  component: CoursesPage,
});

// ─── Gradient fallback per category ──────────────────────────────────────
const GRADIENTS: Record<string, string> = {
  Development: "from-emerald-400 to-teal-600",
  Design:      "from-sky-400 to-indigo-600",
  Data:        "from-amber-400 to-orange-600",
  Marketing:   "from-rose-400 to-pink-600",
  Business:    "from-violet-400 to-purple-600",
};
const DEFAULT_GRADIENT = "from-cyan-400 to-blue-600";

// ─── Create Course Dialog ─────────────────────────────────────────────────
function CreateCourseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMutation = useCreateCourse();
  const [title,     setTitle]     = useState("");
  const [desc,      setDesc]      = useState("");
  const [category,  setCategory]  = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [price,     setPrice]     = useState("0");

  function reset() {
    setTitle(""); setDesc(""); setCategory(""); setIsPremium(false); setPrice("0");
  }

  async function handleCreate() {
    if (!title.trim()) { toast.error("Title required"); return; }
    try {
      await createMutation.mutateAsync({
        title:       title.trim(),
        description: desc.trim(),
        category:    category.trim(),
        is_premium:  isPremium,
        price:       isPremium ? parseFloat(price) || 0 : 0,
      });
      toast.success("Course created as draft");
      reset();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create course");
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => { reset(); onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">New Course</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Title *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Modern Web Development"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="What will students learn?"
              className="resize-none text-sm min-h-[72px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. Development, Design…"
              className="h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox" id="premium"
                checked={isPremium}
                onChange={e => setIsPremium(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="premium" className="text-xs cursor-pointer">Premium (paid)</Label>
            </div>
            {isPremium && (
              <div className="flex items-center gap-1.5 flex-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input
                  type="number" min="0" step="0.01"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => { reset(); onClose(); }} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────
function CourseCard({
  course: c,
  role,
  isEnrolled,
  onDelete,
}: {
  course: ApiCourseListItem;
  role: string;
  isEnrolled: boolean;
  onDelete: (id: number, title: string) => void;
}) {
  const isAdmin   = role === "admin" || role === "super_admin";
  const isTeacher = role === "teacher";
  const isStudent = role === "student";

  // Locked for student = premium course they haven't paid for
  const isLocked = isStudent && c.is_premium && !isEnrolled;
  const price    = parseFloat(c.price);

  const publishMutation = usePublishCourse();
  const deleteMutation  = useDeleteCourse();

  async function togglePublish(e: React.MouseEvent) {
    e.preventDefault();
    const action = c.status === "published" ? "unpublish" : "publish";
    try {
      await publishMutation.mutateAsync({ id: c.id, action });
      toast.success(action === "publish" ? "Course published" : "Course unpublished");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  }

  const gradient = GRADIENTS[c.category] ?? DEFAULT_GRADIENT;

  return (
    <div className="rounded-2xl border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col">

      {/* Thumbnail */}
      <div className="relative h-36 sm:h-40 overflow-hidden bg-muted shrink-0">
        {c.thumbnail ? (
          <img
            src={c.thumbnail}
            alt={c.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={cn("w-full h-full bg-gradient-to-br", gradient)} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Lock overlay — premium + not enrolled */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
              <Lock className="h-5 w-5 text-white" />
            </div>
          </div>
        )}

        {/* Play hover for accessible courses */}
        {!isLocked && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <PlayCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1">
          {c.category ? (
            <Badge className="bg-black/50 backdrop-blur text-white border-0 text-[10px] h-5 px-1.5 capitalize shrink-0">
              {c.category}
            </Badge>
          ) : <span />}
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {c.is_premium && price > 0 && (
              <Badge className="bg-amber-500/90 text-white border-0 text-[10px] h-5 px-1.5 shrink-0">
                ${price}
              </Badge>
            )}
            {(isAdmin || isTeacher) && (
              <Badge className={cn(
                "text-[10px] h-5 px-1.5 border-0 shrink-0",
                c.status === "published" ? "bg-emerald-500/90 text-white"
                : c.status === "draft"   ? "bg-amber-500/80 text-white"
                :                          "bg-zinc-500/80 text-white"
              )}>
                {c.status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col flex-1">
        <h4 className="font-semibold text-sm leading-snug line-clamp-2 flex-1">{c.title}</h4>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">by {c.teacher_name}</p>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />{c.enrolled_count}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />{c.lesson_count} lessons
          </span>
        </div>

        {/* CTA */}
        <div className="mt-3 flex gap-1.5">

          {/* Admin */}
          {isAdmin && (
            <>
              <Button asChild variant="outline" size="sm" className="flex-1 h-8 text-xs">
                <Link to="/lessons/$courseId" params={{ courseId: String(c.id) }}>
                  <BookOpen className="h-3 w-3 mr-1" />View
                </Link>
              </Button>
              <Button
                size="sm" variant="ghost" className="h-8 w-8 p-0"
                onClick={togglePublish}
                disabled={publishMutation.isPending}
                title={c.status === "published" ? "Unpublish" : "Publish"}
              >
                {c.status === "published"
                  ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  : <Eye    className="h-3.5 w-3.5 text-emerald-600" />}
              </Button>
              <Button
                size="sm" variant="ghost"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(c.id, c.title)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {/* Teacher */}
          {isTeacher && (
            <>
              <Button asChild size="sm" className="flex-1 h-8 text-xs gradient-primary text-white border-0">
                <Link to="/lessons/$courseId" params={{ courseId: String(c.id) }}>
                  <Settings className="h-3 w-3 mr-1" />Manage
                </Link>
              </Button>
              <Button
                size="sm" variant="outline" className="h-8 w-8 p-0"
                onClick={togglePublish}
                disabled={publishMutation.isPending}
                title={c.status === "published" ? "Unpublish" : "Publish"}
              >
                {c.status === "published"
                  ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  : <Eye    className="h-3.5 w-3.5 text-emerald-600" />}
              </Button>
            </>
          )}

          {/* Student */}
          {isStudent && (
            isLocked ? (
              <Button asChild size="sm" className="w-full h-8 text-xs gradient-primary text-white border-0">
                <Link to="/payment/$courseId" params={{ courseId: String(c.id) }}>
                  <Lock className="h-3 w-3 mr-1" />Enroll · ${price}
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="w-full h-8 text-xs gradient-primary text-white border-0">
                <Link to="/lessons/$courseId" params={{ courseId: String(c.id) }}>
                  <PlayCircle className="h-3 w-3 mr-1" />
                  {isEnrolled ? "Continue" : "Start"}
                </Link>
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
function CoursesPage() {
  const { role } = useAuth();
  const [search,       setSearch]       = useState("");
  const [category,     setCategory]     = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen,   setCreateOpen]   = useState(false);

  const isAdmin   = role === "admin" || role === "super_admin";
  const isTeacher = role === "teacher";
  const isStudent = role === "student";

  const apiParams = {
    ...(search                          ? { search }                  : {}),
    ...(category !== "all"              ? { category }                : {}),
    ...(statusFilter !== "all"          ? { status: statusFilter }    : {}),
    // Students only see published courses
    ...(isStudent && statusFilter === "all" ? { status: "published" } : {}),
  };

  const { data: raw, isLoading, error } = useCourses(apiParams);
  const courses: ApiCourseListItem[] = Array.isArray(raw)
    ? raw
    : (raw as any)?.results ?? [];

  // Students: know which courses they're enrolled in
  const { data: enrollRaw } = useEnrollments();
  const enrollments = Array.isArray(enrollRaw)
    ? enrollRaw
    : (enrollRaw as any)?.results ?? [];
  const enrolledIds = useMemo(
    () => new Set<number>(
      enrollments
        .filter((e: any) => e.status === "active" || e.status === "completed")
        .map((e: any) => e.course as number)
    ),
    [enrollments]
  );

  const categories = useMemo(
    () => Array.from(new Set(courses.map(c => c.category).filter(Boolean))),
    [courses]
  );

  const deleteMutation = useDeleteCourse();

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Course deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete");
    }
  }

  const stats = {
    total:    courses.length,
    premium:  courses.filter(c => c.is_premium).length,
    published: courses.filter(c => c.status === "published").length,
    enrolled: enrolledIds.size,
  };

  return (
    <RequireAuth>
      <AppLayout>
        <div className="space-y-4 max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Courses</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isStudent
                  ? `${stats.enrolled} enrolled · ${stats.total} available`
                  : isTeacher
                  ? `${stats.total} courses · ${stats.published} published`
                  : `${stats.total} total · ${stats.premium} premium`}
              </p>
            </div>
            {(isAdmin || isTeacher) && (
              <Button
                size="sm"
                className="gradient-primary text-white border-0 gap-1.5 h-8 text-xs"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                {isTeacher ? "New course" : "Add course"}
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search courses…"
                className="pl-9 h-9 text-sm"
              />
            </div>
            {categories.length > 0 && (
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-sm w-full sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize text-sm">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {(isAdmin || isTeacher) && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-sm w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Loading courses…</p>
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {(error as any)?.message?.includes("Cannot connect")
                  ? "Backend offline — start the Django server"
                  : "Failed to load courses"}
              </p>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && courses.length === 0 && (
            <div className="py-16 text-center">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No courses found.</p>
            </div>
          )}

          {/* Grid — 1 col mobile, 2 col tablet, 3 col desktop */}
          {!isLoading && !error && courses.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {courses.map(c => (
                <CourseCard
                  key={c.id}
                  course={c}
                  role={role ?? "student"}
                  isEnrolled={enrolledIds.has(c.id)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        <CreateCourseDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      </AppLayout>
    </RequireAuth>
  );
}
