import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { NotificationPanel } from "@/components/messaging/notification-panel";
import { MessageBadgeButton } from "@/components/messaging/message-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";

const TITLE_MAP: Record<string, string> = {
  "/dashboard":       "Dashboard",
  "/courses":         "Courses",
  "/videos":          "Videos",
  "/shorts":          "Learning Shorts",
  "/media-hub":       "Browse Videos",
  "/materials":       "Materials",
  "/students":        "Students",
  "/users":           "Users",
  "/profile":         "Profile",
  "/settings":        "Settings",
  "/payments":        "Payments",
  "/messages":        "Messages",
  "/notifications":   "Notifications",
  "/attendance":      "Attendance",
  "/assignments":     "Assignments",
  "/quizzes":         "Quizzes",
  "/results-unified": "Results",
  "/grading":         "Grading",
  "/grade-management":"Grade Management",
  "/reports":         "Reports",
  "/certificates":    "Certificates",
  "/qa":              "Q&A",
};

export function AppHeader() {
  const { currentUser, role, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login", replace: true });
  };

  const title =
    TITLE_MAP[pathname] ??
    (pathname.startsWith("/lessons") ? "Lesson" :
     pathname.startsWith("/payment") ? "Checkout" : "Learnly");

  const firstName = currentUser?.first_name ?? currentUser?.full_name?.split(" ")[0] ?? "there";
  const initials  = currentUser
    ? `${currentUser.first_name[0] ?? ""}${currentUser.last_name[0] ?? ""}`.toUpperCase()
    : "?";

  // Search: map query to best matching route
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const dest =
      q.includes("course")   ? "/courses" :
      q.includes("video")    ? "/media-hub" :
      q.includes("short")    ? "/media-hub" :
      q.includes("lesson")   ? "/courses" :
      q.includes("assign")   ? "/assignments" :
      q.includes("quiz")     ? "/quizzes" :
      q.includes("result")   ? "/results-unified" :
      q.includes("grade")    ? "/grade-management" :
      q.includes("attend")   ? "/attendance" :
      q.includes("material") ? "/materials" :
      q.includes("student")  ? "/students" :
      q.includes("user")     ? "/users" :
      q.includes("report")   ? "/reports" :
      q.includes("message")  ? "/messages" :
      q.includes("notif")    ? "/notifications" :
      q.includes("payment")  ? "/payments" :
      q.includes("cert")     ? "/certificates" :
      q.includes("media")    ? "/media-hub" :
      q.includes("short")    ? "/media-hub" :
      q.includes("qa")       ? "/qa" :
      "/courses";
    navigate({ to: dest as any });
    setQuery("");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 sm:gap-4 border-b border-border bg-background/80 backdrop-blur-md px-3 sm:px-6">
      {/* SidebarTrigger — always visible; on mobile it opens the Sheet overlay */}
      <SidebarTrigger className="-ml-1 h-9 w-9" />
      <Separator orientation="vertical" className="h-6 hidden sm:block" />

      <div className="flex flex-col min-w-0">
        <h1 className="text-base sm:text-lg font-semibold font-display truncate">{title}</h1>
        <p className="hidden sm:block text-xs text-muted-foreground">
          Welcome back, {firstName}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, lessons..."
            className="pl-9 w-64 h-9 bg-secondary/60 border-transparent focus-visible:bg-background"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Message badge */}
        <MessageBadgeButton />

        {/* Notification bell */}
        <NotificationPanel />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full pl-1 pr-2 sm:pr-3 py-1 hover:bg-secondary transition">
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-semibold">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-xs font-medium">{currentUser?.full_name ?? "Guest"}</span>
                <span className="text-[10px] text-muted-foreground capitalize">{role}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-sm">{currentUser?.full_name}</span>
                <span className="text-xs text-muted-foreground">{currentUser?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link to="/profile">Profile</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/settings">Settings</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/messages">Messages</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
