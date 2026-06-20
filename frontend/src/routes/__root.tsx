import { Outlet, Link, createRootRoute } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/context/app-context";
import { Toaster } from "@/components/ui/sonner";
import { AIWidget } from "@/components/ai-assistant/ai-widget";
import { AppErrorBoundary } from "@/components/error-boundary";
import { queryClient } from "@/lib/query-client";

// ── 404 page ──────────────────────────────────────────────────────────────────
function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-7xl font-black font-display text-gradient">404</h1>
        <h2 className="text-xl font-semibold">Page not found</h2>
        <p className="text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_-4px] shadow-primary/40 hover:opacity-90 transition-opacity mt-2"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

// ── Root route ────────────────────────────────────────────────────────────────
export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    // AppErrorBoundary catches any uncaught render error from any child and
    // shows a beautiful fallback with auto-retry instead of a blank screen.
    <AppErrorBoundary autoRetryMs={8000}>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <Outlet />
          <Toaster />
          <AIWidget />
        </AppProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
