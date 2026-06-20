import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { CertificatesPage } from "@/components/certificates/certificates-page";

export const Route = createFileRoute("/certificates")({
  head: () => ({ meta: [{ title: "Certificates — Learnly" }] }),
  component: CertificatesRoute,
});

function CertificatesRoute() {
  return (
    <RequireAuth>
      <AppLayout><CertificatesPage /></AppLayout>
    </RequireAuth>
  );
}
