/**
 * RequireAuth — combined authentication + role-based access guard.
 *
 * Usage
 * ─────
 *   // Auth only (any role)
 *   <RequireAuth><DashboardPage /></RequireAuth>
 *
 *   // Role-restricted
 *   <RequireAuth allowedRoles={["admin", "teacher"]}>
 *     <AdminOnlyPage />
 *   </RequireAuth>
 *
 * Behaviour
 * ─────────
 * • While isLoading: shows a full-screen spinner (no flash of protected content)
 * • No user:         redirects to /login (replace so Back button doesn't loop)
 * • Wrong role:      shows a polished 403 "Access Denied" screen with a back button
 * • Correct role:    renders children immediately
 */

import { useEffect, useRef } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShieldX, ArrowLeft, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import type { UserRole } from "@/lib/api";

interface RequireAuthProps {
  children: ReactNode;
  /** If omitted, any authenticated role is accepted. */
  allowedRoles?: UserRole[];
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { currentUser, role, isLoading } = useAuth();
  const navigate       = useNavigate();
  const hasRedirected  = useRef(false);

  // Redirect to login when not authenticated
  useEffect(() => {
    if (!isLoading && !currentUser && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate({ to: "/login", replace: true });
    }
  }, [isLoading, currentUser, navigate]);

  // ── 1. Loading state — full-screen spinner ───────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-9 w-9 rounded-full border-[3px] border-primary border-t-transparent"
        />
      </div>
    );
  }

  // ── 2. Not authenticated — render nothing (redirect is in-flight) ────────
  if (!currentUser) return null;

  // ── 3. Wrong role — 403 screen ───────────────────────────────────────────
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full text-center space-y-6"
        >
          {/* Icon */}
          <div className="h-20 w-20 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto">
            <ShieldX className="h-10 w-10 text-destructive" />
          </div>

          {/* Copy */}
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-extrabold">Access Denied</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your account role (<strong className="text-foreground capitalize">{role}</strong>)
              doesn't have permission to access this page.
            </p>
            <p className="text-muted-foreground text-xs">
              Required:{" "}
              {allowedRoles.map((r) => (
                <span key={r} className="font-medium text-foreground capitalize mr-1">{r}</span>
              ))}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })} className="gap-2 w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" /> Go to Dashboard
            </Button>
            <Button asChild className="gradient-primary text-white border-0 w-full sm:w-auto gap-2">
              <Link to="/"><GraduationCap className="h-4 w-4" /> Home</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── 4. Authorised ─────────────────────────────────────────────────────────
  return <>{children}</>;
}
