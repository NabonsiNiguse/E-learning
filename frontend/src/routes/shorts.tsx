import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { ShortsPage } from "@/components/shorts/shorts-page";

// /shorts stays alive — the full immersive swipe player still works here.
// The sidebar just no longer links to it directly; users reach it from
// the "Shorts" tab hint inside /media-hub.
export const Route = createFileRoute("/shorts")({
  head: () => ({ meta: [{ title: "Learning Shorts — Learnly" }] }),
  component: ShortsRoute,
});

function ShortsRoute() {
  return (
    <RequireAuth>
      <AppLayout>
        <ShortsPage />
      </AppLayout>
    </RequireAuth>
  );
}
