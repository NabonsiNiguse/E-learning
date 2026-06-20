import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

// /videos is superseded by /media-hub — redirect transparently.
export const Route = createFileRoute("/videos")({
  head: () => ({ meta: [{ title: "Videos — Learnly" }] }),
  component: VideosRedirect,
});

function VideosRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/media-hub", replace: true });
  }, [navigate]);
  return null;
}
