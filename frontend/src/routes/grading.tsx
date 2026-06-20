import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { GradingSystemPage } from "@/components/grading/grading-system";
import { StudentResultDetail } from "@/components/grading/student-result-detail";
import { useAuth } from "@/context/auth-context";

export const Route = createFileRoute("/grading")({
  head: () => ({ meta: [{ title: "Grading — Learnly" }] }),
  component: GradingRoute,
});

function GradingRoute() {
  const { role } = useAuth();
  return (
    <RequireAuth>
      <AppLayout>
        {role === "student" ? <StudentResultDetail /> : <GradingSystemPage />}
      </AppLayout>
    </RequireAuth>
  );
}
