import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  GraduationCap, BookOpen, Users, Award, ArrowRight, Sparkles,
  CheckCircle2, Zap, TrendingUp, Target, Rocket, Brain,
  Shield, Star, Play, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRef } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Learnly — AI-Powered Learning Platform" },
      { name: "description", content: "A premium AI-powered e-learning platform for admins, teachers, and students." },
    ],
  }),
  component: Landing,
});

// Floating orb background element
function Orb({ className }: { className: string }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
    />
  );
}

function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY       = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="min-h-screen bg-[#080b14] text-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="sticky top-0 z-50 border-b border-white/5 bg-[#080b14]/80 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.5)]"
            >
              <GraduationCap className="h-5 w-5 text-white" />
            </motion.div>
            <span className="font-display font-bold text-xl">Learnly</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            {["Features", "Courses", "How it works", "Pricing"].map((item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                whileHover={{ color: "#fff" }}
                className="transition-colors"
              >
                {item}
              </motion.a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="hidden sm:inline-flex text-slate-300 hover:text-white hover:bg-white/5">
              <Link to="/login">Sign in</Link>
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] gap-1.5">
                <Link to="/login">Get started <ChevronRight className="h-4 w-4" /></Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Background orbs */}
        <Orb className="w-[600px] h-[600px] bg-orange-600/15 top-[-100px] right-[-100px]" />
        <Orb className="w-[500px] h-[500px] bg-blue-600/10 bottom-[-80px] left-[-80px]" />
        <Orb className="w-[300px] h-[300px] bg-purple-600/10 top-[40%] left-[40%]" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — copy */}
            <div className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Badge className="bg-orange-500/10 border-orange-500/25 text-orange-400 gap-1.5 py-1.5 px-3 backdrop-blur-sm">
                  <Brain className="h-3.5 w-3.5" /> AI-Powered Learning Platform
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold leading-[1.05] tracking-tight"
              >
                Learn skills that{" "}
                <span className="relative">
                  <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">
                    move you forward.
                  </span>
                  <motion.span
                    animate={{ scaleX: [0, 1] }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-400 origin-left"
                  />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-lg text-slate-400 leading-relaxed max-w-lg"
              >
                A premium AI-powered e-learning platform for teams and individuals. Tailored dashboards for admins, teachers, and students — beautiful by default.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" asChild className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:shadow-[0_0_45px_rgba(249,115,22,0.7)] h-12 px-7 text-base font-semibold gap-2">
                    <Link to="/login">Start learning <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" variant="outline" asChild className="h-12 px-7 border-white/10 text-slate-300 hover:text-white hover:bg-white/5 hover:border-orange-500/30 gap-2">
                    <Link to="/dashboard"><Play className="h-4 w-4 fill-current" /> View demo</Link>
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div className="mt-4 flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                <Button asChild variant="outline" size="sm">
                  <Link to="/register?role=student">Sign up as Student</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/register?role=teacher">Sign up as Teacher</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="text-slate-300">
                  <Link to="/login?role=student">Sign in as Student</Link>
                </Button>
              </motion.div>

              {/* Trust row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-6 pt-2"
              >
                <div className="flex -space-x-2">
                  {["EM", "NN", "KN", "EH", "MN"].map((init, i) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-[#080b14] flex items-center justify-center text-[10px] font-bold text-white">
                      {init}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-slate-400">
                  <span className="text-white font-semibold">35+</span> students already learning
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">4.9</span>
                </div>
              </motion.div>
            </div>

            {/* Right — collaborators 3D illustration */}
            <motion.div
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8, type: "spring", stiffness: 80 }}
              className="relative flex items-center justify-center"
            >
              {/* Glow behind image */}
              <div className="absolute w-[500px] h-[500px] rounded-full bg-orange-500/15 blur-[100px]" />

              {/* Floating stat cards */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 -left-6 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl z-20"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Completion rate</p>
                    <p className="text-sm font-bold text-white">98%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-8 -right-6 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl z-20"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Certificates issued</p>
                    <p className="text-sm font-bold text-white">12 this month</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-1/2 -right-10 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl z-20"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">AI lessons</p>
                    <p className="text-sm font-bold text-white">Active</p>
                  </div>
                </div>
              </motion.div>

              {/* Main illustration — collaborators-3d.png */}
              <motion.img
                src="/collaborators-3d.png"
                alt="Students and teachers collaborating"
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 w-[520px] h-[520px] object-contain drop-shadow-[0_30px_80px_rgba(249,115,22,0.25)]"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.style.display = "none";
                  const fb = el.nextElementSibling as HTMLElement;
                  if (fb) fb.style.display = "flex";
                }}
              />
              {/* Fallback */}
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 w-[520px] h-[520px] hidden items-center justify-center text-[160px] select-none"
              >
                🤝
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "35+",  label: "Active Students",  icon: Users,         color: "text-blue-400" },
              { value: "6",    label: "Expert Courses",   icon: BookOpen,      color: "text-orange-400" },
              { value: "2",    label: "Top Instructors",  icon: GraduationCap, color: "text-purple-400" },
              { value: "98%",  label: "Success Rate",     icon: TrendingUp,    color: "text-emerald-400" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-2"
              >
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <div className="text-3xl font-display font-black text-white">{s.value}</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-28">
        <Orb className="w-[400px] h-[400px] bg-orange-600/8 top-0 right-0" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <Badge className="mb-4 bg-orange-500/10 border-orange-500/20 text-orange-400 gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Platform Features
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-display font-bold">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              teach & learn
            </span>
          </h2>
          <p className="mt-4 text-slate-400 text-lg">Three roles. One beautiful experience.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: BookOpen,
              title: "Rich Course Library",
              desc: "Beautiful course pages with video lessons, notes, progress tracking, and downloadable resources.",
              gradient: "from-blue-500 to-cyan-500",
              glow: "rgba(59,130,246,0.2)",
              delay: 0.1,
            },
            {
              icon: Brain,
              title: "AI-Powered Learning",
              desc: "Intelligent recommendations adapt to your pace and style, creating personalized learning paths.",
              gradient: "from-orange-500 to-amber-500",
              glow: "rgba(249,115,22,0.2)",
              delay: 0.2,
              featured: true,
            },
            {
              icon: Award,
              title: "Real Progress & Certs",
              desc: "Track completion, earn certificates, and showcase your achievements to advance your career.",
              gradient: "from-purple-500 to-pink-500",
              glow: "rgba(168,85,247,0.2)",
              delay: 0.3,
            },
          ].map((f) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: f.delay, duration: 0.6 }}
              whileHover={{ y: -8 }}
              className={`relative rounded-2xl border p-8 transition-all duration-300 ${
                f.featured
                  ? "border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-500/5 shadow-[0_0_40px_rgba(249,115,22,0.15)]"
                  : "border-white/8 bg-white/[0.03] hover:border-white/15"
              }`}
            >
              {f.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 text-[10px] font-bold px-3">
                    ✦ MOST POPULAR
                  </Badge>
                </div>
              )}
              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                <f.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-xl text-white mb-3">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Role cards */}
        <div className="grid md:grid-cols-3 gap-5 mt-5">
          {[
            { role: "Admin",   icon: Shield,        color: "from-violet-500 to-purple-600", desc: "Full platform control — manage users, courses, payments, and analytics." },
            { role: "Teacher", icon: GraduationCap, color: "from-orange-500 to-amber-500",  desc: "Create courses, mark attendance, grade assignments, and track student progress." },
            { role: "Student", icon: Users,         color: "from-blue-500 to-cyan-500",     desc: "Enroll in courses, watch lessons, take quizzes, and earn certificates." },
          ].map((r, i) => (
            <motion.div
              key={r.role}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ y: -4 }}
              className="flex items-start gap-4 p-5 rounded-2xl border border-white/8 bg-white/[0.03] hover:border-white/15 transition-all"
            >
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center shrink-0 shadow-lg`}>
                <r.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white mb-1">{r.role}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{r.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Collaborators / Community section ── */}
      <section className="relative border-y border-white/5 overflow-hidden">
        <Orb className="w-[500px] h-[500px] bg-blue-600/8 top-0 left-0" />
        <Orb className="w-[400px] h-[400px] bg-orange-600/8 bottom-0 right-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — image */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative flex items-center justify-center"
            >
              {/* Glow */}
              <div className="absolute w-[480px] h-[480px] rounded-full bg-orange-500/10 blur-[100px]" />

              {/* Decorative ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute w-[420px] h-[420px] rounded-full border border-dashed border-orange-500/15"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute w-[320px] h-[320px] rounded-full border border-dashed border-white/8"
              />

              <motion.img
                src="/student-3d.png"
                alt="Student learning"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 w-[460px] h-[460px] object-contain drop-shadow-[0_30px_60px_rgba(249,115,22,0.2)]"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.style.display = "none";
                  const fb = el.nextElementSibling as HTMLElement;
                  if (fb) fb.style.display = "flex";
                }}
              />
              {/* Fallback */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 w-[460px] h-[460px] hidden items-center justify-center"
              >
                <div className="grid grid-cols-2 gap-4">
                  {["👩‍🏫", "👨‍🎓", "👩‍💻", "🤝"].map((e, i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                      className="h-24 w-24 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center text-4xl"
                    >
                      {e}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Right — copy */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-7"
            >
              <Badge className="bg-orange-500/10 border-orange-500/20 text-orange-400 gap-1.5">
                <Users className="h-3.5 w-3.5" /> Built for Collaboration
              </Badge>

              <h2 className="text-4xl sm:text-5xl font-display font-bold leading-tight">
                Where teachers &{" "}
                <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  students connect
                </span>
              </h2>

              <p className="text-slate-400 text-lg leading-relaxed">
                Learnly bridges the gap between educators and learners. Teachers create, students grow — all in one seamless, AI-enhanced environment.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Target,       text: "Personalized learning paths for every student" },
                  { icon: CheckCircle2, text: "Real-time attendance and progress tracking" },
                  { icon: Zap,          text: "Instant feedback on quizzes and assignments" },
                  { icon: TrendingUp,   text: "Analytics dashboards for every role" },
                ].map((item, i) => (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-3"
                  >
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(249,115,22,0.3)]">
                      <item.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-slate-300 text-sm font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button asChild className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] h-12 px-7 gap-2">
                  <Link to="/login">Join the community <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <Badge className="mb-4 bg-orange-500/10 border-orange-500/20 text-orange-400 gap-1.5">
            <Rocket className="h-3.5 w-3.5" /> How It Works
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-display font-bold">
            From sign-up to{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              certificate
            </span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

          {[
            { step: "01", icon: Target,       title: "Pick your role",       desc: "Sign in as Admin, Teacher, or Student. Credentials auto-fill." },
            { step: "02", icon: BookOpen,     title: "Browse courses",       desc: "Explore a curated catalogue of courses across multiple categories." },
            { step: "03", icon: CheckCircle2, title: "Enroll & learn",       desc: "Pay securely, access lessons, take notes, and track your progress." },
            { step: "04", icon: Award,        title: "Earn certificate",     desc: "Complete a course and receive a recognized certificate." },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative flex flex-col items-center text-center gap-4"
            >
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.3)] z-10 relative">
                  <s.icon className="h-9 w-9 text-white" />
                </div>
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-slate-900 border border-orange-500/40 text-[10px] font-black text-orange-400 flex items-center justify-center">
                  {s.step}
                </span>
              </div>
              <h3 className="font-bold text-white text-lg">{s.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Featured Courses ── */}
      <section id="courses" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-28">
        <Orb className="w-[400px] h-[400px] bg-blue-600/8 bottom-0 left-0" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <Badge className="mb-4 bg-orange-500/10 border-orange-500/20 text-orange-400 gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Featured Courses
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-display font-bold">
            Start with our{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              top picks
            </span>
          </h2>
          <p className="mt-4 text-slate-400 text-lg">Curated courses taught by expert instructors, ready when you are.</p>
        </motion.div>

        {/* Course filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {["All", "Web Dev", "Data Science", "Design", "Business"].map((cat) => (
            <button
              key={cat}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all border",
                cat === "All"
                  ? "bg-orange-500 text-white border-orange-500 shadow-[0_0_16px_rgba(249,115,22,0.4)]"
                  : "border-white/10 text-slate-400 hover:text-white hover:border-white/20 bg-white/[0.03]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Full-Stack Web Development",
              instructor: "Nabonsi T.",
              category: "Web Dev",
              level: "Intermediate",
              lessons: 48,
              students: 1240,
              rating: 4.9,
              price: 499,
              gradient: "from-blue-500 to-cyan-500",
              badge: "Bestseller",
              badgeColor: "bg-amber-400 text-amber-900",
            },
            {
              title: "Python for Data Science",
              instructor: "Ermiyas K.",
              category: "Data Science",
              level: "Beginner",
              lessons: 36,
              students: 980,
              rating: 4.8,
              price: 399,
              gradient: "from-orange-500 to-amber-500",
              badge: "New",
              badgeColor: "bg-emerald-400 text-emerald-900",
            },
            {
              title: "UI/UX Design Fundamentals",
              instructor: "Keab M.",
              category: "Design",
              level: "Beginner",
              lessons: 28,
              students: 760,
              rating: 4.7,
              price: 349,
              gradient: "from-violet-500 to-purple-600",
              badge: "Popular",
              badgeColor: "bg-blue-400 text-blue-900",
            },
            {
              title: "React & TypeScript Mastery",
              instructor: "Nabonsi T.",
              category: "Web Dev",
              level: "Advanced",
              lessons: 52,
              students: 1050,
              rating: 5.0,
              price: 549,
              gradient: "from-cyan-500 to-teal-500",
              badge: "Top Rated",
              badgeColor: "bg-orange-400 text-orange-900",
            },
            {
              title: "Machine Learning A-Z",
              instructor: "Ermiyas K.",
              category: "Data Science",
              level: "Intermediate",
              lessons: 64,
              students: 2100,
              rating: 4.9,
              price: 599,
              gradient: "from-pink-500 to-rose-500",
              badge: "Bestseller",
              badgeColor: "bg-amber-400 text-amber-900",
            },
            {
              title: "Business Strategy & Growth",
              instructor: "Keab M.",
              category: "Business",
              level: "Beginner",
              lessons: 24,
              students: 420,
              rating: 4.6,
              price: 299,
              gradient: "from-emerald-500 to-green-500",
              badge: "New",
              badgeColor: "bg-emerald-400 text-emerald-900",
            },
          ].map((course, i) => (
            <motion.div
              key={course.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative rounded-2xl border border-white/8 bg-white/[0.03] hover:border-white/15 overflow-hidden transition-all duration-300 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
            >
              {/* Thumbnail */}
              <div className={`relative h-44 bg-gradient-to-br ${course.gradient} overflow-hidden`}>
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: "radial-gradient(circle at 30% 30%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                    <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                  </div>
                </div>
                {/* Badge */}
                <span className={`absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-full ${course.badgeColor}`}>
                  {course.badge}
                </span>
                {/* Level */}
                <span className="absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm">
                  {course.level}
                </span>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{course.category}</p>
                  <h3 className="font-bold text-white text-base leading-tight line-clamp-2 group-hover:text-orange-300 transition-colors">{course.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">by {course.instructor}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" /> {course.lessons} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {course.students.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Star className="h-3.5 w-3.5 fill-amber-400" /> {course.rating}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-lg font-black text-white">${course.price}</span>
                  <Button
                    size="sm"
                    asChild
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 text-xs h-8 px-4 shadow-[0_0_12px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]"
                  >
                    <Link to="/login">Enroll now</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Button variant="outline" size="lg" asChild className="h-12 px-8 border-white/10 text-slate-300 hover:text-white hover:bg-white/5 hover:border-orange-500/30 gap-2">
              <Link to="/login">View all courses <ChevronRight className="h-4 w-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="relative border-y border-white/5 overflow-hidden">
        <Orb className="w-[500px] h-[500px] bg-orange-600/6 top-0 right-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <Badge className="mb-4 bg-orange-500/10 border-orange-500/20 text-orange-400 gap-1.5">
              <Star className="h-3.5 w-3.5" /> Student Stories
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-display font-bold">
              Loved by{" "}
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                learners everywhere
              </span>
            </h2>
            <p className="mt-4 text-slate-400 text-lg">Real results from real students on Learnly.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: "Keab Negash",
                role: "Student → Frontend Dev",
                initials: "KN",
                gradient: "from-orange-500 to-amber-500",
                stars: 5,
                quote: "Learnly transformed how I learn. The personalized paths and AI assistant kept me on track when I was stuck. I landed my first dev job 3 months after finishing the React course.",
              },
              {
                name: "Ermiyas Haile",
                role: "Student → Data Analyst",
                initials: "EH",
                gradient: "from-blue-500 to-cyan-500",
                stars: 5,
                quote: "The Python for Data Science course is incredible. Real-world projects, instant quiz feedback, and a progress tracker that actually motivates you. Best investment I've made.",
                featured: true,
              },
              {
                name: "Mekdes Negash",
                role: "Teacher on Learnly",
                initials: "MN",
                gradient: "from-violet-500 to-purple-600",
                stars: 5,
                quote: "As a teacher, the course creation tools are intuitive and powerful. I can track every student's progress, mark attendance, and grade assignments from one beautiful dashboard.",
              },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -6 }}
                className={cn(
                  "relative rounded-2xl border p-7 transition-all duration-300",
                  t.featured
                    ? "border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-500/5 shadow-[0_0_40px_rgba(249,115,22,0.1)]"
                    : "border-white/8 bg-white/[0.03] hover:border-white/15"
                )}
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-5">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-slate-300 text-sm leading-relaxed mb-6">"{t.quote}"</p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/8">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                  {t.featured && (
                    <div className="ml-auto">
                      <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 text-[10px]">
                        ✦ Featured
                      </Badge>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Benefits strip */}
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Shield,      title: "30-day guarantee",   desc: "Not satisfied? Full refund, no questions asked." },
              { icon: Zap,         title: "Learn at your pace", desc: "Lifetime access to all course materials." },
              { icon: Award,       title: "Verified certificates", desc: "Industry-recognized credentials to boost your career." },
              { icon: Brain,       title: "AI-powered support", desc: "Get unstuck instantly with our built-in AI tutor." },
            ].map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 p-4 rounded-xl border border-white/8 bg-white/[0.02]"
              >
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(249,115,22,0.25)]">
                  <b.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{b.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      <section id="pricing" className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-[2.5rem] overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500" />
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "50px 50px" }} />

          {/* Floating particles */}
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0, 0.8, 0], y: [0, -80], x: [0, i % 2 === 0 ? 30 : -30] }}
              transition={{ duration: 3.5, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
              className="absolute w-2 h-2 rounded-full bg-white"
              style={{ left: `${8 + i * 9}%`, bottom: "15%" }}
            />
          ))}

          <div className="relative z-10 py-20 px-8 sm:px-16 text-center">
            <motion.div
              animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="inline-block mb-6"
            >
              <Rocket className="h-16 w-16 text-white drop-shadow-2xl" />
            </motion.div>

            <h2 className="text-4xl sm:text-6xl font-display font-black text-white leading-tight">
              Ready to start learning?
            </h2>
            <p className="mt-5 text-lg text-white/85 max-w-xl mx-auto">
              Join our growing community of learners building real skills with Learnly. Start your journey today — it's free.
            </p>

            <motion.div
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" asChild className="bg-white text-orange-600 hover:bg-white/90 h-14 px-10 font-bold text-lg shadow-2xl gap-2">
                  <Link to="/login">Get started free <ArrowRight className="h-5 w-5" /></Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" variant="outline" asChild className="h-14 px-10 border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-semibold gap-2">
                  <Link to="/dashboard"><Play className="h-4 w-4 fill-current" /> View demo</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-bold text-white">Learnly</span>
          </div>
          <p className="text-sm text-slate-500">© 2026 Learnly. Built as a portfolio prototype with ❤️</p>
          <div className="flex items-center gap-5 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <Link to="/login" className="hover:text-white transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
