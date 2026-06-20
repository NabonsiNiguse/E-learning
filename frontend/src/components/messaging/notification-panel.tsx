import React from "react";
import { Bell, Check, CheckCheck, Megaphone, BookOpen, CreditCard, UserPlus, MessageSquare, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useMessaging } from "@/context/messaging-context";
import type { NotificationType } from "@/lib/mock-data";

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  announcement:    { icon: Megaphone,     color: "text-violet-600",  bg: "bg-violet-100 dark:bg-violet-900/30" },
  course_update:   { icon: BookOpen,      color: "text-sky-600",     bg: "bg-sky-100 dark:bg-sky-900/30" },
  enrollment:      { icon: UserPlus,      color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  payment_success: { icon: CreditCard,    color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  payment_failed:  { icon: CreditCard,    color: "text-destructive", bg: "bg-destructive/10" },
  system:          { icon: Info,          color: "text-muted-foreground", bg: "bg-muted" },
  message:         { icon: MessageSquare, color: "text-amber-600",   bg: "bg-amber-100 dark:bg-amber-900/30" },
};

export function NotificationPanel() {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useMessaging();
  
  const [open, setOpen] = React.useState(false);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent marking as read when clicking expand
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadNotificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-primary border-background border-2 pointer-events-none">
              {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 shadow-lg border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadNotificationCount > 0 && (
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                {unreadNotificationCount} new
              </Badge>
            )}
          </div>
          {unreadNotificationCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={() => {
                markAllNotificationsRead();
                setOpen(false);
              }}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-[420px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => {
                const cfg = typeConfig[n.type];
                const Icon = cfg.icon;
                const hasLongMessage = n.message.length > 120;
                const isExpanded = expandedIds.has(n.id);
                
                return (
                  <div key={n.id} className="relative">
                    <button
                      onClick={() => {
                        markNotificationRead(n.id);
                      }}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60",
                        !n.is_read && "bg-primary-soft/40"
                      )}
                    >
                      <div className={cn("mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0", cfg.bg)}>
                        <Icon className={cn("h-4 w-4", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm leading-snug", !n.is_read && "font-medium")}>
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className={cn(
                          "text-xs text-muted-foreground mt-0.5 leading-relaxed",
                          !isExpanded && hasLongMessage && "line-clamp-2"
                        )}>
                          {n.message}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-1">{n.created_at}</p>
                      </div>
                    </button>
                    {hasLongMessage && (
                      <div className="px-4 pb-2">
                        <button
                          onClick={(e) => toggleExpand(n.id, e)}
                          className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5"
                        >
                          {isExpanded ? (
                            <>Show less <Check className="h-3 w-3" /></>
                          ) : (
                            <>Show more <CheckCheck className="h-3 w-3" /></>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="px-4 py-2.5">
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground h-7" asChild>
                <Link to="/notifications">View all notifications</Link>
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
