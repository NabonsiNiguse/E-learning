import { useState, useRef } from "react";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useMaterials } from "@/context/materials-context";
import { useApp } from "@/context/app-context";
import { mockCourses, mockLessons, type FileType } from "@/lib/mock-data";
import { FILE_TYPE_CONFIG } from "./file-type-config";
import { toast } from "sonner";

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
}

const FILE_TYPES: FileType[] = ["pdf", "ppt", "doc", "xls", "zip", "txt", "img"];

function detectFileType(name: string): FileType {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf")                    return "pdf";
  if (["ppt", "pptx"].includes(ext))   return "ppt";
  if (["doc", "docx"].includes(ext))   return "doc";
  if (["xls", "xlsx"].includes(ext))   return "xls";
  if (ext === "zip")                    return "zip";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "img";
  return "txt";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadDialog({ open, onClose }: UploadDialogProps) {
  const { addMaterial } = useMaterials();
  const { currentUser } = useApp();

  const instructorName   = currentUser?.full_name ?? "Sara Bekele";
  const instructorAvatar = `${currentUser?.first_name?.[0] ?? "S"}${currentUser?.last_name?.[0] ?? "B"}`;

  // My courses only (in mock mode, filter by instructor name)
  const myCourses = mockCourses.filter(
    (c) => c.instructor === instructorName || currentUser?.role === "admin"
  );

  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId]     = useState(myCourses[0]?.id ?? "");
  const [lessonId, setLessonId]     = useState<string>("none");
  const [fileType, setFileType]     = useState<FileType>("pdf");
  const [fileName, setFileName]     = useState("");
  const [fileSize, setFileSize]     = useState("0 KB");
  const [downloadable, setDownloadable] = useState(true);
  const [dragging, setDragging]     = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const selectedCourse = myCourses.find((c) => c.id === courseId);
  const courseLessons  = mockLessons; // in real app: filter by courseId

  const handleFile = (file: File) => {
    setFileName(file.name);
    setFileSize(formatBytes(file.size));
    setFileType(detectFileType(file.name));
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = () => {
    if (!title.trim() || !fileName) {
      toast.error("Please fill in the title and select a file.");
      return;
    }
    const lesson = lessonId !== "none" ? mockLessons.find((l) => l.id === lessonId) : null;
    addMaterial({
      title:               title.trim(),
      description:         description.trim(),
      file_type:           fileType,
      file_name:           fileName,
      file_size:           fileSize,
      course_id:           courseId,
      course_title:        selectedCourse?.title ?? "",
      lesson_id:           lesson?.id ?? null,
      lesson_title:        lesson?.title ?? null,
      uploaded_by:         instructorName,
      uploaded_by_avatar:  instructorAvatar,
      is_downloadable:     downloadable,
    });
    toast.success(`"${title}" uploaded successfully.`);
    // Reset
    setTitle(""); setDescription(""); setFileName(""); setFileSize("0 KB");
    setLessonId("none"); setDownloadable(true);
    onClose();
  };

  const cfg = FILE_TYPE_CONFIG[fileType];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            Upload material
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed",
              "cursor-pointer transition-colors py-8 px-4 text-center",
              dragging
                ? "border-primary bg-primary-soft"
                : "border-border hover:border-primary/50 hover:bg-secondary/40"
            )}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip,.txt,.png,.jpg,.jpeg"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {fileName ? (
              <>
                <div className={cn(
                  "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold",
                  cfg.iconBg
                )}>
                  {cfg.label}
                </div>
                <p className="text-sm font-medium">{fileName}</p>
                <p className="text-xs text-muted-foreground">{fileSize}</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFileName(""); setFileSize("0 KB"); }}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-secondary flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Drop file here or click to browse</p>
                <p className="text-xs text-muted-foreground">PDF, PPT, DOC, XLS, ZIP, TXT, IMG</p>
              </>
            )}
          </div>

          {/* Manual file type override */}
          {fileName && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">File type</Label>
              <Select value={fileType} onValueChange={(v) => setFileType(v as FileType)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{FILE_TYPE_CONFIG[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Title <span className="text-destructive">*</span></Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. React Hooks Cheat Sheet"
              className="h-9"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this material…"
              className="min-h-[72px] resize-none text-sm"
            />
          </div>

          {/* Course */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Course <span className="text-destructive">*</span></Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select course…" />
              </SelectTrigger>
              <SelectContent>
                {myCourses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lesson (optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Lesson (optional)</Label>
            <Select value={lessonId} onValueChange={setLessonId}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific lesson</SelectItem>
                {courseLessons.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Downloadable toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Allow download</p>
              <p className="text-xs text-muted-foreground mt-0.5">Students can download this file</p>
            </div>
            <Switch checked={downloadable} onCheckedChange={setDownloadable} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-secondary/20">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button
            size="sm"
            className="gradient-primary text-white border-0 shadow-glow gap-1.5"
            onClick={handleSubmit}
            disabled={!title.trim() || !fileName}
          >
            <Upload className="h-4 w-4" /> Upload material
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
