import { useState } from "react";
import { Send, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMessaging } from "@/context/messaging-context";
import { useApp } from "@/context/app-context";
import { mockUsers, mockCourses } from "@/lib/mock-data";
import type { MessageType, MockMessage } from "@/lib/mock-data";

export function ComposeDialog() {
  const { composeOpen, setComposeOpen, replyTo, setReplyTo, sendMessage } = useMessaging();
  const { role, currentUser } = useApp();

  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : "");
  const [body, setBody] = useState("");
  const [recipientId, setRecipientId] = useState(replyTo?.sender_id ?? "");
  const [courseId, setCourseId] = useState(replyTo?.course_id ?? "");
  const [msgType, setMsgType] = useState<MessageType>(
    role === "admin" ? "announcement" : role === "teacher" ? "course_update" : "direct"
  );

  const myCourses = mockCourses.filter((c) =>
    role === "teacher" ? c.instructor === currentUser.full_name : true
  );

  /**
   * Messaging permission rules:
   *   Student  → can only message teachers (of any course they're in)
   *   Teacher  → can only message their own students or admins
   *   Admin    → can message anyone
   */
  const recipientOptions = () => {
    if (role === "student") {
      // Students can only message teachers — not other students
      return mockUsers.filter((u) => u.role === "teacher");
    }
    if (role === "teacher") {
      // Teachers can message their students or admins — not other teachers
      return mockUsers.filter((u) => u.role === "student" || u.role === "admin");
    }
    // Admin can message anyone except themselves
    return mockUsers.filter((u) => u.id !== currentUser?.id?.toString());
  };

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) return;

    const recipient = mockUsers.find((u) => u.id === recipientId);
    const course    = mockCourses.find((c) => c.id === courseId);

    const msg: Omit<MockMessage, "id" | "created_at" | "reply_count" | "is_read"> = {
      sender_id:      currentUser?.id?.toString() ?? "",
      sender_name:    currentUser?.full_name ?? "",
      sender_avatar:  currentUser ? `${currentUser.first_name[0]}${currentUser.last_name[0]}` : "??",
      sender_role:    role,
      recipient_id:   msgType === "announcement" || msgType === "course_update" ? null : (recipient?.id ?? null),
      recipient_name: msgType === "announcement" || msgType === "course_update" ? null : (recipient?.name ?? null),
      course_id:      course?.id ?? null,
      course_title:   course?.title ?? null,
      message_type:   msgType,
      subject,
      body,
      parent_id:      replyTo?.id ?? null,
    };

    sendMessage(msg);
    setComposeOpen(false);
    setReplyTo(null);
    setSubject("");
    setBody("");
    setRecipientId("");
    setCourseId("");
  };

  const handleClose = () => {
    setComposeOpen(false);
    setReplyTo(null);
    setSubject("");
    setBody("");
  };

  const typeLabel: Record<MessageType, string> = {
    direct:       "Direct message",
    announcement: "Announcement (all users)",
    course_update:"Course update (enrolled students)",
  };

  const availableTypes: MessageType[] = role === "admin"
    ? ["announcement", "direct"]
    : role === "teacher"
    ? ["course_update", "direct"]
    : ["direct"];

  return (
    <Dialog open={composeOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            {replyTo ? (
              <>
                <span>Reply to message</span>
                <Badge variant="outline" className="text-xs font-normal">
                  {replyTo.sender_name}
                </Badge>
              </>
            ) : (
              "New message"
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          {/* Message type */}
          {!replyTo && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={msgType} onValueChange={(v) => setMsgType(v as MessageType)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((t) => (
                    <SelectItem key={t} value={t}>{typeLabel[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Recipient — only for direct messages */}
          {(msgType === "direct" || replyTo) && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">To</Label>
              {replyTo ? (
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-secondary/40">
                  <div className="h-6 w-6 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-semibold">
                    {replyTo.sender_avatar}
                  </div>
                  <span className="text-sm">{replyTo.sender_name}</span>
                  <Badge variant="outline" className="text-[10px] capitalize ml-auto">{replyTo.sender_role}</Badge>
                </div>
              ) : (
                <Select value={recipientId} onValueChange={setRecipientId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select recipient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {recipientOptions().map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <span>{u.name}</span>
                          <span className="text-muted-foreground text-xs capitalize">({u.role})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Course — for course updates */}
          {msgType === "course_update" && !replyTo && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select course..." />
                </SelectTrigger>
                <SelectContent>
                  {myCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject..."
              className="h-9"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              className="min-h-[140px] resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-secondary/20">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button
            size="sm"
            className="gradient-primary text-white border-0 shadow-glow"
            onClick={handleSend}
            disabled={!subject.trim() || !body.trim()}
          >
            <Send className="h-4 w-4 mr-1.5" /> Send message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
