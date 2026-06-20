import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { AssignmentsPage } from "@/components/assignments/assignments-page";

export const Route = createFileRoute("/assignments")({
  head: () => ({ meta: [{ title: "Assignments — Learnly" }] }),
  component: AssignmentsRoute,
});

function AssignmentsRoute() {
  return (
    <RequireAuth>
      <AppLayout><AssignmentsPage /></AppLayout>
    </RequireAuth>
  );
}
