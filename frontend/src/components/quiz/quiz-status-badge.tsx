import { cn } from "@/lib/utils";
import type { QuizStatus } from "@/lib/mock-data";

const CONFIG: Record<QuizStatus, { label: string; dot: string; bg: string; text: string; border: string }> = {
  draft:     { label: "Draft",     dot: "bg-slate-400",   bg: "bg-slate-500/10",   text: "text-slate-600 dark:text-slate-400",   border: "border-slate-500/20" },
  upcoming:  { label: "Upcoming",  dot: "bg-amber-500",   bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400",   border: "border-amber-500/20" },
  active:    { label: "Active",    dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400",border: "border-emerald-500/20" },
  completed: { label: "Completed", dot: "bg-sky-500",     bg: "bg-sky-500/10",     text: "text-sky-600 dark:text-sky-400",       border: "border-sky-500/20" },
};

export function QuizStatusBadge({ status }: { status: QuizStatus }) {
  const c = CONFIG[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
      c.bg, c.text, c.border
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", c.dot)} />
      {c.label}
    </span>
  );
}
