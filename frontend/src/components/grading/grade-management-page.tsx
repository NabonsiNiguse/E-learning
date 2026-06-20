/**
 * Grade Appeals Page (entry point from sidebar)
 *
 * Teacher     : sees pending appeals for their own courses — can respond + escalate
 * Super Admin : sees escalated appeals — can approve/reject with audit reason
 * Admin       : read-only view of all appeals
 * Student     : blocked — students submit appeals from the Results page
 *
 * HOW STUDENT APPEALS REACH HERE:
 *   Student → Results page → "Appeal grade" button on any graded assignment
 *   → fills reason → submits → appeal appears here instantly (shared store)
 */
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { GradeAppealsPage } from "./grade-appeals-page";
import { Link } from "@tanstack/react-router";

function AccessDenied() {
  return (
    <Card className="border-border shadow-soft">
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
        <Lock className="h-10 w-10 opacity-20" />
        <div className="text-center space-y-1">
          <p className="text-sm font-medium">Students don't manage appeals here</p>
          <p className="text-xs max-w-xs">
            Go to <strong>Results</strong>, find a graded assignment, and click
            the <strong>"Appeal grade"</strong> button at the bottom of the card.
          </p>
        </div>
        <Link to="/results">
          <Button variant="outline" size="sm">Go to Results</Button>
        </Link>
      </div>
    </Card>
  );
}

export function GradeManagementPage() {
  const { role } = useAuth();
  if (role === "student") return <AccessDenied />;
  return <GradeAppealsPage />;
}
