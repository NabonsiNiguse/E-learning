import { X, Download, BookOpen, Tag, Calendar, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Material } from "@/lib/mock-data";
import { FILE_TYPE_CONFIG } from "./file-type-config";
import { downloadFile, mimeFromName } from "@/lib/download";
import { toast } from "sonner";

interface PreviewPanelProps {
  material: Material | null;
  onClose: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

export function PreviewPanel({ material, onClose }: PreviewPanelProps) {
  if (!material) return null;

  const cfg = FILE_TYPE_CONFIG[material.file_type];

  const handleDownload = () => {
    downloadFile(material.file_name, mimeFromName(material.file_name));
    toast.success(`Downloading "${material.file_name}"…`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <h3 className="font-semibold text-sm truncate pr-4">File preview</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-y-auto">
        {/* Mock preview — in production embed an iframe or PDF viewer */}
        <div className={cn(
          "mx-5 mt-5 rounded-xl bg-gradient-to-br flex flex-col items-center justify-center gap-3 py-14",
          cfg.iconBg
        )}>
          <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-xl font-bold">
            {cfg.label}
          </div>
          <p className="text-white/90 text-sm font-medium px-4 text-center">{material.file_name}</p>
          <p className="text-white/60 text-xs">{material.file_size}</p>
        </div>

        {/* Info */}
        <div className="px-5 py-5 space-y-4">
          <div>
            <h2 className="font-semibold text-base leading-snug">{material.title}</h2>
            {material.description && (
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {material.description}
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Course</p>
                <p className="font-medium">{material.course_title}</p>
              </div>
            </div>

            {material.lesson_title && (
              <div className="flex items-center gap-2.5">
                <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Lesson</p>
                  <p className="font-medium">{material.lesson_title}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Uploaded by</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-5 w-5 rounded-full gradient-primary flex items-center justify-center text-white text-[9px] font-semibold">
                    {material.uploaded_by_avatar}
                  </div>
                  <p className="font-medium">{material.uploaded_by}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Upload date</p>
                <p className="font-medium">{formatDate(material.uploaded_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">File details</p>
                <p className="font-medium">{material.file_size} · {material.downloads} downloads</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs", cfg.bg, cfg.text, cfg.border)}
            >
              {material.file_name.split(".").pop()?.toUpperCase()} file
            </Badge>
            {material.is_downloadable ? (
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Downloadable
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                View only
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Footer action */}
      {material.is_downloadable && (
        <div className="px-5 py-4 border-t border-border shrink-0">
          <Button
            className="w-full gradient-primary text-white border-0 shadow-glow gap-2"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            Download {material.file_name}
          </Button>
        </div>
      )}
    </div>
  );
}
