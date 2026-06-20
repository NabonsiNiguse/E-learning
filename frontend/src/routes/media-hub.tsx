import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { MediaHubPage } from "@/components/videos/media-hub-page";

export const Route = createFileRoute("/media-hub")({
  head: () => ({
    meta: [
      { title: "Browse Videos — Learnly" },
      { name: "description", content: "Watch tutorials and shorts in one unified video hub." },
    ],
  }),
  component: MediaHubRoute,
});

function MediaHubRoute() {
  return (
    <RequireAuth>
      <AppLayout>
        <MediaHubPage />
      </AppLayout>
    </RequireAuth>
  );
}
