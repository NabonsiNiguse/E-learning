import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { useApp } from "@/context/app-context";
import { TeacherAttendance } from "@/components/attendance/teacher-attendance";
import { StudentAttendance } from "@/components/attendance/student-attendance";

export const Route = createFileRoute("/attendance")({
  head: () => ({ meta: [{ title: "Attendance — Learnly" }] }),
  component: AttendancePage,
});

function AttendancePage() {
  const { role } = useApp();
  return (
    <RequireAuth>
      <AppLayout>
        {(role === "admin" || role === "super_admin" || role === "teacher") && <TeacherAttendance />}
        {role === "student" && <StudentAttendance />}
      </AppLayout>
    </RequireAuth>
  );
}
