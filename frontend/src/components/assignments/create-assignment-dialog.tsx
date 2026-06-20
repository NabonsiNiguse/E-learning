import { useState, useRef } from "react";
import { Plus, X, Save, Paperclip, Trash2 } from "lucide-react";
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
import { useAssignment } from "@/context/assignment-context";
import { useApp } from "@/context/app-context";
import { mockCourses, type AssignmentAttachment } from "@/lib/mock-data";
import { toast } from "sonner";

interface CreateAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateAssignmentDialog({ open, onClose }: CreateAssignmentDialogProps) {
  const { addAssignment } = useAssignment();
  const { currentUser } = useApp();

  const instructorName   = currentUser?.full_name ?? "Sara Bekele";
  const instructorAvatar = `${currentUser?.first_name?.[0] ?? "S"}${currentUser?.last_name?.[0] ?? "B"}`;
  const myCourses = mockCourses.filter(
    (c) => c.instructor === instructorName || currentUser?.role === "admin"
  );

  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [instructions, setInstructions] = useState("");
  const [courseId, setCourseId]         = useState(myCourses[0]?.id ?? "");
  const [dueDate, setDueDate]           = useState("");
  const [maxScore, setMaxScore]         = useState(100);
  const [allowText, setAllowText]       = useState(true);
  const [allowFile, setAllowFile]       = useState(true);
  const [attachments, setAttachments]   = useState<AssignmentAttachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const ext = file.name.split(".").pop() ?? "file";
    const size = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(0)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    setAttachments((prev) => [...prev, { name: file.name, size, type: ext }]);
  };

  const isValid = title.trim() && courseId && dueDate && (allowText || allowFile);

  const handleSave = () => {
    if (!isValid) { toast.error("Please fill in all required fields."); return; }
    const course = myCourses.find((c) => c.id === courseId);
    addAssignment({
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim() || "Complete and submit before the due date.",
      course_id: courseId,
      course_title: course?.title ?? "",
      created_by: instructorName,
      created_by_avatar: instructorAvatar,
      due_date: new Date(dueDate).toISOString(),
      max_score: maxScore,
      attachments,
      allow_text_response: allowText,
      allow_file_upload: allowFile,
    });
    toast.success(`Assignment "${title}" created.`);
    setTitle(""); setDescription(""); setInstructions("");
    setDueDate(""); setMaxScore(100); setAttachments([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] gap-0 p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Create assignment
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Title <span className="text-destructive">*</span></Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Build a React Todo App" className="h-9" />
          </div>

          {/* Course + Due date + Max score */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Course <span className="text-destructive">*</span></Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {myCourses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Due date <span className="text-destructive">*</span></Label>
              <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Max score</Label>
              <Input type="number" min={1} max={1000} value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} className="h-9" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Short description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief summary shown in the assignment list…" className="h-9" />
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Full instructions</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Detailed instructions for students…"
              className="min-h-[100px] resize-none text-sm"
            />
          </div>

          {/* Submission types */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Text response</p>
                <p className="text-xs text-muted-foreground mt-0.5">Students can write an answer</p>
              </div>
              <Switch checked={allowText} onCheckedChange={setAllowText} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">File upload</p>
                <p className="text-xs text-muted-foreground mt-0.5">Students can attach files</p>
              </div>
              <Switch checked={allowFile} onCheckedChange={setAllowFile} />
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Attachments (optional)</Label>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => fileRef.current?.click()}>
                <Paperclip className="h-3.5 w-3.5" /> Add file
              </Button>
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
            {attachments.length > 0 && (
              <div className="space-y-1.5">
                {attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                    <span className="font-medium uppercase text-primary w-8 shrink-0">{a.type}</span>
                    <span className="flex-1 truncate">{a.name}</span>
                    <span className="text-muted-foreground shrink-0">{a.size}</span>
                    <button onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-secondary/20 shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4 mr-1" />Cancel</Button>
          <Button size="sm" className="gradient-primary text-white border-0 shadow-glow gap-1.5" onClick={handleSave} disabled={!isValid}>
            <Save className="h-4 w-4" />Create assignment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
