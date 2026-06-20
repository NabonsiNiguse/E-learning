import { useState, useRef } from "react";
import { Upload, X, Send, FileText, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAssignment } from "@/context/assignment-context";
import { useApp } from "@/context/app-context";
import type { Assignment } from "@/lib/mock-data";
import { toast } from "sonner";

interface SubmitDialogProps {
  assignment: Assignment;
  open: boolean;
  onClose: () => void;
}

export function SubmitDialog({ assignment, open, onClose }: SubmitDialogProps) {
  const { submitAssignment } = useAssignment();
  const { currentUser } = useApp();

  const [text, setText]         = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const size = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(0)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    setFileSize(size);
  };

  const isValid = (assignment.allow_text_response && text.trim()) ||
                  (assignment.allow_file_upload && fileName);

  const handleSubmit = () => {
    if (!isValid) { toast.error("Please add a text response or upload a file."); return; }
    const studentId = currentUser?.id?.toString() ?? "u3";
    const studentName = currentUser?.full_name ?? "Student";
    const avatar = `${currentUser?.first_name?.[0] ?? "S"}${currentUser?.last_name?.[0] ?? "T"}`;
    submitAssignment({
      assignment_id: assignment.id,
      student_id:    studentId,
      student_name:  studentName,
      student_avatar: avatar,
      text_response: text.trim(),
      file_name:     fileName,
      file_size:     fileSize,
      is_late:       new Date() > new Date(assignment.due_date),
    });
    toast.success("Assignment submitted successfully!");
    setText(""); setFileName(null); setFileSize(null);
    onClose();
  };

  const isPastDue = new Date() > new Date(assignment.due_date);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4 text-primary" />
            Submit assignment
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1 truncate">{assignment.title}</p>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          {isPastDue && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-600">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              This assignment is past due. Your submission will be marked as late.
            </div>
          )}

          {/* Text response */}
          {assignment.allow_text_response && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Written response {!assignment.allow_file_upload && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your answer here…"
                className="min-h-[140px] resize-none text-sm"
              />
            </div>
          )}

          {/* File upload */}
          {assignment.allow_file_upload && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                File attachment {!assignment.allow_text_response && <span className="text-destructive">*</span>}
              </Label>
              {fileName ? (
                <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
                  <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {fileName.split(".").pop()?.toUpperCase().slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground">{fileSize}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => { setFileName(null); setFileSize(null); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 cursor-pointer transition-colors",
                    dragging ? "border-primary bg-primary-soft" : "border-border hover:border-primary/50 hover:bg-secondary/40"
                  )}
                >
                  <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  <Upload className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Drop file here or <span className="text-primary font-medium">browse</span></p>
                  <p className="text-xs text-muted-foreground/60">Any file type accepted</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-secondary/20">
          <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4 mr-1" />Cancel</Button>
          <Button
            size="sm"
            className="gradient-primary text-white border-0 shadow-glow gap-1.5"
            onClick={handleSubmit}
            disabled={!isValid}
          >
            <Send className="h-4 w-4" />Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
