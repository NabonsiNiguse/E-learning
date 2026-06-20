import { cn } from "@/lib/utils";
import type { AssignmentStatus } from "@/lib/mock-data";

const CONFIG: Record<AssignmentStatus, { label: string; dot: string; bg: string; text: string; border: string }> = {
  pending:   { label: "Pending",   dot: "bg-slate-400",   bg: "bg-slate-500/10",   text: "text-slate-600 dark:text-slate-400",    border: "border-slate-500/20"  },
  submitted: { label: "Submitted", dot: "bg-sky-500",     bg: "bg-sky-500/10",     text: "text-sky-600 dark:text-sky-400",        border: "border-sky-500/20"    },
  graded:    { label: "Graded",    dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20"},
  late:      { label: "Late",      dot: "bg-amber-500",   bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400",    border: "border-amber-500/20"  },
  missing:   { label: "Missing",   dot: "bg-red-500",     bg: "bg-red-500/10",     text: "text-red-600 dark:text-red-400",        border: "border-red-500/20"    },
};

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
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
