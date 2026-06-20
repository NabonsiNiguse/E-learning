import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, CheckCheck, Megaphone, BookOpen, CreditCard, UserPlus, MessageSquare, Info, Search, Sparkles, Clock, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMessaging } from "@/context/messaging-context";
import type { NotificationType, MockNotification } from "@/lib/mock-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Learnly" }] }),
  component: NotificationsPage,
});

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const TYPE_CONFIG: Record<NotificationType, {
  icon: typeof Bell; color: string; bg: string; ring: string; label: string;
}> = {
  announcement:    { icon: Megaphone,     color: "text-violet-600 dark:text-violet-400",  bg: "bg-violet-100 dark:bg-violet-900/40",  ring: "ring-violet-200 dark:ring-violet-800",  label: "Announcement" },
  course_update:   { icon: BookOpen,      color: "text-sky-600 dark:text-sky-400",        bg: "bg-sky-100 dark:bg-sky-900/40",        ring: "ring-sky-200 dark:ring-sky-800",        label: "Course update" },
  enrollment:      { icon: UserPlus,      color: "text-emerald-600 dark:text-emerald-400",bg: "bg-emerald-100 dark:bg-emerald-900/40",ring: "ring-emerald-200 dark:ring-emerald-800",label: "Enrollment" },
  payment_success: { icon: CreditCard,    color: "text-emerald-600 dark:text-emerald-400",bg: "bg-emerald-100 dark:bg-emerald-900/40",ring: "ring-emerald-200 dark:ring-emerald-800",label: "Payment" },
  payment_failed:  { icon: CreditCard,    color: "text-red-600 dark:text-red-400",        bg: "bg-red-100 dark:bg-red-900/40",        ring: "ring-red-200 dark:ring-red-800",        label: "Payment failed" },
  system:          { icon: Info,          color: "text-slate-500 dark:text-slate-400",    bg: "bg-slate-100 dark:bg-slate-800",       ring: "ring-slate-200 dark:ring-slate-700",    label: "System" },
  message:         { icon: MessageSquare, color: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-100 dark:bg-amber-900/40",    ring: "ring-amber-200 dark:ring-amber-800",    label: "Message" },
};

const FILTERS = ["all", "announcement", "course_update", "enrollment", "message", "system"] as const;
type FilterType = typeof FILTERS[number];

// ---------------------------------------------------------------------------
// Notification item
// ---------------------------------------------------------------------------
function NotificationItem({
  n, onRead, isExpanded, onToggleExpand,
}: {
  n: MockNotification;
  onRead: (id: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const cfg  = TYPE_CONFIG[n.type];
  const Icon = cfg.icon;
  const hasLongMessage = n.message.length > 120;

  return (
    <div
      className={cn(
        "group w-full flex items-start gap-4 px-5 py-4 transition-all duration-200",
        "hover:bg-gradient-to-r hover:from-secondary/80 hover:to-secondary/30",
        !n.is_read && "bg-primary/[0.04] dark:bg-primary/[0.08]",
      )}
    >
      {/* Icon bubble */}
      <div className={cn(
        "relative mt-0.5 h-10 w-10 rounded-2xl flex items-center justify-center shrink-0",
        "ring-1 shadow-sm transition-transform duration-200 group-hover:scale-105",
        cfg.bg, cfg.ring,
      )}>
        <Icon className={cn("h-4.5 w-4.5 h-[18px] w-[18px]", cfg.color)} />
        {!n.is_read && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={() => onRead(n.id)}
            className={cn(
              "text-sm leading-snug text-left flex-1",
              !n.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/80",
            )}
          >
            {n.title}
          </button>
          <span className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            {n.created_at}
          </span>
        </div>

        <p className={cn(
          "text-xs text-muted-foreground mt-1 leading-relaxed",
          !isExpanded && hasLongMessage && "line-clamp-2",
        )}>
          {n.message}
        </p>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
            cfg.bg, cfg.color,
          )}>
            <Icon className="h-2.5 w-2.5" />
            {cfg.label}
          </span>
          {!n.is_read && (
            <span className="text-[10px] font-semibold text-primary">New</span>
          )}
          {hasLongMessage && (
            <button
              onClick={onToggleExpand}
              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              {isExpanded ? (
                <>Show less <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>Show more <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
function NotificationsPage() {
  const { notifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead } = useMessaging();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const visible = notifications.filter((n) => {
    const matchType   = filter === "all" || n.type === filter;
    const matchSearch = !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const unread = visible.filter((n) => !n.is_read).length;
  const total  = notifications.length;

  // Group by read/unread
  const unreadItems = visible.filter((n) => !n.is_read);
  const readItems   = visible.filter((n) => n.is_read);

  return (
    <RequireAuth>
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2.5">
              <div className="relative">
                <Bell className="h-6 w-6 text-primary" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                )}
              </div>
              Notifications
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {unreadNotificationCount > 0
                ? `${unreadNotificationCount} unread · ${total} total`
                : `All caught up · ${total} total`}
            </p>
          </div>
          {unreadNotificationCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-9"
              onClick={markAllNotificationsRead}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total",   value: total,                  color: "from-slate-400 to-slate-500",    icon: Bell },
            { label: "Unread",  value: unreadNotificationCount, color: "from-primary to-primary/70",    icon: Sparkles },
            { label: "Types",   value: new Set(notifications.map(n => n.type)).size, color: "from-violet-400 to-violet-500", icon: Filter },
          ].map((s) => (
            <Card key={s.label} className="p-3.5 border-border shadow-soft flex items-center gap-3">
              <div className={cn("h-9 w-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", s.color)}>
                <s.icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold font-display leading-none tabular-nums">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Search + filter ── */}
        <Card className="p-4 border-border shadow-soft space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications…"
              className="pl-9 h-10"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map((t) => {
              const count = t === "all"
                ? notifications.length
                : notifications.filter((n) => n.type === t).length;
              if (count === 0 && t !== "all") return null;
              return (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    filter === t
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-secondary/50",
                  )}
                >
                  {t !== "all" && (() => {
                    const cfg = TYPE_CONFIG[t as NotificationType];
                    const Icon = cfg.icon;
                    return <Icon className="h-3 w-3" />;
                  })()}
                  {t === "all" ? "All" : TYPE_CONFIG[t as NotificationType].label}
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    filter === t ? "bg-white/20" : "bg-muted",
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* ── Count line ── */}
        <p className="text-sm text-muted-foreground px-0.5">
          {visible.length} notification{visible.length !== 1 ? "s" : ""}
          {unread > 0 && (
            <span className="ml-2 text-primary font-medium">· {unread} unread</span>
          )}
        </p>

        {/* ── Empty state ── */}
        {visible.length === 0 && (
          <Card className="border-border shadow-soft">
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center">
                <Bell className="h-8 w-8 opacity-30" />
              </div>
              <p className="text-sm font-medium">No notifications found</p>
              <p className="text-xs opacity-60">Try adjusting your search or filter</p>
            </div>
          </Card>
        )}

        {/* ── Unread section ── */}
        {unreadItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-0.5">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">New</span>
              <Badge className="h-5 px-1.5 text-[10px] bg-primary text-white">{unreadItems.length}</Badge>
            </div>
            <Card className="border-border shadow-soft overflow-hidden divide-y divide-border/60">
              {unreadItems.map((n) => (
                <NotificationItem
                  key={n.id}
                  n={n}
                  onRead={markNotificationRead}
                  isExpanded={expandedIds.has(n.id)}
                  onToggleExpand={() => toggleExpand(n.id)}
                />
              ))}
            </Card>
          </div>
        )}

        {/* ── Read section ── */}
        {readItems.length > 0 && (
          <div className="space-y-2">
            {unreadItems.length > 0 && (
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-0.5">Earlier</span>
            )}
            <Card className="border-border shadow-soft overflow-hidden divide-y divide-border/60 opacity-80">
              {readItems.map((n) => (
                <NotificationItem
                  key={n.id}
                  n={n}
                  onRead={markNotificationRead}
                  isExpanded={expandedIds.has(n.id)}
                  onToggleExpand={() => toggleExpand(n.id)}
                />
              ))}
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
    </RequireAuth>
  );
}
