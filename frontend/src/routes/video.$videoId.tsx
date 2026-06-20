import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { VideoPlayerPage } from "@/components/videos/video-player-page";

export const Route = createFileRoute("/video/$videoId")({
  head: () => ({ meta: [{ title: "Video Player — Learnly" }] }),
  component: VideoPlayerRoute,
});

function VideoPlayerRoute() {
  return (
    <RequireAuth>
      <AppLayout>
        <VideoPlayerPage />
      </AppLayout>
    </RequireAuth>
  );
}
