import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

// This route is superseded by /dashboard which handles all roles.
// Redirect to /dashboard to avoid duplication.
export const Route = createFileRoute("/teacher-dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Learnly" }] }),
  component: TeacherDashboardRedirect,
});

function TeacherDashboardRedirect() {
  const navigate = useNavigate();
  useEffect(() => { navigate({ to: "/dashboard" }); }, [navigate]);
  return null;
}
