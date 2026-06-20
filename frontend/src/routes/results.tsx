import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { useApp } from "@/context/app-context";
import { StudentResultsStrict } from "@/components/results/student-results-strict";
import { TeacherResultsStrict } from "@/components/results/teacher-results-strict";
import { AdminResultsStrict } from "@/components/results/admin-results-strict";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Results — Learnly" }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const { role } = useApp();

  return (
    <RequireAuth>
      <AppLayout>
        {role === "student" && <StudentResultsStrict />}
        {role === "teacher" && <TeacherResultsStrict />}
        {(role === "admin" || role === "super_admin") && <AdminResultsStrict />}
      </AppLayout>
    </RequireAuth>
  );
}
