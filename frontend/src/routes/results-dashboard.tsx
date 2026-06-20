import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { ResultsDashboard } from "@/components/results/results-dashboard";

export const Route = createFileRoute("/results-dashboard")({
  head: () => ({ meta: [{ title: "Results Dashboard — Learnly" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <RequireAuth>
      <AppLayout>
        <ResultsDashboard />
      </AppLayout>
    </RequireAuth>
  );
}
