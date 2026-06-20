import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { QuizzesPage } from "@/components/quiz/quizzes-page";

export const Route = createFileRoute("/quizzes")({
  head: () => ({ meta: [{ title: "Quizzes — Learnly" }] }),
  component: QuizzesRoute,
});

function QuizzesRoute() {
  return (
    <RequireAuth>
      <AppLayout><QuizzesPage /></AppLayout>
    </RequireAuth>
  );
}
