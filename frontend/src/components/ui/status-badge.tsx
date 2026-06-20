import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/lib/mock-data";

export interface StatusBadgeProps {
  status: AttendanceStatus;
  size?: "sm" | "md";
  className?: string;
}

const CONFIG: Record<
  AttendanceStatus,
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  present: {
    label:  "Present",
    dot:    "bg-emerald-500",
    bg:     "bg-emerald-500/10",
    text:   "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/25",
  },
  absent: {
    label:  "Absent",
    dot:    "bg-red-500",
    bg:     "bg-red-500/10",
    text:   "text-red-600 dark:text-red-400",
    border: "border-red-500/25",
  },
  late: {
    label:  "Late",
    dot:    "bg-amber-500",
    bg:     "bg-amber-500/10",
    text:   "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/25",
  },
  excused: {
    label:  "Excused",
    dot:    "bg-sky-500",
    bg:     "bg-sky-500/10",
    text:   "text-sky-600 dark:text-sky-400",
    border: "border-sky-500/25",
  },
};

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const c = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        c.bg, c.text, c.border,
        className
      )}
    >
      <span className={cn("rounded-full shrink-0", c.dot, size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")} />
      {c.label}
    </span>
  );
}

/** Standalone dot — useful in compact table cells */
export function StatusDot({ status }: { status: AttendanceStatus }) {
  const c = CONFIG[status];
  return (
    <span
      title={c.label}
      className={cn("inline-block h-2.5 w-2.5 rounded-full", c.dot)}
    />
  );
}
