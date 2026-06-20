import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { QAPage } from "@/components/qa/qa-page";

export const Route = createFileRoute("/qa")({
  head: () => ({ meta: [{ title: "Q&A — Learnly" }] }),
  component: QAPageRoute,
});

function QAPageRoute() {
  return (
    <RequireAuth>
      <AppLayout><QAPage /></AppLayout>
    </RequireAuth>
  );
}
