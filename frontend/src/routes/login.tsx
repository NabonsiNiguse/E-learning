import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  GraduationCap, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff,
  Users, Award, Sparkles, Target, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/context/app-context";
import { loginSchema, flattenZodErrors } from "@/lib/schemas";
import type { UserRole } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Learnly" },
      { name: "description", content: "Sign in to your Learnly account." },
    ],
  }),
  component: LoginPage,
});

const ROLES: { value: UserRole; label: string; desc: string; icon: typeof Users }[] = [
  { value: "admin",       label: "Admin",     desc: "Manage everything", icon: Award        },
  { value: "super_admin", label: "Acad. Mgr", desc: "Grade overrides",   icon: Sparkles     },
  { value: "teacher",     label: "Teacher",   desc: "Create & teach",    icon: GraduationCap },
  { value: "student",     label: "Student",   desc: "Learn & grow",      icon: Users        },
];

const SEED: Record<UserRole, { email: string; password: string }> = {
  super_admin: { email: "academic@learnly.io", password: "SuperAdmin@1234" },
  admin:       { email: "ermiyas@learnly.io",  password: "Admin@1234"      },
  teacher:     { email: "nabonsi@learnly.io",  password: "Teacher@1234"    },
  student:     { email: "keab@learnly.io",     password: "Student@1234"    },
};

function parseError(err: any): string {
  const msg: string = err?.message ?? "";
  if (msg.includes("aborted") || msg.includes("timeout"))
    return "Request timed out — make sure the backend is running on port 8000.";
  if (msg.includes("fetch") || msg.includes("connect") || msg.includes("network") || msg.includes("Failed to fetch"))
    return "Cannot reach the server — start the Django backend and try again.";
  if (err?.status === 401 || msg.includes("credentials") || msg.includes("No active account") || msg.includes("password"))
    return "Invalid email or password.";
  return msg || "Login failed. Please try again.";
}

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role } = useApp();

  const [selected, setSelected] = useState<UserRole>("student");
  const [email,    setEmail]    = useState(SEED.student.email);
  const [password, setPassword] = useState(SEED.student.password);
  const [loading,  setLoading]  = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Role-based redirect after login
  useEffect(() => {
    if (!isAuthenticated) return;
    // All roles land on /dashboard — the dashboard component renders the right view per role
    navigate({ to: "/dashboard", replace: true });
  }, [isAuthenticated, navigate]);

  function pickRole(r: UserRole) {
    setSelected(r);
    setEmail(SEED[r].email);
    setPassword(SEED[r].password);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    // Client-side Zod validation before any network call
    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      setFieldErrors(flattenZodErrors(parsed.error));
      return;
    }

    setLoading(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      // Navigation happens via useEffect when isAuthenticated becomes true
    } catch (err: any) {
      toast.error(parseError(err));
    } finally {
      setLoading(false);
    }
  }

  // Prefill role from query param if present
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role') as UserRole | null;
      if (roleParam && Object.keys(SEED).includes(roleParam)) {
        pickRole(roleParam as UserRole);
      }
    } catch (e) {}
  }, []);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      {/* ── Left: form ── */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-10 relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-10 relative z-10 w-fit">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">Learnly</span>
        </Link>

        <div className="max-w-sm w-full relative z-10">
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="mt-1.5 text-slate-400 text-sm">Select a role to auto-fill demo credentials.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">

            {/* Role picker — 2×2 grid */}
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Sign in as</Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => {
                  const Icon = r.icon;
                  const active = selected === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => pickRole(r.value)}
                      className={cn(
                        "rounded-xl border-2 p-3 text-left transition-all",
                        active
                          ? "border-orange-400 bg-orange-500/15 shadow-[0_0_16px_rgba(249,115,22,0.25)]"
                          : "border-slate-700 bg-slate-800/60 hover:border-slate-500"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 mb-1.5", active ? "text-orange-400" : "text-slate-400")} />
                      <p className={cn("text-xs font-bold", active ? "text-white" : "text-slate-300")}>{r.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{r.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email */}
              <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300 text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="email" type="email" required
                  value={email} onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: "" })); }}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={cn(
                    "pl-10 h-11 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 focus:border-orange-400 focus-visible:ring-orange-400/20 text-sm",
                    fieldErrors.email && "border-red-500",
                  )}
                />
              </div>
              {fieldErrors.email && <p className="text-xs text-red-400">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-300 text-sm font-medium">Password</Label>
                <button
                  type="button"
                  className="text-xs text-orange-400 hover:text-orange-300 transition"
                  onClick={() => toast.info("Password reset is not yet available.")}
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="password" type={showPassword ? 'text' : 'password'} required
                  value={password} onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: "" })); }}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    "pl-10 h-11 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 focus:border-orange-400 focus-visible:ring-orange-400/20 text-sm",
                    fieldErrors.password && "border-red-500",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-400">{fieldErrors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                />
                Remember me
              </label>
              <div />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 font-semibold shadow-lg shadow-orange-500/25 transition-all"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Signing in…</>
                : <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>
              }
            </Button>

            <p className="text-center text-sm text-slate-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-orange-400 font-semibold hover:text-orange-300 transition">
                Sign up
              </Link>
            </p>

            {/* ── Social login ── */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="bg-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500 tracking-wider">or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => toast.info("Google SSO is not yet configured.")}
                className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 hover:border-slate-500 transition-all text-slate-300 text-sm font-medium"
              >
                {/* Google icon */}
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => toast.info("Facebook SSO is not yet configured.")}
                className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 hover:border-slate-500 transition-all text-slate-300 text-sm font-medium"
              >
                {/* Facebook icon */}
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#1877F2]" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Right: info panel ── */}
      <div className="hidden lg:flex relative bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden items-center justify-center p-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-orange-500/15 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-white max-w-sm gap-8 text-center">
          <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/40">
            <GraduationCap className="h-12 w-12 text-white" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight">
              Transform Your Future with AI-Powered Learning
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Join our growing community mastering new skills through personalized, intelligent education.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: Target,     label: "Personalized Paths" },
              { icon: TrendingUp, label: "Track Progress"     },
              { icon: Award,      label: "Earn Certificates"  },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-700/60 border border-slate-600 text-sm font-medium text-slate-200"
              >
                <Icon className="h-3.5 w-3.5 text-orange-400" />
                {label}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-10 pt-6 border-t border-slate-700 w-full justify-center">
            {[
              { value: "35+", label: "Students" },
              { value: "6",   label: "Courses"  },
              { value: "98%", label: "Success"  },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-black">{stat.value}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
