import { useState, useMemo } from "react";
import {
  Search, Upload, Filter, FileText, Download,
  BookOpen, SlidersHorizontal, X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useMaterials } from "@/context/materials-context";
import { useApp } from "@/context/app-context";
import { mockCourses, type FileType, type Material } from "@/lib/mock-data";
import { FILE_TYPE_CONFIG } from "./file-type-config";
import { MaterialCard } from "./material-card";
import { UploadDialog } from "./upload-dialog";
import { PreviewPanel } from "./preview-panel";
import { toast } from "sonner";

const FILE_TYPES: { value: FileType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "pdf", label: "PDF"  },
  { value: "ppt", label: "PPT"  },
  { value: "doc", label: "DOC"  },
  { value: "xls", label: "XLS"  },
  { value: "zip", label: "ZIP"  },
  { value: "txt", label: "TXT"  },
  { value: "img", label: "IMG"  },
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest first"   },
  { value: "date_asc",  label: "Oldest first"   },
  { value: "name_asc",  label: "Name A–Z"       },
  { value: "downloads", label: "Most downloaded" },
];

// Summary stat card
function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: typeof FileText; label: string; value: string | number; color: string;
}) {
  return (
    <Card className="p-4 border-border shadow-soft flex items-center gap-3">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xl font-bold font-display leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </Card>
  );
}

export function MaterialsPage() {
  const { materials, deleteMaterial } = useMaterials();
  const { role, currentUser } = useApp();

  const isTeacher = role === "teacher" || role === "admin";
  const instructorName = currentUser?.full_name ?? "Sara Bekele";

  // Filters
  const [search, setSearch]       = useState("");
  const [courseFilter, setCourse] = useState("all");
  const [typeFilter, setType]     = useState<FileType | "all">("all");
  const [sortBy, setSortBy]       = useState("date_desc");
  const [showFilters, setShowFilters] = useState(false);

  // UI state
  const [uploadOpen, setUploadOpen]     = useState(false);
  const [previewMat, setPreviewMat]     = useState<Material | null>(null);

  // Courses available in the filter (teachers see only their own)
  const availableCourses = isTeacher && role === "teacher"
    ? mockCourses.filter((c) => c.instructor === instructorName)
    : mockCourses;

  // Filtered + sorted materials
  const filtered = useMemo(() => {
    let list = [...materials];

    // Students only see materials for unlocked courses
    if (role === "student") {
      // In mock mode all non-locked courses are accessible
      list = list.filter((m) => {
        const course = mockCourses.find((c) => c.id === m.course_id);
        return !course?.locked;
      });
    }

    // Teachers see only their own materials
    if (role === "teacher") {
      list = list.filter((m) => m.uploaded_by === instructorName);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.course_title.toLowerCase().includes(q) ||
          m.file_name.toLowerCase().includes(q)
      );
    }

    if (courseFilter !== "all") {
      list = list.filter((m) => m.course_id === courseFilter);
    }

    if (typeFilter !== "all") {
      list = list.filter((m) => m.file_type === typeFilter);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "date_desc") return b.uploaded_at.localeCompare(a.uploaded_at);
      if (sortBy === "date_asc")  return a.uploaded_at.localeCompare(b.uploaded_at);
      if (sortBy === "name_asc")  return a.title.localeCompare(b.title);
      if (sortBy === "downloads") return b.downloads - a.downloads;
      return 0;
    });

    return list;
  }, [materials, search, courseFilter, typeFilter, sortBy, role, instructorName]);

  // Stats
  const totalDownloads = filtered.reduce((a, m) => a + m.downloads, 0);
  const typeBreakdown  = FILE_TYPES.slice(1).map((t) => ({
    ...t,
    count: filtered.filter((m) => m.file_type === t.value).length,
  })).filter((t) => t.count > 0);

  const activeFilters = [
    courseFilter !== "all" && "course",
    typeFilter   !== "all" && "type",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setCourse("all");
    setType("all");
    setSearch("");
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-display font-bold">Materials</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isTeacher
              ? "Manage and share learning resources with your students"
              : "Access learning resources shared by your instructors"}
          </p>
        </div>
        {isTeacher && (
          <Button
            className="gradient-primary text-white border-0 shadow-glow gap-1.5"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Upload material
          </Button>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={FileText}  label="Total files"    value={filtered.length}  color="gradient-primary" />
        <StatCard icon={Download}  label="Total downloads" value={totalDownloads.toLocaleString()} color="bg-sky-500" />
        <StatCard icon={BookOpen}  label="Courses"        value={new Set(filtered.map((m) => m.course_id)).size} color="bg-amber-500" />
        <StatCard icon={Filter}    label="File types"     value={typeBreakdown.length} color="bg-violet-500" />
      </div>

      {/* ── Search + filters bar ── */}
      <Card className="p-4 border-border shadow-soft">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, course, or filename…"
              className="pl-9 h-10"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <Button
            variant="outline"
            className={cn("h-10 gap-1.5 shrink-0", showFilters && "border-primary text-primary")}
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilters > 0 && (
              <Badge className="h-4 min-w-4 px-1 text-[10px] bg-primary border-0 ml-0.5">
                {activeFilters}
              </Badge>
            )}
          </Button>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-10 w-[160px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <>
            <Separator className="my-3" />
            <div className="flex flex-wrap gap-3 items-end">
              {/* Course filter */}
              <div className="space-y-1 min-w-[200px]">
                <p className="text-xs text-muted-foreground font-medium">Course</p>
                <Select value={courseFilter} onValueChange={setCourse}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {availableCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File type filter */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">File type</p>
                <div className="flex flex-wrap gap-1.5">
                  {FILE_TYPES.map((t) => {
                    const active = typeFilter === t.value;
                    const cfg    = t.value !== "all" ? FILE_TYPE_CONFIG[t.value] : null;
                    return (
                      <button
                        key={t.value}
                        onClick={() => setType(t.value as FileType | "all")}
                        className={cn(
                          "h-8 px-3 rounded-lg text-xs font-medium border transition-colors",
                          active
                            ? cfg
                              ? cn(cfg.bg, cfg.text, cfg.border)
                              : "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeFilters > 0 && (
                <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground" onClick={clearFilters}>
                  <X className="h-3.5 w-3.5 mr-1" /> Clear filters
                </Button>
              )}
            </div>
          </>
        )}
      </Card>

      {/* ── Content area ── */}
      <div className={cn(
        "grid gap-5",
        previewMat ? "lg:grid-cols-[1fr_340px]" : "grid-cols-1"
      )}>
        {/* Material list */}
        <div className="space-y-3">
          {/* Result count + type chips */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "file" : "files"}
              {search && <> matching <strong className="text-foreground">"{search}"</strong></>}
            </p>
            {typeBreakdown.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {typeBreakdown.map((t) => {
                  const cfg = FILE_TYPE_CONFIG[t.value as FileType];
                  return (
                    <span
                      key={t.value}
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
                        cfg.bg, cfg.text, cfg.border
                      )}
                    >
                      {cfg.label} · {t.count}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <Card className="border-border shadow-soft">
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <FileText className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">No materials found</p>
                <p className="text-xs">
                  {isTeacher ? "Upload your first material using the button above." : "No materials have been shared yet."}
                </p>
                {activeFilters > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
                )}
              </div>
            </Card>
          ) : (
            filtered.map((m) => (
              <MaterialCard
                key={m.id}
                material={m}
                canDelete={isTeacher && m.uploaded_by === instructorName}
                onDelete={(id) => {
                  deleteMaterial(id);
                  if (previewMat?.id === id) setPreviewMat(null);
                  toast.success("Material deleted.");
                }}
                onPreview={(mat) =>
                  setPreviewMat((prev) => (prev?.id === mat.id ? null : mat))
                }
              />
            ))
          )}
        </div>

        {/* Preview panel */}
        {previewMat && (
          <Card className="border-border shadow-soft overflow-hidden h-fit lg:sticky lg:top-20">
            <PreviewPanel
              material={previewMat}
              onClose={() => setPreviewMat(null)}
            />
          </Card>
        )}
      </div>

      {/* Upload dialog */}
      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
