import { Link } from "@tanstack/react-router";
import { Award, Lock, CheckCircle2, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Course, Certificate } from "@/lib/mock-data";

interface CertificateCardProps {
  course: Course;
  certificate?: Certificate;
  /** compact = small inline card; full = larger standalone card */
  variant?: "compact" | "full";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function CertificateCard({
  course,
  certificate,
  variant = "full",
}: CertificateCardProps) {
  const progress   = course.progress ?? 0;
  const isComplete = progress === 100;
  const isLocked   = !isComplete;

  if (variant === "compact") {
    return (
      <div className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
        isComplete
          ? "border-amber-400/40 bg-gradient-to-r from-amber-50/80 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/10"
          : "border-border bg-secondary/30"
      )}>
        <div className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
          isComplete ? "bg-amber-400/20" : "bg-muted"
        )}>
          {isComplete
            ? <Award className="h-5 w-5 text-amber-500" />
            : <Lock className="h-4 w-4 text-muted-foreground" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{course.title}</p>
          {isComplete ? (
            <p className="text-[10px] text-amber-600 font-medium mt-0.5">Certificate available</p>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <Progress value={progress} className="h-1 flex-1" />
              <span className="text-[10px] text-muted-foreground shrink-0">{progress}%</span>
            </div>
          )}
        </div>
        {isComplete && (
          <Link to="/certificates">
            <ChevronRight className="h-4 w-4 text-amber-500 shrink-0" />
          </Link>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <Card className={cn(
      "overflow-hidden border transition-shadow hover:shadow-glow",
      isComplete
        ? "border-amber-400/40 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]"
        : "border-border shadow-soft"
    )}>
      {/* Top gradient strip */}
      <div className={cn(
        "h-1.5 w-full",
        isComplete
          ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500"
          : "bg-gradient-to-r from-border to-border"
      )} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {isComplete ? (
                <Badge className="bg-amber-400/15 text-amber-700 border-amber-400/30 text-[10px] gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Certificate Earned
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
                  <Lock className="h-3 w-3" /> Locked
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px]">{course.category}</Badge>
            </div>
            <h3 className="font-semibold text-sm leading-snug">{course.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">by {course.instructor}</p>
          </div>

          {/* Award icon */}
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
            isComplete
              ? "bg-gradient-to-br from-amber-400 to-yellow-500 shadow-md"
              : "bg-muted"
          )}>
            <Award className={cn("h-6 w-6", isComplete ? "text-white" : "text-muted-foreground/40")} />
          </div>
        </div>

        {/* Progress / completion info */}
        {isComplete ? (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Course completed</span>
              <span className="font-semibold text-emerald-600">100%</span>
            </div>
            <Progress value={100} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-yellow-500" />
            {certificate && (
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-muted-foreground">Issued</span>
                <span className="font-medium">{formatDate(certificate.issued_date)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-[11px] text-muted-foreground">
              Complete 100% of the course to unlock your certificate.
            </p>
          </div>
        )}

        {/* Action */}
        {isComplete ? (
          <Link to="/certificates">
            <Button className="w-full gradient-primary text-white border-0 shadow-glow gap-1.5 h-9">
              <Award className="h-4 w-4" />
              View certificate
            </Button>
          </Link>
        ) : (
          <Link to="/lessons/$courseId" params={{ courseId: course.id }}>
            <Button variant="outline" className="w-full h-9 gap-1.5 text-sm">
              Continue learning
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
