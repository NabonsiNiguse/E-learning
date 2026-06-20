import { useState } from "react";
import {
  Inbox, Send, Megaphone, BookOpen, MessageSquare,
  Pencil, Reply, Search, Shield, GraduationCap, User, Crown, ChevronLeft,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMessaging } from "@/context/messaging-context";
import { useApp } from "@/context/app-context";
import { ComposeDialog } from "./compose-dialog";
import type { MockMessage, MessageType, Role } from "@/lib/mock-data";

type Tab = "inbox" | "sent" | "announcements";

const msgTypeConfig: Record<MessageType, { label: string; icon: typeof Inbox; color: string; bgColor: string }> = {
  direct:        { label: "Direct",       icon: MessageSquare, color: "text-sky-600 dark:text-sky-400",       bgColor: "bg-sky-50 dark:bg-sky-950/30" },
  announcement:  { label: "Announcement", icon: Megaphone,     color: "text-violet-600 dark:text-violet-400", bgColor: "bg-violet-50 dark:bg-violet-950/30" },
  course_update: { label: "Course update",icon: BookOpen,      color: "text-amber-600 dark:text-amber-400",   bgColor: "bg-amber-50 dark:bg-amber-950/30" },
};

const roleConfig: Record<Role, { icon: typeof User; color: string; bgColor: string; label: string }> = {
  admin:   { icon: Crown,          color: "text-rose-600 dark:text-rose-400",       bgColor: "bg-rose-50 dark:bg-rose-950/30",       label: "Admin" },
  teacher: { icon: GraduationCap,  color: "text-blue-600 dark:text-blue-400",       bgColor: "bg-blue-50 dark:bg-blue-950/30",       label: "Teacher" },
  student: { icon: User,           color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", label: "Student" },
};

function MessageRow({
  msg,
  isSelected,
  onClick,
}: {
  msg: MockMessage;
  isSelected: boolean;
  onClick: () => void;
}) {
  const cfg = msgTypeConfig[msg.message_type];
  const roleCfg = roleConfig[msg.sender_role];
  const Icon = cfg.icon;
  const RoleIcon = roleCfg.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all duration-200 border-b border-border last:border-0",
        "hover:bg-gradient-to-r hover:from-secondary/80 hover:to-secondary/40 hover:shadow-sm",
        isSelected && "bg-gradient-to-r from-primary/10 to-primary/5 border-l-2 border-l-primary",
        !msg.is_read && "bg-primary/5"
      )}
    >
      {/* Avatar with role indicator */}
      <div className="relative shrink-0 mt-0.5">
        <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-semibold shadow-sm">
          {msg.sender_avatar}
        </div>
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center shadow-sm border border-background",
          roleCfg.bgColor
        )}>
          <RoleIcon className={cn("h-2.5 w-2.5", roleCfg.color)} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn("text-sm truncate", !msg.is_read && "font-semibold")}>
              {msg.sender_name}
            </span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] h-4 px-1.5 font-medium border-0 shrink-0",
                roleCfg.bgColor,
                roleCfg.color
              )}
            >
              {roleCfg.label}
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">{msg.created_at}</span>
        </div>
        
        <div className="flex items-center gap-1.5 mb-1">
          <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded", cfg.bgColor)}>
            <Icon className={cn("h-3 w-3 shrink-0", cfg.color)} />
            <span className={cn("text-[10px] font-medium", cfg.color)}>{cfg.label}</span>
          </div>
          <span className={cn("text-sm truncate flex-1", !msg.is_read && "font-medium")}>{msg.subject}</span>
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{msg.body}</p>
        
        <div className="flex items-center gap-2 mt-2">
          {msg.course_title && (
            <Badge variant="outline" className="text-[10px] h-5 px-2 font-normal">
              <BookOpen className="h-2.5 w-2.5 mr-1" />
              {msg.course_title}
            </Badge>
          )}
          {msg.reply_count > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5 px-2">
              <Reply className="h-2.5 w-2.5 mr-1" />
              {msg.reply_count}
            </Badge>
          )}
          {!msg.is_read && (
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-primary">New</span>
              <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function MessageDetail({ msg, onReply, onBack }: { msg: MockMessage; onReply: () => void; onBack?: () => void }) {
  const cfg = msgTypeConfig[msg.message_type];
  const roleCfg = roleConfig[msg.sender_role];
  const Icon = cfg.icon;
  const RoleIcon = roleCfg.icon;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border bg-gradient-to-b from-secondary/30 to-transparent">
        {/* Mobile back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 md:hidden transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back to messages
          </button>
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md", cfg.bgColor)}>
                <Icon className={cn("h-4 w-4", cfg.color)} />
                <span className={cn("text-xs font-semibold", cfg.color)}>{cfg.label}</span>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold leading-snug mb-4">{msg.subject}</h2>
            
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold shadow-md">
                    {msg.sender_avatar}
                  </div>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full flex items-center justify-center shadow-sm border-2 border-background",
                    roleCfg.bgColor
                  )}>
                    <RoleIcon className={cn("h-3 w-3", roleCfg.color)} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{msg.sender_name}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] h-5 px-2 font-medium border-0",
                        roleCfg.bgColor,
                        roleCfg.color
                      )}
                    >
                      <RoleIcon className="h-2.5 w-2.5 mr-1" />
                      {roleCfg.label}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{msg.created_at}</span>
                </div>
              </div>
            </div>
            
            {msg.course_title && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50 border border-border w-fit">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{msg.course_title}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <ScrollArea className="flex-1 px-6 py-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{msg.body}</p>
        </div>
      </ScrollArea>

      {/* Reply action — only for direct messages */}
      {msg.message_type === "direct" && (
        <div className="px-6 py-4 border-t border-border bg-gradient-to-t from-secondary/30 to-transparent">
          <Button
            size="sm"
            className="gradient-primary text-white border-0 shadow-glow gap-2"
            onClick={onReply}
          >
            <Reply className="h-4 w-4" />
            Reply to {msg.sender_name}
          </Button>
        </div>
      )}
    </div>
  );
}

export function MessageInbox() {
  const { messages, unreadMessageCount, markMessageRead, setComposeOpen, setReplyTo } = useMessaging();
  const { role, currentUser } = useApp();
  const userId = currentUser?.id?.toString() ?? "";

  const [tab, setTab] = useState<Tab>("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // Mobile: show detail panel when a message is selected
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  /**
   * Visibility rules:
   *   Student  → inbox: messages where recipient_id === me OR broadcast to all
   *              sent:  messages where sender_id === me
   *   Teacher  → inbox: messages where recipient_id === me OR course_update for their courses
   *              sent:  messages where sender_id === me
   *   Admin    → sees everything
   */
  const inboxMessages = messages.filter((m) => {
    if (m.sender_role === role && m.sender_id === userId) return false; // exclude own sent
    if (role === "admin") return true;
    if (m.recipient_id === null) return true; // broadcasts visible to all
    return m.recipient_id === userId;
  });

  const sentMessages = messages.filter((m) => m.sender_id === userId);
  const announcements = messages.filter((m) => m.message_type === "announcement");

  const tabMessages: Record<Tab, MockMessage[]> = {
    inbox:         inboxMessages,
    sent:          sentMessages,
    announcements: announcements,
  };

  const filtered = tabMessages[tab].filter(
    (m) =>
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.body.toLowerCase().includes(search.toLowerCase()) ||
      m.sender_name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = messages.find((m) => m.id === selectedId) ?? null;

  const handleSelect = (msg: MockMessage) => {
    setSelectedId(msg.id);
    markMessageRead(msg.id);
    setMobileShowDetail(true);
  };

  const handleReply = (msg: MockMessage) => {
    setReplyTo(msg);
    setComposeOpen(true);
  };

  const tabs: { id: Tab; label: string; icon: typeof Inbox; count?: number }[] = [
    { id: "inbox",         label: "Inbox",         icon: Inbox,    count: unreadMessageCount },
    { id: "sent",          label: "Sent",          icon: Send },
    { id: "announcements", label: "Announcements", icon: Megaphone },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-display font-bold">Messages</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadMessageCount > 0 ? `${unreadMessageCount} unread message${unreadMessageCount === 1 ? '' : 's'}` : 'All caught up'}
          </p>
        </div>
        <Button
          className="gradient-primary text-white border-0 shadow-glow gap-2"
          onClick={() => { setReplyTo(null); setComposeOpen(true); }}
        >
          <Pencil className="h-4 w-4" />
          Compose
        </Button>
      </div>

      <Card className="border-border shadow-soft overflow-hidden">
        <div className="grid md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr] min-h-[600px]">
          {/* Left panel — hidden on mobile when detail is open */}
          <div className={cn(
            "border-r border-border flex flex-col bg-secondary/20",
            mobileShowDetail ? "hidden md:flex" : "flex"
          )}>
            {/* Tabs */}
            <div className="flex border-b border-border bg-background">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setSelectedId(null); }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-medium transition-all relative",
                      tab === t.id
                        ? "text-primary bg-gradient-to-b from-primary/10 to-transparent border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.label}</span>
                    {t.count != null && t.count > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-primary text-white font-semibold shadow-sm">
                        {t.count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="px-3 py-3 border-b border-border bg-background">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search messages..."
                  className="pl-9 h-9 text-sm bg-secondary/60 border-border focus:bg-background"
                />
              </div>
            </div>

            {/* Message list */}
            <ScrollArea className="flex-1">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground px-4">
                  <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
                    <Inbox className="h-8 w-8 opacity-30" />
                  </div>
                  <p className="text-sm font-medium">No messages found</p>
                  <p className="text-xs mt-1">Try adjusting your search</p>
                </div>
              ) : (
                filtered.map((msg) => (
                  <MessageRow
                    key={msg.id}
                    msg={msg}
                    isSelected={selectedId === msg.id}
                    onClick={() => handleSelect(msg)}
                  />
                ))
              )}
            </ScrollArea>
          </div>

          {/* Right panel — full screen on mobile when detail is open */}
          <div className={cn(
            "flex flex-col bg-background",
            mobileShowDetail ? "flex" : "hidden md:flex"
          )}>
            {selected ? (
              <MessageDetail
                msg={selected}
                onReply={() => handleReply(selected)}
                onBack={() => setMobileShowDetail(false)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 px-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 opacity-40" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-foreground">Select a message</p>
                  <p className="text-sm mt-1.5">Choose a message from the list to read it</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-2"
                  onClick={() => { setReplyTo(null); setComposeOpen(true); }}
                >
                  <Pencil className="h-4 w-4" />
                  Compose new message
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <ComposeDialog />
    </div>
  );
}
