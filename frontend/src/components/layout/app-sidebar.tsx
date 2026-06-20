/**
 * AppSidebar — Ultra-premium interactive navigation with advanced animations
 * Features: Glowing hover states, smooth transitions, neon shadows, floating effects
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, PlayCircle, FileText,
  ClipboardList, HelpCircle, BarChart2,
  Award, TrendingUp, Users, UserCog, MessageSquare,
  CalendarCheck, User, Settings, LogOut, GraduationCap,
  CreditCard, ChevronDown, Loader2, Zap, Video, Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useMessaging } from "@/context/messaging-context";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/api";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type NavLeaf = {
  kind: "leaf";
  title: string;
  url: string;
  params?: Record<string, string>;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: "messages";
  color?: string;
};

type NavGroup = {
  kind: "group";
  title: string;
  icon: LucideIcon;
  roles: UserRole[];
  defaultOpen?: boolean;
  children: NavLeaf[];
  color?: string;
};

/** A visual section separator with a muted label */
type NavSection = {
  kind: "section";
  label: string;
  roles: UserRole[];
};

type NavItem = NavLeaf | NavGroup | NavSection;

// ---------------------------------------------------------------------------
// Navigation tree — items grouped into labelled sections
// ---------------------------------------------------------------------------
const NAV: NavItem[] = [
  // ── MAIN ────────────────────────────────────────────────────────────────
  { kind: "section", label: "Main", roles: ["super_admin", "admin", "teacher", "student"] },
  {
    kind: "leaf",
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "teacher", "student"],
    color: "from-violet-500 to-purple-600",
  },

  // ── LEARNING ─────────────────────────────────────────────────────────────
  { kind: "section", label: "Learning", roles: ["admin", "teacher", "student"] },
  {
    kind: "group",
    title: "Content",
    icon: BookOpen,
    roles: ["admin", "teacher", "student"],
    defaultOpen: true,
    color: "from-blue-500 to-cyan-600",
    children: [
      { kind: "leaf", title: "Courses",       url: "/courses",    icon: BookOpen,   roles: ["admin", "teacher", "student"], color: "from-blue-500 to-cyan-500" },
      { kind: "leaf", title: "Browse Videos", url: "/media-hub",  icon: PlayCircle, roles: ["admin", "teacher", "student"], color: "from-rose-500 to-orange-500" },
      { kind: "leaf", title: "Materials",     url: "/materials",  icon: FileText,   roles: ["admin", "teacher", "student"], color: "from-indigo-500 to-blue-500" },
    ],
  },
  {
    kind: "group",
    title: "Assessments",
    icon: ClipboardList,
    roles: ["admin", "teacher", "student"],
    color: "from-amber-500 to-orange-600",
    children: [
      { kind: "leaf", title: "Assignments", url: "/assignments",    icon: ClipboardList, roles: ["admin", "teacher", "student"], color: "from-amber-500 to-yellow-500" },
      { kind: "leaf", title: "Quizzes",     url: "/quizzes",        icon: HelpCircle,    roles: ["admin", "teacher", "student"], color: "from-orange-500 to-red-500" },
      { kind: "leaf", title: "Results",     url: "/results-unified",icon: BarChart2,     roles: ["admin", "teacher", "student"], color: "from-rose-500 to-pink-500" },
    ],
  },

  // ── MANAGEMENT ───────────────────────────────────────────────────────────
  { kind: "section", label: "Management", roles: ["super_admin", "admin", "teacher", "student"] },
  {
    kind: "leaf",
    title: "Grade Appeals",
    url: "/grade-management",
    icon: Award,
    roles: ["super_admin", "admin", "teacher"],
    color: "from-amber-500 to-orange-600",
  },
  {
    kind: "group",
    title: "Classroom",
    icon: Users,
    roles: ["admin", "teacher", "student"],
    defaultOpen: false,
    color: "from-emerald-500 to-teal-600",
    children: [
      { kind: "leaf", title: "Attendance", url: "/attendance", icon: CalendarCheck, roles: ["admin", "teacher", "student"], color: "from-emerald-500 to-green-500" },
      { kind: "leaf", title: "Messages",   url: "/messages",   icon: MessageSquare, roles: ["admin", "teacher", "student"], badge: "messages" as const, color: "from-sky-500 to-blue-500" },
      { kind: "leaf", title: "Q&A",        url: "/qa",         icon: HelpCircle,    roles: ["admin", "teacher", "student"], color: "from-teal-500 to-cyan-500" },
      { kind: "leaf", title: "Students",   url: "/students",   icon: Users,         roles: ["admin", "teacher"],            color: "from-green-500 to-emerald-500" },
      { kind: "leaf", title: "Users",      url: "/users",      icon: UserCog,       roles: ["admin", "super_admin"],        color: "from-cyan-500 to-blue-500" },
    ],
  },
  {
    kind: "group",
    title: "Performance",
    icon: TrendingUp,
    roles: ["super_admin", "admin", "teacher", "student"],
    color: "from-pink-500 to-rose-600",
    children: [
      { kind: "leaf", title: "Reports",      url: "/reports",      icon: FileText,   roles: ["super_admin", "admin", "teacher", "student"], color: "from-fuchsia-500 to-pink-500" },
      { kind: "leaf", title: "Certificates", url: "/certificates", icon: Award,      roles: ["student"],                                    color: "from-yellow-500 to-amber-500" },
      { kind: "leaf", title: "Payments",     url: "/payments",     icon: CreditCard, roles: ["student"],                                    color: "from-indigo-500 to-violet-500" },
    ],
  },

  // ── ACCOUNT ──────────────────────────────────────────────────────────────
  { kind: "section", label: "Account", roles: ["super_admin", "admin", "teacher", "student"] },
  {
    kind: "group",
    title: "Settings",
    icon: Settings,
    roles: ["super_admin", "admin", "teacher", "student"],
    color: "from-slate-500 to-gray-600",
    children: [
      { kind: "leaf", title: "Profile", url: "/profile",  icon: User,     roles: ["super_admin", "admin", "teacher", "student"], color: "from-slate-500 to-gray-500" },
      { kind: "leaf", title: "Account", url: "/settings", icon: Settings, roles: ["super_admin", "admin", "teacher", "student"], color: "from-gray-500 to-zinc-500" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function matchesPath(url: string, pathname: string): boolean {
  if (url === "/dashboard") return pathname === "/dashboard";
  const base = url.split("/$")[0];
  return pathname.startsWith(base) && base !== "/";
}

function groupHasActiveChild(group: NavGroup, pathname: string): boolean {
  return group.children.some((c) => matchesPath(c.url, pathname));
}

// ---------------------------------------------------------------------------
// LeafItem with premium animations
// ---------------------------------------------------------------------------
function LeafItem({ item, collapsed, badge }: { item: NavLeaf; collapsed: boolean; badge?: number }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active   = matchesPath(item.url, pathname);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={item.url as any}
      params={item.params as any}
      title={item.title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative block"
    >
      <motion.div
        initial={false}
        animate={{
          x: isHovered && !active && !collapsed ? 4 : 0,
          scale: isHovered && !active ? 1.02 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "group/leaf relative flex items-center rounded-xl text-sm overflow-hidden",
          "transition-all duration-300 select-none",
          collapsed
            ? "h-10 w-10 justify-center mx-auto"
            : "gap-3 px-3.5 py-2.5",
          active ? [
            "bg-gradient-to-r shadow-lg",
            item.color || "from-primary/20 to-primary/10",
            "text-foreground font-semibold border border-primary/30",
          ] : [
            "text-foreground/70 hover:text-foreground",
            "hover:bg-gradient-to-r hover:from-white/80 hover:to-white/60 dark:hover:from-slate-800/80 dark:hover:to-slate-800/60",
            "border border-transparent hover:border-primary/10",
          ]
        )}
      >
        {/* Animated left indicator bar */}
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full",
                "bg-gradient-to-b shadow-glow",
                item.color || "from-primary to-primary/70"
              )}
            />
          )}
        </AnimatePresence>

        {/* Glowing background on hover */}
        <AnimatePresence>
          {isHovered && !active && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "absolute inset-0 rounded-xl opacity-10 blur-xl",
                "bg-gradient-to-r",
                item.color || "from-primary to-primary/50"
              )}
            />
          )}
        </AnimatePresence>

        {/* Icon with animation */}
        <motion.div
          animate={{
            rotate: isHovered && !collapsed ? [0, -10, 10, -10, 0] : 0,
            scale: active ? 1.1 : 1,
          }}
          transition={{ 
            rotate: { duration: 0.5 },
            scale: { type: "spring", stiffness: 400, damping: 15 }
          }}
          className="relative z-10 shrink-0"
        >
          <item.icon className={cn(
            "h-[18px] w-[18px] shrink-0 transition-all duration-300",
            active ? [
              "drop-shadow-glow text-primary",
            ] : "text-foreground/50 group-hover/leaf:text-foreground"
          )} />
          
          {/* Sparkle effect on active */}
          {active && (
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: [0, 1, 0], rotate: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="h-3 w-3 text-yellow-400" />
            </motion.div>
          )}
        </motion.div>

        {!collapsed && (
          <>
            <span className={cn(
              "flex-1 truncate leading-none relative z-10 transition-all duration-300",
              active && "tracking-wide"
            )}>
              {item.title}
            </span>
            {badge != null && badge > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                <Badge className={cn(
                  "h-5 min-w-5 px-1.5 text-[10px] border-0 leading-none font-bold shadow-lg relative z-10",
                  "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
                  "animate-pulse"
                )}>
                  {badge > 99 ? "99+" : badge}
                </Badge>
              </motion.div>
            )}
          </>
        )}
        
        {collapsed && badge != null && badge > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 ring-2 ring-sidebar shadow-glow animate-pulse"
          />
        )}

        {/* Neon glow border on active */}
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn(
              "absolute inset-0 rounded-xl border-2",
              "bg-gradient-to-r opacity-20",
              item.color || "from-primary to-primary/50"
            )}
            style={{
              boxShadow: `0 0 20px ${item.color ? 'rgba(59, 130, 246, 0.5)' : 'var(--primary)'}`,
            }}
          />
        )}
      </motion.div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// CollapsedGroupPopover — icon with portal-based popover (escapes overflow:hidden)
// ---------------------------------------------------------------------------
function CollapsedGroupPopover({
  group, visible, hasActive, unreadMessageCount,
}: {
  group: NavGroup;
  visible: NavLeaf[];
  hasActive: boolean;
  unreadMessageCount: number;
}) {
  const [open, setOpen]   = useState(false);
  const [pos, setPos]     = useState({ top: 0, left: 0 });
  const triggerRef        = useRef<HTMLDivElement>(null);
  const pathname          = useRouterState({ select: (s) => s.location.pathname });

  const showPopover = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.right + 8 });
    }
    setOpen(true);
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={showPopover}
      onMouseLeave={() => setOpen(false)}
      className="relative"
    >
      {/* Group icon trigger */}
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl transition-all mx-auto relative overflow-hidden cursor-pointer border",
        hasActive
          ? "bg-primary/15 border-primary/30 text-primary shadow-sm"
          : "text-foreground/60 hover:text-foreground hover:bg-white/80 dark:hover:bg-slate-800/60 border-transparent hover:border-primary/20"
      )}>
        <group.icon className="h-[18px] w-[18px] relative z-10 shrink-0" />
        {hasActive && (
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn("absolute inset-0 bg-gradient-to-br blur-sm opacity-30", group.color || "from-primary to-primary/50")}
          />
        )}
      </div>

      {/* Portal popover — renders at document.body, escapes all overflow clipping */}
      {open && typeof document !== "undefined" && createPortal(
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="min-w-[190px] bg-background border border-border rounded-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.25)] overflow-hidden"
        >
          {/* Group label header */}
          <div className={cn(
            "px-3 py-2.5 border-b border-border/60 flex items-center gap-2",
            "bg-gradient-to-r from-transparent to-transparent"
          )}>
            <group.icon className={cn("h-3.5 w-3.5 shrink-0", hasActive ? "text-primary" : "text-muted-foreground")} />
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">{group.title}</p>
          </div>
          {/* Children */}
          <div className="p-1.5 space-y-0.5">
            {visible.map((child) => {
              const isActive = matchesPath(child.url, pathname);
              const badge    = child.badge === "messages" ? unreadMessageCount : undefined;
              return (
                <Link
                  key={child.title}
                  to={child.url as any}
                  params={child.params as any}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all group",
                    isActive
                      ? cn("bg-gradient-to-r font-semibold text-foreground border border-primary/20 shadow-sm", child.color || "from-primary/15 to-primary/5")
                      : "text-foreground/70 hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  <child.icon className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-foreground/50 group-hover:text-foreground"
                  )} />
                  <span className="flex-1 leading-none">{child.title}</span>
                  {badge != null && badge > 0 && (
                    <span className="h-4 min-w-4 px-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                  {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                </Link>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GroupItem with smooth accordion animation
// ---------------------------------------------------------------------------
function GroupItem({
  group, collapsed, unreadMessageCount, role,
}: {
  group: NavGroup; collapsed: boolean; unreadMessageCount: number; role: UserRole;
}) {
  const pathname  = useRouterState({ select: (s) => s.location.pathname });
  const hasActive = groupHasActiveChild(group, pathname);
  const [open, setOpen] = useState<boolean>(() => !!group.defaultOpen || hasActive);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  const visible = group.children.filter((c) => c.roles.includes(role));
  if (visible.length === 0) return null;

  // Collapsed mode — show group icon with hover popover listing children
  if (collapsed) {
    return (
      <CollapsedGroupPopover
        group={group}
        visible={visible}
        hasActive={hasActive}
        unreadMessageCount={unreadMessageCount}
      />
    );
  }

  // Expanded mode
  return (
    <div>
      {/* Header */}
      <motion.button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm relative overflow-hidden",
          "transition-all duration-300 select-none cursor-pointer",
          "hover:bg-gradient-to-r hover:from-white/80 hover:to-white/60 dark:hover:from-slate-800/80 dark:hover:to-slate-800/60",
          "border border-transparent hover:border-primary/10",
          hasActive
            ? "text-foreground font-semibold"
            : "text-foreground/70 hover:text-foreground"
        )}
      >
        {/* Hover glow effect */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.15, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "absolute inset-0 rounded-xl blur-xl",
                "bg-gradient-to-r",
                group.color || "from-primary to-primary/50"
              )}
            />
          )}
        </AnimatePresence>

        <motion.div
          animate={{ 
            rotate: isHovered ? [0, -15, 15, 0] : 0,
            scale: hasActive ? 1.1 : 1
          }}
          transition={{ 
            rotate: { duration: 0.5 },
            scale: { type: "spring", stiffness: 400, damping: 15 }
          }}
          className="relative z-10"
        >
          <group.icon
            className={cn(
              "h-[18px] w-[18px] shrink-0 transition-all duration-300",
              hasActive ? "text-primary drop-shadow-glow" : "text-foreground/50"
            )}
          />
        </motion.div>

        <span className="flex-1 text-left truncate leading-none relative z-10">{group.title}</span>

        {hasActive && !open && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="h-2 w-2 rounded-full bg-primary shrink-0 shadow-glow relative z-10"
          />
        )}

        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative z-10"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-colors duration-300",
              hasActive ? "text-primary" : "text-foreground/40"
            )}
          />
        </motion.div>
      </motion.button>

      {/* Children with smooth height animation */}
      <motion.div
        initial={false}
        animate={{
          height: open ? "auto" : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{ 
          height: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 }
        }}
        className="overflow-hidden"
      >
        <div className="ml-4 mt-1 pl-4 border-l-2 border-border/50 space-y-1 pb-1 pt-1">
          {visible.map((child, index) => (
            <motion.div
              key={child.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <LeafItem
                item={child}
                collapsed={false}
                badge={child.badge === "messages" ? unreadMessageCount : undefined}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role badge with vibrant colors
// ---------------------------------------------------------------------------
const ROLE_CONFIG: Record<UserRole, { gradient: string; text: string; glow: string }> = {
  super_admin: { gradient: "from-rose-500 to-red-600",     text: "text-rose-100",    glow: "shadow-[0_0_15px_rgba(239,68,68,0.5)]"   },
  admin:       { gradient: "from-violet-500 to-purple-600",text: "text-violet-100",  glow: "shadow-[0_0_15px_rgba(139,92,246,0.5)]" },
  teacher:     { gradient: "from-sky-500 to-blue-600",     text: "text-sky-100",     glow: "shadow-[0_0_15px_rgba(14,165,233,0.5)]"  },
  student:     { gradient: "from-indigo-500 to-violet-600",text: "text-indigo-100",  glow: "shadow-[0_0_15px_rgba(99,102,241,0.5)]"  },
};

// ---------------------------------------------------------------------------
// AppSidebar — main export
// ---------------------------------------------------------------------------
export function AppSidebar() {
  const { currentUser, role, isLoading, logout } = useAuth();
  const { unreadMessageCount } = useMessaging();
  const { state } = useSidebar();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";

  const handleLogout = useCallback(async () => {
    await logout();
    navigate({ to: "/login", replace: true });
  }, [logout, navigate]);

  const initials = currentUser
    ? `${currentUser.first_name[0] ?? ""}${currentUser.last_name[0] ?? ""}`.toUpperCase()
    : "?";

  const roleConfig = ROLE_CONFIG[role];

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800">

      {/* Logo */}
      <SidebarHeader className="border-b border-border/50 backdrop-blur-sm bg-slate-50/80 dark:bg-slate-800/80">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-3 px-3 py-4 transition-all group",
            collapsed && "justify-center px-0"
          )}
        >
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-glow relative overflow-hidden"
          >
            <GraduationCap className="h-5 w-5 text-white relative z-10" />
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
            />
          </motion.div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col leading-none"
            >
              <span className="font-display font-bold text-foreground text-lg tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Learnly
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                E-learning platform
              </span>
            </motion.div>
          )}
        </Link>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="py-4 overflow-y-auto bg-gradient-to-b from-transparent via-slate-50/60 to-transparent dark:via-slate-800/60">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-6 w-6 text-primary" />
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={cn("space-y-1", collapsed ? "px-2" : "px-3")}
          >
            {NAV.map((item, index) => {
              if (!item.roles.includes(role)) return null;

              return (
                <motion.div
                  key={`${item.kind}-${item.title ?? (item as any).label}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  {item.kind === "section" ? (
                    /* ── Section header ── */
                    !collapsed ? (
                      <div className="pt-4 pb-1.5 first:pt-1">
                        <p className="px-3.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 select-none">
                          {(item as any).label}
                        </p>
                      </div>
                    ) : (
                      <div className="pt-3 pb-1">
                        <div className="mx-auto h-px w-5 rounded-full bg-border/60" />
                      </div>
                    )
                  ) : item.kind === "leaf" ? (
                    <LeafItem
                      item={item}
                      collapsed={collapsed}
                      badge={item.badge === "messages" ? unreadMessageCount : undefined}
                    />
                  ) : (
                    <GroupItem
                      group={item}
                      collapsed={collapsed}
                      unreadMessageCount={unreadMessageCount}
                      role={role}
                    />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border/50 p-3 space-y-2 bg-slate-200/80 dark:bg-slate-900/90 backdrop-blur-sm">
        {/* User card */}
        {!collapsed && currentUser && (
          <Link to="/profile">
            <motion.div
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer relative overflow-hidden group border border-slate-300/50 dark:border-slate-700/50 hover:border-primary/30 shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 relative",
                  "bg-gradient-to-br shadow-lg",
                  roleConfig.gradient,
                  roleConfig.glow
                )}
              >
                {initials}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-xl"
                />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate leading-none">
                  {currentUser.full_name}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-1.5">
                  {currentUser.email}
                </p>
              </div>
              <motion.span
                whileHover={{ scale: 1.1 }}
                className={cn(
                  "shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg capitalize",
                  "bg-gradient-to-r shadow-md",
                  roleConfig.gradient,
                  roleConfig.text
                )}
              >
                {role}
              </motion.span>
            </motion.div>
          </Link>
        )}

        {/* Logout */}
        <motion.button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all",
            "bg-white dark:bg-slate-800 text-muted-foreground hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600",
            "hover:shadow-[0_4px_12px_rgba(239,68,68,0.4)] border border-slate-300/50 dark:border-slate-700/50 hover:border-red-500/50 shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]",
            collapsed && "justify-center px-0 py-3"
          )}
        >
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
          </motion.div>
          {!collapsed && <span className="font-medium">Logout</span>}
        </motion.button>
      </SidebarFooter>
    </Sidebar>
  );
}
