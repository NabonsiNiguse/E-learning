import { Download, Eye, Trash2, BookOpen, Tag, Calendar, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Material } from "@/lib/mock-data";
import { FILE_TYPE_CONFIG } from "./file-type-config";
import { downloadFile, mimeFromName } from "@/lib/download";
import { toast } from "sonner";

interface MaterialCardProps {
  material: Material;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
  onPreview?: (material: Material) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function MaterialCard({
  material, canDelete, onDelete, onPreview,
}: MaterialCardProps) {
  const cfg = FILE_TYPE_CONFIG[material.file_type];

  const handleDownload = () => {
    downloadFile(material.file_name, mimeFromName(material.file_name));
    toast.success(`Downloading "${material.file_name}"…`);
  };

  return (
    <Card className="group flex flex-col sm:flex-row items-start gap-4 p-4 border-border shadow-soft hover:shadow-glow transition-shadow">
      {/* File type icon tile */}
      <div className={cn(
        "h-14 w-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shrink-0",
        cfg.iconBg
      )}>
        {cfg.label}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h3 className="font-semibold text-sm leading-snug">{material.title}</h3>
          <Badge
            variant="outline"
            className={cn("text-[10px] font-medium shrink-0", cfg.bg, cfg.text, cfg.border)}
          >
            {material.file_name.split(".").pop()?.toUpperCase()}
          </Badge>
        </div>

        {material.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{material.description}</p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3 shrink-0" />
            {material.course_title}
          </span>
          {material.lesson_title && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3 shrink-0" />
              {material.lesson_title}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 shrink-0" />
            {formatDate(material.uploaded_at)}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3 shrink-0" />
            {material.uploaded_by}
          </span>
          <span className="text-muted-foreground/60">{material.file_size}</span>
          <span className="text-muted-foreground/60">{material.downloads} downloads</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => onPreview?.(material)}
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Preview</span>
        </Button>

        {material.is_downloadable && (
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs gradient-primary text-white border-0"
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        )}

        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete?.(material.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </Card>
  );
}
