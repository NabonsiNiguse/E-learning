import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { MaterialsPage } from "@/components/materials/materials-page";

export const Route = createFileRoute("/materials")({
  head: () => ({ meta: [{ title: "Materials — Learnly" }] }),
  component: MaterialsRoute,
});

function MaterialsRoute() {
  return (
    <RequireAuth>
      <AppLayout><MaterialsPage /></AppLayout>
    </RequireAuth>
  );
}
