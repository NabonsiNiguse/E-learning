import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  GraduationCap, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff,
  Users, Award, Target, TrendingUp, User, BookOpen, CheckCircle2,
  Sparkles, ShieldCheck, Star,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { authApi } from "@/lib/api";
import type { UserRole } from "@/lib/api";
import { registerSchema, flattenZodErrors } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Sign up — Learnly" },
      { name: "description", content: "Create your Learnly account." },
    ],
  }),
  component: RegisterPage,
});

const ROLES: { value: "teacher" | "student"; label: string; desc: string; icon: typeof Users; color: string; benefits: string[] }[] = [
  {
    value: "teacher",
    label: "Teacher",
    desc: "Create & teach",
    icon: GraduationCap,
    color: "#3b82f6",
    benefits: ["Build course content", "Track student progress", "Grade assignments"],
  },
  {
    value: "student",
    label: "Student",
    desc: "Learn & grow",
    icon: Users,
    color: "#10b981",
    benefits: ["Access all courses", "Earn certificates", "Track your learning"],
  },
];

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "Secure & Private", color: "#10b981" },
  { icon: Star,        label: "Expert Mentors",   color: "#f59e0b" },
  { icon: Award,       label: "Real Certificates", color: "#f97316" },
];

type FormErrors = Partial<Record<"firstName" | "lastName" | "email" | "password" | "password2", string>>;

function parseError(err: any): string {
  const msg: string = err?.message ?? "";
  if (msg.includes("aborted") || msg.includes("timeout"))
    return "Request timed out — make sure the backend is running on port 8000.";
  if (msg.includes("fetch") || msg.includes("connect") || msg.includes("Failed to fetch"))
    return "Cannot reach the server — start the Django backend and try again.";
  if (err?.status === 400) return msg || "Please check your details and try again.";
  return msg || "Registration failed. Please try again.";
}

function PasswordStrengthBar({ password }: { password: string }) {
  const score = (() => {
    let s = 0;
    if (password.length >= 8)              s++;
    if (/[A-Z]/.test(password))           s++;
    if (/[0-9]/.test(password))           s++;
    if (/[^A-Za-z0-9]/.test(password))   s++;
    return s;
  })();

  const labels  = ["", "Weak", "Okay", "Strong", "Very Strong"];
  const colors  = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];

  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: "4px", borderRadius: "99px",
            background: i <= score ? colors[score] : "rgba(255,255,255,0.08)",
            transition: "background 0.3s ease",
          }} />
        ))}
      </div>
      {password && (
        <p style={{ fontSize: "11px", color: score >= 3 ? colors[score] : "rgba(255,255,255,0.40)", fontWeight: 600 }}>
          {labels[score] || "Very Weak"}
        </p>
      )}
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useApp();

  const [role,       setRole]       = useState<"teacher" | "student">("student");
  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [password2,  setPassword2]  = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [showPw2,    setShowPw2]    = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [errors,     setErrors]     = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const r = params.get("role");
      if (r === "teacher" || r === "student") setRole(r);
    } catch (_) {}
  }, []);

  function clearError(field: keyof FormErrors) {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: FormErrors = {};
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim())  newErrors.lastName  = "Last name is required";
    if (!email.trim() || !email.includes("@")) newErrors.email = "Valid email required";
    if (password.length < 8) newErrors.password = "At least 8 characters required";
    if (password !== password2)  newErrors.password2 = "Passwords don't match";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    if (!acceptedTerms) {
      toast.error("You must accept the Terms and Privacy Policy to continue.");
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        email:      email.trim(),
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        password,
        password2,
        role,
      });

      toast.success("Account created! Signing you in…");
      await login(email.trim(), password);
      navigate({ to: "/dashboard", replace: true });
    } catch (err: any) {
      if (err?.errors && typeof err.errors === "object") {
        const mapped: FormErrors = {};
        for (const [k, v] of Object.entries(err.errors)) {
          const val = Array.isArray(v) ? (v as string[])[0] : String(v);
          if (k === "first_name")  mapped.firstName = val;
          else if (k === "last_name")  mapped.lastName  = val;
          else if (k === "email")      mapped.email     = val;
          else if (k === "password")   mapped.password  = val;
          else if (k === "password2")  mapped.password2 = val;
        }
        if (Object.keys(mapped).length) { setErrors(mapped); return; }
      }
      toast.error(parseError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', system-ui, sans-serif; }

        @keyframes float  { 0%,100%{transform:translateY(0px) rotate(0deg)} 33%{transform:translateY(-18px) rotate(2deg)} 66%{transform:translateY(-9px) rotate(-1deg)} }
        @keyframes float2 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-22px)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px rgba(249,115,22,0.3)} 50%{box-shadow:0 0 50px rgba(249,115,22,0.6)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes card-float { 0%,100%{transform:translateY(0px) rotate(var(--r,0deg))} 50%{transform:translateY(-12px) rotate(var(--r,0deg))} }

        .reg-input {
          width:100%; height:44px; padding:0 40px;
          background:rgba(255,255,255,0.05);
          border:1.5px solid rgba(255,255,255,0.12);
          border-radius:12px; color:#fff; font-size:14px;
          transition:all 0.25s ease; outline:none;
        }
        .reg-input::placeholder { color:rgba(255,255,255,0.25); }
        .reg-input:focus {
          border-color:#f97316;
          background:rgba(249,115,22,0.06);
          box-shadow:0 0 0 3px rgba(249,115,22,0.15);
        }
        .reg-input.error { border-color:#ef4444; background:rgba(239,68,68,0.05); }

        .reg-input-sm {
          width:100%; height:44px; padding:0 40px;
          background:rgba(255,255,255,0.05);
          border:1.5px solid rgba(255,255,255,0.12);
          border-radius:12px; color:#fff; font-size:14px;
          transition:all 0.25s ease; outline:none;
        }
        .reg-input-sm::placeholder { color:rgba(255,255,255,0.25); }
        .reg-input-sm:focus {
          border-color:#f97316;
          background:rgba(249,115,22,0.06);
          box-shadow:0 0 0 3px rgba(249,115,22,0.15);
        }
        .reg-input-sm.error { border-color:#ef4444; }

        .submit-btn {
          width:100%; height:48px; border:none; border-radius:12px;
          background:linear-gradient(135deg,#f97316,#ea6c0a);
          color:#fff; font-size:15px; font-weight:700; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:8px;
          box-shadow:0 4px 24px rgba(249,115,22,0.35);
          transition:all 0.25s ease; position:relative; overflow:hidden;
        }
        .submit-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 32px rgba(249,115,22,0.45); }
        .submit-btn:disabled { opacity:0.6; cursor:not-allowed; }

        .role-card-reg {
          border-radius:16px;
          border:2px solid rgba(255,255,255,0.10);
          background:rgba(255,255,255,0.04);
          padding:16px;
          cursor:pointer;
          transition:all 0.25s ease;
        }
        .role-card-reg:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.20); }
        .role-card-reg.active {
          border-color:#f97316;
          background:rgba(249,115,22,0.10);
          box-shadow:0 0 24px rgba(249,115,22,0.20);
        }

        .social-btn-reg {
          height:44px; border-radius:12px;
          border:1.5px solid rgba(255,255,255,0.12);
          background:rgba(255,255,255,0.04);
          color:rgba(255,255,255,0.8); font-size:14px; font-weight:500;
          cursor:pointer; display:flex; align-items:center;
          justify-content:center; gap:8px; transition:all 0.2s;
        }
        .social-btn-reg:hover { background:rgba(255,255,255,0.09); border-color:rgba(255,255,255,0.22); }

        .check-box-reg {
          width:16px; height:16px; min-width:16px;
          border-radius:5px;
          border:1.5px solid rgba(255,255,255,0.25);
          background:rgba(255,255,255,0.05);
          cursor:pointer; display:flex; align-items:center;
          justify-content:center; transition:all 0.2s;
        }
        .check-box-reg.checked { background:#f97316; border-color:#f97316; }

        .floating-card-reg {
          position:absolute; border-radius:16px;
          background:rgba(255,255,255,0.07);
          border:1px solid rgba(255,255,255,0.14);
          backdrop-filter:blur(16px);
          padding:12px 16px;
          animation:card-float 5s ease-in-out infinite;
        }
        .animate-slide-up { animation:slideUp 0.35s ease-out both; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1224 40%, #0a0f1e 100%)",
      }}>
        {/* ──────────────────── LEFT: FORM ──────────────────── */}
        <div style={{
          display: "flex", flexDirection: "column",
          justifyContent: "center", alignItems: "center",
          padding: "32px 24px", position: "relative", overflow: "hidden",
          overflowY: "auto",
        }}>
          {/* Orbs */}
          <div style={{ position: "absolute", top: "-100px", left: "-100px", width: "380px", height: "380px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.12), transparent 70%)", animation: "float 7s ease-in-out infinite", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-60px", right: "-60px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)", animation: "float2 9s ease-in-out infinite", pointerEvents: "none" }} />

          <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}>

            {/* Logo */}
            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "32px", textDecoration: "none" }}>
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
            <div style={{ marginBottom: "24px" }}>
              <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", margin: 0 }}>
                Create your account ✨
              </h1>
              <p style={{ marginTop: "8px", color: "rgba(255,255,255,0.40)", fontSize: "14px" }}>
                Join thousands of learners transforming their future
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

              {/* Role picker */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>
                  I am a
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {ROLES.map(r => {
                    const Icon = r.icon;
                    const active = role === r.value;
                    return (
                      <button key={r.value} type="button" onClick={() => setRole(r.value)}
                        className={cn("role-card-reg", active && "active")}>
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "10px", marginBottom: "10px",
                          background: active ? `${r.color}22` : "rgba(255,255,255,0.06)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: active ? `1px solid ${r.color}50` : "1px solid rgba(255,255,255,0.08)",
                          transition: "all 0.25s",
                        }}>
                          <Icon size={18} color={active ? r.color : "rgba(255,255,255,0.45)"} />
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: active ? "#fff" : "rgba(255,255,255,0.65)" }}>{r.label}</p>
                        <p style={{ margin: "3px 0 8px", fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{r.desc}</p>
                        {active && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            {r.benefits.map(b => (
                              <div key={b} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                <CheckCircle2 size={10} color={r.color} />
                                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.50)" }}>{b}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* First name */}
                <div>
                  <label htmlFor="firstName" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.65)", marginBottom: "6px" }}>First name</label>
                  <div style={{ position: "relative" }}>
                    <User size={14} color={focusedField === "firstName" ? "#f97316" : "rgba(255,255,255,0.28)"} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", transition: "color 0.2s" }} />
                    <input
                      id="firstName" type="text" required
                      value={firstName}
                      onChange={e => { setFirstName(e.target.value); clearError("firstName"); }}
                      onFocus={() => setFocusedField("firstName")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="John"
                      autoComplete="given-name"
                      className={cn("reg-input-sm", errors.firstName && "error")}
                      style={{ paddingRight: "12px" }}
                    />
                  </div>
                  {errors.firstName && <p className="animate-slide-up" style={{ marginTop: "4px", fontSize: "11px", color: "#f87171" }}>⚠ {errors.firstName}</p>}
                </div>

                {/* Last name */}
                <div>
                  <label htmlFor="lastName" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.65)", marginBottom: "6px" }}>Last name</label>
                  <div style={{ position: "relative" }}>
                    <User size={14} color={focusedField === "lastName" ? "#f97316" : "rgba(255,255,255,0.28)"} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", transition: "color 0.2s" }} />
                    <input
                      id="lastName" type="text" required
                      value={lastName}
                      onChange={e => { setLastName(e.target.value); clearError("lastName"); }}
                      onFocus={() => setFocusedField("lastName")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Doe"
                      autoComplete="family-name"
                      className={cn("reg-input-sm", errors.lastName && "error")}
                      style={{ paddingRight: "12px" }}
                    />
                  </div>
                  {errors.lastName && <p className="animate-slide-up" style={{ marginTop: "4px", fontSize: "11px", color: "#f87171" }}>⚠ {errors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: "8px" }}>Email address</label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} color={focusedField === "email" ? "#f97316" : "rgba(255,255,255,0.28)"} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", transition: "color 0.2s" }} />
                  <input
                    id="email" type="email" required
                    value={email}
                    onChange={e => { setEmail(e.target.value); clearError("email"); }}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={cn("reg-input", errors.email && "error")}
                    style={{ paddingRight: "14px" }}
                  />
                </div>
                {errors.email && <p className="animate-slide-up" style={{ marginTop: "5px", fontSize: "12px", color: "#f87171" }}>⚠ {errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: "8px" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} color={focusedField === "password" ? "#f97316" : "rgba(255,255,255,0.28)"} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", transition: "color 0.2s" }} />
                  <input
                    id="password" type={showPw ? "text" : "password"} required
                    value={password}
                    onChange={e => { setPassword(e.target.value); clearError("password"); }}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className={cn("reg-input", errors.password && "error")}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.38)", padding: "4px" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordStrengthBar password={password} />
                {errors.password && <p className="animate-slide-up" style={{ marginTop: "5px", fontSize: "12px", color: "#f87171" }}>⚠ {errors.password}</p>}
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="password2" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: "8px" }}>Confirm password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} color={focusedField === "password2" ? "#f97316" : "rgba(255,255,255,0.28)"} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", transition: "color 0.2s" }} />
                  <input
                    id="password2" type={showPw2 ? "text" : "password"} required
                    value={password2}
                    onChange={e => { setPassword2(e.target.value); clearError("password2"); }}
                    onFocus={() => setFocusedField("password2")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className={cn("reg-input", errors.password2 && "error")}
                  />
                  <button type="button" onClick={() => setShowPw2(s => !s)}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.38)", padding: "4px" }}>
                    {showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password2 && password === password2 && (
                  <div className="animate-slide-up" style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={12} color="#10b981" />
                    <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>Passwords match</span>
                  </div>
                )}
                {errors.password2 && <p className="animate-slide-up" style={{ marginTop: "5px", fontSize: "12px", color: "#f87171" }}>⚠ {errors.password2}</p>}
              </div>

              {/* Terms */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div className={cn("check-box-reg", acceptedTerms && "checked")}
                  style={{ marginTop: "2px" }}
                  onClick={() => setAcceptedTerms(s => !s)}>
                  {acceptedTerms && <CheckCircle2 size={11} color="#fff" strokeWidth={3} />}
                </div>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.50)", lineHeight: "1.5", cursor: "pointer" }} onClick={() => setAcceptedTerms(s => !s)}>
                  I agree to the{" "}
                  <a href="#" style={{ color: "#fb923c", textDecoration: "none", fontWeight: 600 }}>Terms of Service</a>{" "}and{" "}
                  <a href="#" style={{ color: "#fb923c", textDecoration: "none", fontWeight: 600 }}>Privacy Policy</a>
                </span>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="submit-btn">
                {loading
                  ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Creating account…</>
                  : <>Create account <ArrowRight size={16} /></>
                }
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.6px" }}>or sign up with</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
              </div>

              {/* Social */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button type="button" className="social-btn-reg" onClick={() => toast.info("Google SSO coming soon.")}>
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
                <button type="button" className="social-btn-reg" onClick={() => toast.info("Facebook SSO coming soon.")}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
              </div>

              {/* Login link */}
              <p style={{ textAlign: "center", fontSize: "14px", color: "rgba(255,255,255,0.40)" }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "#fb923c", fontWeight: 600, textDecoration: "none" }}>
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>

        {/* ──────────────────── RIGHT: INFO PANEL ──────────────────── */}
        <div className="max-lg:hidden" style={{
          position: "relative", overflow: "hidden",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "60px 48px",
          background: "linear-gradient(145deg, #0f172a 0%, #1a0f33 50%, #0f172a 100%)",
        }}>
          {/* Orbs */}
          <div style={{ position: "absolute", top: "15%", left: "15%", width: "380px", height: "380px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.16), transparent 65%)", animation: "float 7s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: "15%", right: "10%", width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.12), transparent 65%)", animation: "float2 9s ease-in-out infinite" }} />

          {/* Floating cards */}
          <div className="floating-card-reg" style={{ top: "8%", right: "6%", "--r": "-5deg", animationDelay: "0s" } as any}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={16} color="#fff" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.90)", fontWeight: 700 }}>Account Verified!</p>
                <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.40)" }}>Welcome to Learnly</p>
              </div>
            </div>
          </div>

          <div className="floating-card-reg" style={{ bottom: "15%", left: "5%", "--r": "4deg", animationDelay: "1.5s" } as any}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #f97316, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookOpen size={16} color="#fff" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.90)", fontWeight: 700 }}>6 Courses Available</p>
                <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.40)" }}>Start learning today</p>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: "380px" }}>
            <div style={{ marginBottom: "24px", display: "inline-flex" }}>
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

            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "5px 12px", borderRadius: "99px", marginBottom: "16px",
              background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.35)",
              fontSize: "11px", fontWeight: 700, color: "#fdba74",
            }}>
              <Sparkles size={10} /> Free to Join — Always
            </div>

            <h2 style={{
              fontSize: "30px", fontWeight: 900, color: "#fff",
              lineHeight: "1.2", letterSpacing: "-0.8px", marginBottom: "14px",
            }}>
              Start Your Learning<br />
              <span style={{ background: "linear-gradient(90deg, #10b981, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Journey Today
              </span>
            </h2>

            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.42)", lineHeight: "1.7", marginBottom: "32px" }}>
              Join thousands of learners transforming their future through
              AI-powered, personalized education.
            </p>

            {/* Trust items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
              {TRUST_ITEMS.map(({ icon: Icon, label, color }) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "12px 16px", borderRadius: "14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  textAlign: "left", transition: "all 0.3s",
                }}>
                  <div style={{
                    width: "36px", height: "36px", minWidth: "36px", borderRadius: "10px",
                    background: `${color}22`, border: `1px solid ${color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={16} color={color} />
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.80)" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              {[
                { value: "35+",  label: "Students"  },
                { value: "6",    label: "Courses"    },
                { value: "98%",  label: "Success"    },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, padding: "12px 8px", borderRadius: "12px",
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
                  textAlign: "center",
                }}>
                  <span style={{ display: "block", fontSize: "22px", fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>{s.value}</span>
                  <span style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700, marginTop: "2px" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
