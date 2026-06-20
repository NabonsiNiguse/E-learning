import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Smartphone, Building2, CreditCard, Shield, ArrowLeft,
  CheckCircle2, Lock, BookOpen, Zap, AlertCircle, Users,
  Star, BadgeCheck, Sparkles,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/components/layout/require-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/app-context";
import { useCourse, useInitiatePayment } from "@/lib/use-api";
import { toast } from "sonner";

export const Route = createFileRoute("/payment/$courseId")({
  head: () => ({ meta: [{ title: "Checkout — Learnly" }] }),
  component: PaymentPage,
});

type Method = "chapa" | "telebirr" | "bank" | "card";
type Step   = "form" | "processing" | "success";

const METHODS: { id: Method; label: string; desc: string; icon: typeof CreditCard; badge?: string }[] = [
  { id: "chapa",    label: "Chapa",    desc: "All Ethiopian methods", icon: Zap,        badge: "Recommended" },
  { id: "telebirr", label: "Telebirr", desc: "Mobile money",          icon: Smartphone },
  { id: "bank",     label: "Bank",     desc: "CBE, Awash, Dashen",    icon: Building2  },
  { id: "card",     label: "Card",     desc: "Visa / Mastercard",     icon: CreditCard },
];

const METHOD_MAP: Record<Method, "mock_card" | "mock_bank" | "mock_wallet"> = {
  chapa:    "mock_card",
  telebirr: "mock_wallet",
  bank:     "mock_bank",
  card:     "mock_card",
};

const CAT_GRADIENT: Record<string, string> = {
  Development: "from-emerald-500 to-teal-600",
  Design:      "from-sky-500 to-indigo-600",
  Data:        "from-amber-500 to-orange-600",
  Marketing:   "from-rose-500 to-pink-600",
  Business:    "from-violet-500 to-purple-600",
};

const PERKS = [
  "Lifetime access",
  "Certificate of completion",
  "30-day money-back guarantee",
  "Access on all devices",
];

// ── Skeleton loader ───────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-white/5", className)} />;
}

function PaymentPage() {
  const { courseId } = Route.useParams();
  const navigate     = useNavigate();
  const { currentUser } = useAuth();

  const numericId = parseInt(courseId, 10);
  const { data: course, isLoading, error } = useCourse(numericId);
  const payMutation = useInitiatePayment();

  const [method, setMethod] = useState<Method>("chapa");
  const [name,   setName]   = useState(currentUser?.full_name ?? "");
  const [email,  setEmail]  = useState(currentUser?.email ?? "");
  const [phone,  setPhone]  = useState("");
  const [step,   setStep]   = useState<Step>("form");

  const price    = course ? parseFloat(course.price) : 0;
  const gradient = course ? (CAT_GRADIENT[course.category] ?? "from-cyan-500 to-blue-600") : "from-cyan-500 to-blue-600";

  // ── Error ─────────────────────────────────────────────────────────────
  if (error && !isLoading) return (
    <RequireAuth>
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-sm text-muted-foreground">Course not found.</p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/courses">Browse courses</Link>
          </Button>
        </div>
      </AppLayout>
    </RequireAuth>
  );

  // ── Pay handler ───────────────────────────────────────────────────────
  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (method === "telebirr" && !phone.trim()) {
      toast.error("Phone number required for Telebirr");
      return;
    }
    setStep("processing");
    try {
      await payMutation.mutateAsync({
        course_id:      numericId,
        payment_method: METHOD_MAP[method],
        simulate:       "success",
      });
      setStep("success");
      toast.success("Payment verified — course unlocked!");
    } catch (err: any) {
      setStep("form");
      toast.error(
        err?.message?.includes("Cannot connect")
          ? "Backend offline — cannot process payment"
          : err?.message ?? "Payment failed"
      );
    }
  }

  // ── Success screen ────────────────────────────────────────────────────
  if (step === "success") return (
    <RequireAuth>
      <AppLayout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="w-full max-w-sm">
            {/* Confetti-style header */}
            <div className={cn("relative h-40 rounded-t-3xl overflow-hidden bg-gradient-to-br", gradient)}>
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
              </div>
              {/* Sparkle dots */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-1.5 w-1.5 rounded-full bg-white/60"
                  style={{ top: `${20 + (i * 13) % 60}%`, left: `${10 + (i * 17) % 80}%` }}
                />
              ))}
            </div>

            <div className="bg-card border border-t-0 rounded-b-3xl p-6 space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold">You're enrolled!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {course?.title}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/40 border divide-y divide-border text-sm">
                {[
                  ["Amount paid",  `$${price}`],
                  ["Method",       method.charAt(0).toUpperCase() + method.slice(1)],
                  ["Status",       "Confirmed ✓"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between px-4 py-2.5">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-semibold">{v}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Button asChild className="w-full gradient-primary text-white border-0 h-11 font-semibold">
                  <Link to="/lessons/$courseId" params={{ courseId }}>
                    Start learning →
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/courses">Browse more courses</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </RequireAuth>
  );

  // ── Processing screen ─────────────────────────────────────────────────
  if (step === "processing") return (
    <RequireAuth>
      <AppLayout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="text-center space-y-5 max-w-xs">
            <div className="relative mx-auto h-20 w-20">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative h-20 w-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Zap className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold">Processing payment…</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {method === "chapa"    ? "Connecting to Chapa…"
                 : method === "telebirr" ? "Waiting for Telebirr confirmation…"
                 : method === "bank"     ? "Verifying bank transfer…"
                 : "Verifying card…"}
              </p>
            </div>
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-2 w-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    </RequireAuth>
  );

  // ── Checkout form ─────────────────────────────────────────────────────
  return (
    <RequireAuth>
      <AppLayout>
        <div className="max-w-5xl mx-auto px-4 py-6">

          {/* Back */}
          <button
            onClick={() => navigate({ to: "/courses" })}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to courses
          </button>

          <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">

            {/* ── LEFT: form ── */}
            <form onSubmit={handlePay} className="space-y-4">

              {/* Mobile course card */}
              <div className="lg:hidden rounded-2xl border bg-card overflow-hidden">
                {isLoading ? (
                  <Skeleton className="h-28 w-full rounded-none" />
                ) : (
                  <div className={cn("relative h-28 bg-gradient-to-br", gradient)}>
                    {course?.thumbnail && (
                      <img src={course.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white font-bold text-sm truncate">{course?.title}</p>
                      <p className="text-white/70 text-xs">by {course?.teacher_name}</p>
                    </div>
                  </div>
                )}
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total due</span>
                  {isLoading
                    ? <Skeleton className="h-6 w-16" />
                    : <span className="text-xl font-black text-primary">${price}</span>
                  }
                </div>
              </div>

              {/* Contact details */}
              <div className="rounded-2xl border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</div>
                  <p className="font-semibold text-sm">Your details</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Full name</Label>
                    <Input
                      value={name} onChange={e => setName(e.target.value)} required
                      className="h-10 text-sm"
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input
                      type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="h-10 text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div className="rounded-2xl border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</div>
                  <p className="font-semibold text-sm">Payment method</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {METHODS.map(m => {
                    const Icon = m.icon;
                    const active = method === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id)}
                        className={cn(
                          "relative rounded-xl border-2 p-3.5 text-left transition-all",
                          active
                            ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]"
                            : "border-border hover:border-primary/40 hover:bg-muted/30"
                        )}
                      >
                        {m.badge && (
                          <span className="absolute -top-2.5 left-3 text-[9px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            {m.badge}
                          </span>
                        )}
                        <Icon className={cn("h-4 w-4 mb-2", active ? "text-primary" : "text-muted-foreground")} />
                        <p className={cn("text-xs font-bold", active ? "text-foreground" : "text-muted-foreground")}>{m.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{m.desc}</p>
                        {active && (
                          <div className="absolute top-2.5 right-2.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Method-specific fields */}
                {method === "chapa" && (
                  <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 space-y-2">
                    <p className="text-xs font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Chapa secure checkout
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Supports Telebirr, CBE Birr, HelloCash, Visa, and Mastercard via Chapa's encrypted gateway.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["Telebirr", "CBE Birr", "HelloCash", "Visa", "Mastercard"].map(b => (
                        <span key={b} className="text-[10px] bg-background border px-2 py-0.5 rounded-full font-medium">{b}</span>
                      ))}
                    </div>
                  </div>
                )}

                {method === "telebirr" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Telebirr phone number</Label>
                    <Input
                      value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+251 9XX XXX XXX"
                      className="h-10 text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground">You'll receive a USSD prompt to confirm.</p>
                  </div>
                )}

                {method === "card" && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Card number</Label>
                      <Input placeholder="4242 4242 4242 4242" className="h-10 text-sm font-mono" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Expiry</Label>
                        <Input placeholder="MM / YY" className="h-10 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">CVC</Label>
                        <Input placeholder="123" className="h-10 text-sm" />
                      </div>
                    </div>
                  </div>
                )}

                {method === "bank" && (
                  <div className="rounded-xl bg-muted/40 border p-4 space-y-2 text-xs">
                    <p className="font-semibold text-sm mb-3">Bank transfer details</p>
                    {[
                      ["Bank",         "Commercial Bank of Ethiopia"],
                      ["Account name", "Learnly Education PLC"],
                      ["Account no.",  "1000-2345-6789"],
                      ["Reference",    `LRN-${courseId}`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{k}</span>
                        <span className="font-mono font-semibold text-right">{v}</span>
                      </div>
                    ))}
                    <p className="text-muted-foreground pt-1 border-t mt-2">Verified within 24 hours.</p>
                  </div>
                )}
              </div>

              {/* Trust bar */}
              <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground py-1">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  256-bit SSL
                </span>
                <span className="h-3 w-px bg-border" />
                <span className="flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  Powered by Chapa
                </span>
                <span className="h-3 w-px bg-border" />
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Secure checkout
                </span>
              </div>

              {/* Pay button */}
              <Button
                type="submit"
                disabled={payMutation.isPending || isLoading}
                className="w-full h-12 gradient-primary text-white border-0 font-bold text-base gap-2 shadow-lg shadow-primary/20"
              >
                <Lock className="h-4 w-4" />
                {isLoading
                  ? "Loading…"
                  : method === "chapa"
                  ? `Pay with Chapa · $${price}`
                  : `Pay $${price}`}
              </Button>
            </form>

            {/* ── RIGHT: order summary ── */}
            <div className="hidden lg:block sticky top-20">
              <div className="rounded-3xl border bg-card overflow-hidden shadow-xl">

                {/* Course hero */}
                {isLoading ? (
                  <Skeleton className="h-44 w-full rounded-none" />
                ) : (
                  <div className={cn("relative h-44 bg-gradient-to-br", gradient)}>
                    {course?.thumbnail && (
                      <img src={course.thumbnail} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {course?.category && (
                      <Badge className="absolute top-3 left-3 bg-white/15 backdrop-blur text-white border-white/20 text-[10px]">
                        {course.category}
                      </Badge>
                    )}
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-white font-bold text-sm leading-snug line-clamp-2">{course?.title}</p>
                      <p className="text-white/60 text-xs mt-0.5">by {course?.teacher_name}</p>
                    </div>
                  </div>
                )}

                <div className="p-5 space-y-4">

                  {/* Course meta */}
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        {course?.lesson_count} lessons
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        {course?.enrolled_count} enrolled
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        4.8
                      </span>
                    </div>
                  )}

                  {/* Price breakdown */}
                  <div className="rounded-xl bg-muted/40 border divide-y divide-border text-sm">
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-muted-foreground">Course price</span>
                      {isLoading ? <Skeleton className="h-4 w-12" /> : <span>${price}</span>}
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-muted-foreground">Tax</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between px-4 py-3 font-bold">
                      <span>Total</span>
                      {isLoading
                        ? <Skeleton className="h-5 w-16" />
                        : <span className="text-primary text-base">${price}</span>
                      }
                    </div>
                  </div>

                  {/* Perks */}
                  <div className="space-y-2">
                    {PERKS.map(p => (
                      <div key={p} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {p}
                      </div>
                    ))}
                  </div>

                  {/* Guarantee badge */}
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <BadgeCheck className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">30-day guarantee</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Full refund if you're not satisfied.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </AppLayout>
    </RequireAuth>
  );
}
