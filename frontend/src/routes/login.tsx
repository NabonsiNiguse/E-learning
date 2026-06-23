import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  GraduationCap, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff,
  Users, Award, Sparkles, Target, TrendingUp, BookOpen, Star, CheckCircle2,
  ShieldCheck,
} from "lucide-react";
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

const ROLES: { value: UserRole; label: string; desc: string; icon: typeof Users; color: string }[] = [
  { value: "admin",       label: "Admin",     desc: "Manage everything", icon: Award,         color: "#f97316" },
  { value: "super_admin", label: "Acad. Mgr", desc: "Grade overrides",   icon: Sparkles,      color: "#a855f7" },
  { value: "teacher",     label: "Teacher",   desc: "Create & teach",    icon: GraduationCap, color: "#3b82f6" },
  { value: "student",     label: "Student",   desc: "Learn & grow",      icon: Users,         color: "#10b981" },
];

const SEED: Record<UserRole, { email: string; password: string }> = {
  super_admin: { email: "academic@learnly.io", password: "SuperAdmin@1234" },
  admin:       { email: "ermiyas@learnly.io",  password: "Admin@1234"      },
  teacher:     { email: "nabonsi@learnly.io",  password: "Teacher@1234"    },
  student:     { email: "keab@learnly.io",     password: "Student@1234"    },
};

const STATS = [
  { value: "35+",  label: "Students",    icon: Users      },
  { value: "6",    label: "Courses",     icon: BookOpen   },
  { value: "98%",  label: "Success Rate", icon: TrendingUp },
];

const FEATURES = [
  { icon: Target,      label: "Personalized Paths",   desc: "AI-curated learning journeys" },
  { icon: ShieldCheck, label: "Verified Certificates", desc: "Industry-recognized credentials" },
  { icon: Star,        label: "Expert Teachers",       desc: "Vetted professionals & mentors" },
];

function parseError(err: any): string {
  const msg: string = err?.message ?? "";
  if (msg.includes("aborted") || msg.includes("timeout"))
    return "Request timed out — make sure the backend is running on port 8000.";
  if (msg.includes("fetch") || msg.includes("connect") || msg.includes("network") || msg.includes("Failed to fetch"))
    return "Cannot reach the server — start the Django backend and try again.";
  if (err?.status === 401 || msg.toLowerCase().includes("credential") || msg.toLowerCase().includes("no active account") || msg.toLowerCase().includes("password"))
    return "Invalid email or password.";
  return msg || "Login failed. Please try again.";
}

// Animated orb component
function Orb({ className }: { className: string }) {
  return <div className={cn("absolute rounded-full pointer-events-none", className)} />;
}

function LoginPage() {
  const navigate  = useNavigate();
  const { login, isAuthenticated } = useApp();

  const [selected, setSelected] = useState<UserRole>("student");
  const [email,    setEmail]    = useState(SEED.student.email);
  const [password, setPassword] = useState(SEED.student.password);
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Counter animation for stats
  const [counts, setCounts] = useState({ students: 0, courses: 0, success: 0 });
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const targets = { students: 35, courses: 6, success: 98 };
    let frame = 0;
    const total = 60;
    function tick() {
      frame++;
      const t = frame / total;
      const ease = 1 - Math.pow(1 - t, 3);
      setCounts({
        students: Math.round(targets.students * ease),
        courses:  Math.round(targets.courses  * ease),
        success:  Math.round(targets.success  * ease),
      });
      if (frame < total) animRef.current = setTimeout(tick, 20);
    }
    animRef.current = setTimeout(tick, 400);
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    navigate({ to: "/dashboard", replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get("role") as UserRole | null;
      if (roleParam && Object.keys(SEED).includes(roleParam)) pickRole(roleParam);
    } catch (_) {}
  }, []);

  function pickRole(r: UserRole) {
    setSelected(r);
    setEmail(SEED[r].email);
    setPassword(SEED[r].password);
    setFieldErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      setFieldErrors(flattenZodErrors(parsed.error));
      return;
    }

    setLoading(true);
    try {
      await login(parsed.data.email, parsed.data.password);
    } catch (err: any) {
      toast.error(parseError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        * { font-family: 'Inter', system-ui, sans-serif; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-18px) rotate(2deg); }
          66%       { transform: translateY(-9px) rotate(-1deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-22px) rotate(-2deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(249,115,22,0.3); }
          50%       { box-shadow: 0 0 50px rgba(249,115,22,0.6); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes card-float {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(var(--r,0deg)); }
          50%       { transform: translateY(-12px) translateX(4px) rotate(var(--r,0deg)); }
        }

        .animate-float   { animation: float  6s ease-in-out infinite; }
        .animate-float2  { animation: float2 8s ease-in-out infinite; }
        .animate-float3  { animation: float  7s ease-in-out infinite 1.5s; }
        .animate-slide-up { animation: slideUp 0.4s ease-out both; }
        .animate-fade-in  { animation: fadeIn  0.5s ease-out both; }

        .glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.10);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .glass-hover:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.18);
        }

        .input-premium {
          width: 100%;
          height: 48px;
          padding: 0 44px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
          transition: all 0.25s ease;
          outline: none;
        }
        .input-premium::placeholder { color: rgba(255,255,255,0.25); }
        .input-premium:focus {
          border-color: #f97316;
          background: rgba(249,115,22,0.06);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.15);
        }
        .input-premium.error {
          border-color: #ef4444;
          background: rgba(239,68,68,0.05);
        }

        .btn-primary {
          width: 100%;
          height: 48px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #f97316, #ea6c0a);
          box-shadow: 0 4px 24px rgba(249,115,22,0.35);
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }
        .btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .btn-primary:hover::after { opacity: 1; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(249,115,22,0.45); }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .role-card {
          border-radius: 14px;
          border: 1.5px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
          padding: 12px 10px;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: left;
        }
        .role-card:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.20); }
        .role-card.active {
          border-color: #f97316;
          background: rgba(249,115,22,0.10);
          box-shadow: 0 0 20px rgba(249,115,22,0.20), inset 0 1px 0 rgba(249,115,22,0.2);
        }

        .feature-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(249,115,22,0.30);
          transform: translateX(4px);
        }

        .stat-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 12px 20px;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
        }

        .social-btn {
          height: 44px;
          border-radius: 12px;
          border: 1.5px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.8);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .social-btn:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.22); }

        .check-box {
          width: 16px;
          height: 16px;
          min-width: 16px;
          border-radius: 5px;
          border: 1.5px solid rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.05);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .check-box.checked {
          background: #f97316;
          border-color: #f97316;
        }

        .floating-card {
          position: absolute;
          border-radius: 16px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.14);
          backdrop-filter: blur(16px);
          padding: 12px 16px;
          animation: card-float 5s ease-in-out infinite;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 600;
        }
        .badge-orange {
          background: rgba(249,115,22,0.20);
          border: 1px solid rgba(249,115,22,0.40);
          color: #fdba74;
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1224 40%, #0a0f1e 100%)",
      }} className="max-lg:grid-cols-1">

        {/* ──────────────────────── LEFT: FORM ──────────────────────── */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px 24px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Background orbs */}
          <Orb className="animate-float" style={{ top: "-120px", left: "-120px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)" } as any} />
          <Orb className="animate-float2" style={{ bottom: "-80px", right: "-80px", width: "320px", height: "320px", background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)" } as any} />

          <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}>

            {/* Logo */}
            <Link to="/" style={{
              display: "inline-flex", alignItems: "center", gap: "10px",
              marginBottom: "40px", textDecoration: "none",
            }}>
              <div style={{
                width: "42px", height: "42px", borderRadius: "12px",
                background: "linear-gradient(135deg, #fb923c, #ea580c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 20px rgba(249,115,22,0.40)",
                animation: "pulse-glow 3s ease-in-out infinite",
              }}>
                <GraduationCap size={22} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: "22px", color: "#fff", letterSpacing: "-0.5px" }}>Learnly</span>
            </Link>

            {/* Heading */}
            <div className="animate-slide-up" style={{ marginBottom: "28px" }}>
              <h1 style={{ fontSize: "30px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", margin: 0 }}>
                Welcome back 👋
              </h1>
              <p style={{ marginTop: "8px", color: "rgba(255,255,255,0.45)", fontSize: "14px" }}>
                Select your role to auto-fill demo credentials
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Role picker */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>
                  Sign in as
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {ROLES.map(r => {
                    const Icon = r.icon;
                    const active = selected === r.value;
                    return (
                      <button key={r.value} type="button" onClick={() => pickRole(r.value)}
                        className={cn("role-card", active && "active")}
                        style={{ transition: "all 0.25s ease" }}
                      >
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "8px", marginBottom: "8px",
                          background: active ? `${r.color}25` : "rgba(255,255,255,0.06)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: active ? `1px solid ${r.color}50` : "1px solid rgba(255,255,255,0.08)",
                          transition: "all 0.25s",
                        }}>
                          <Icon size={14} color={active ? r.color : "rgba(255,255,255,0.45)"} />
                        </div>
                        <p style={{ fontSize: "12px", fontWeight: 700, color: active ? "#fff" : "rgba(255,255,255,0.65)", margin: 0 }}>
                          {r.label}
                        </p>
                        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>
                          {r.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Email field */}
              <div>
                <label htmlFor="email" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: "8px" }}>
                  Email address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} color={focusedField === "email" ? "#f97316" : "rgba(255,255,255,0.30)"} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", transition: "color 0.2s" }} />
                  <input
                    id="email" type="email" required
                    value={email}
                    onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: "" })); }}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={cn("input-premium", fieldErrors.email && "error")}
                    style={{ paddingRight: "14px" }}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="animate-slide-up" style={{ marginTop: "6px", fontSize: "12px", color: "#f87171", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>⚠</span> {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label htmlFor="password" style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>
                    Password
                  </label>
                  <button type="button" onClick={() => toast.info("Password reset coming soon.")}
                    style={{ fontSize: "12px", color: "#fb923c", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <Lock size={16} color={focusedField === "password" ? "#f97316" : "rgba(255,255,255,0.30)"} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", transition: "color 0.2s" }} />
                  <input
                    id="password" type={showPw ? "text" : "password"} required
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: "" })); }}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={cn("input-premium", fieldErrors.password && "error")}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.40)", padding: "4px" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="animate-slide-up" style={{ marginTop: "6px", fontSize: "12px", color: "#f87171" }}>
                    ⚠ {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Remember me */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className={cn("check-box", rememberMe && "checked")} onClick={() => setRememberMe(s => !s)}>
                  {rememberMe && <CheckCircle2 size={11} color="#fff" strokeWidth={3} />}
                </div>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", cursor: "pointer" }} onClick={() => setRememberMe(s => !s)}>
                  Remember me for 7 days
                </span>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn-primary">
                {loading
                  ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Signing in…</>
                  : <>Sign in <ArrowRight size={16} /></>
                }
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.30)", textTransform: "uppercase", letterSpacing: "0.6px" }}>or continue with</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
              </div>

              {/* Social */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button type="button" className="social-btn" onClick={() => toast.info("Google SSO coming soon.")}>
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
                <button type="button" className="social-btn" onClick={() => toast.info("Facebook SSO coming soon.")}>
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
              </div>

              {/* Register link */}
              <p style={{ textAlign: "center", fontSize: "14px", color: "rgba(255,255,255,0.40)" }}>
                Don't have an account?{" "}
                <Link to="/register" style={{ color: "#fb923c", fontWeight: 600, textDecoration: "none" }}>
                  Sign up for free
                </Link>
              </p>
            </form>
          </div>
        </div>

        {/* ──────────────────────── RIGHT: INFO PANEL ──────────────────────── */}
        <div className="max-lg:hidden" style={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 48px",
          background: "linear-gradient(145deg, #0f172a 0%, #1e1033 50%, #0f172a 100%)",
        }}>
          {/* Background orbs */}
          <Orb style={{ top: "15%", left: "20%", width: "360px", height: "360px", background: "radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 65%)", animation: "float 7s ease-in-out infinite" } as any} />
          <Orb style={{ bottom: "10%", right: "10%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 65%)", animation: "float2 9s ease-in-out infinite" } as any} />
          <Orb style={{ top: "50%", left: "50%", width: "500px", height: "500px", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)" } as any} />

          {/* Floating decorative cards */}
          <div className="floating-card" style={{
            top: "10%", right: "8%",
            "--r": "-6deg",
            animationDelay: "0s",
          } as any}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #f97316, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Award size={16} color="#fff" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>Certificate Earned!</p>
                <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.40)" }}>React Mastery Course</p>
              </div>
            </div>
          </div>

          <div className="floating-card" style={{
            bottom: "18%", left: "6%",
            "--r": "4deg",
            animationDelay: "2s",
            animationDuration: "6s",
          } as any}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp size={16} color="#fff" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>92% Progress</p>
                <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.40)" }}>Advanced Python</p>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: "380px" }}>

            {/* Logo mark */}
            <div style={{ marginBottom: "28px", display: "inline-flex" }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "24px",
                background: "linear-gradient(135deg, #fb923c, #ea580c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 40px rgba(249,115,22,0.45)",
                animation: "pulse-glow 3s ease-in-out infinite",
              }}>
                <GraduationCap size={40} color="#fff" />
              </div>
            </div>

            <div className="badge badge-orange" style={{ marginBottom: "16px" }}>
              <Sparkles size={10} /> AI-Powered Learning Platform
            </div>

            <h2 style={{
              fontSize: "32px", fontWeight: 900, color: "#fff",
              lineHeight: "1.2", letterSpacing: "-0.8px", marginBottom: "14px",
            }}>
              Transform Your Future<br />
              <span style={{ background: "linear-gradient(90deg, #fb923c, #f43f5e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Through Learning
              </span>
            </h2>

            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", lineHeight: "1.7", marginBottom: "36px" }}>
              Join our community mastering new skills through personalized,
              intelligent education designed for real-world success.
            </p>

            {/* Feature list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "36px", textAlign: "left" }}>
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="feature-card">
                  <div style={{
                    width: "36px", height: "36px", minWidth: "36px", borderRadius: "10px",
                    background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.30)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={16} color="#fb923c" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#fff" }}>{label}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.40)" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Animated stats */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <div className="stat-pill">
                <span style={{ fontSize: "24px", fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>{counts.students}+</span>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>Students</span>
              </div>
              <div className="stat-pill">
                <span style={{ fontSize: "24px", fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>{counts.courses}</span>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>Courses</span>
              </div>
              <div className="stat-pill">
                <span style={{ fontSize: "24px", fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>{counts.success}%</span>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>Success</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
