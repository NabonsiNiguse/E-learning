import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { GradeManagementPage } from "@/components/grading/grade-management-page";
import { useAuth } from "@/context/auth-context";
import { ShieldOff } from "lucide-react";

export const Route = createFileRoute("/grade-management")({
  head: () => ({ meta: [{ title: "Grade Management — Learnly" }] }),
  component: GradeManagementRoute,
});

function GradeManagementRoute() {
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === "student") navigate({ to: "/results-unified" });
  }, [role, navigate]);

  if (role === "student") return null;

  return (
    <RequireAuth>
      <AppLayout>
        <GradeManagementPage />
      </AppLayout>
    </RequireAuth>
  );
}
