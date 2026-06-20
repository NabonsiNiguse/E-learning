import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { MessageInbox } from "@/components/messaging/message-inbox";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Learnly" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  return (
    <RequireAuth>
      <AppLayout><MessageInbox /></AppLayout>
    </RequireAuth>
  );
}
