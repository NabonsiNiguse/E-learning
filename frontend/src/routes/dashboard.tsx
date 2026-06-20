import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { useApp } from "@/context/app-context";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { TeacherDashboard } from "@/components/dashboards/teacher-dashboard";
import { StudentDashboard } from "@/components/dashboards/student-dashboard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Learnly" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { role } = useApp();
  return (
    <RequireAuth>
      <AppLayout>
        {(role === "admin" || role === "super_admin") && <AdminDashboard />}
        {role === "teacher" && <TeacherDashboard />}
        {role === "student" && <StudentDashboard />}
      </AppLayout>
    </RequireAuth>
  );
}
