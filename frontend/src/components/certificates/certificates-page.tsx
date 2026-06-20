import { useState, useRef, useEffect } from "react";
import {
  Award, Download, Share2, Eye, EyeOff,
  CheckCircle2, Lock, Sparkles, X, Trophy,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/app-context";
import { mockCertificates, type Certificate, type Course } from "@/lib/mock-data";
import { CertificateDocument } from "./certificate-document";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Confetti particle (CSS-only, no library needed)
// ---------------------------------------------------------------------------
function ConfettiParticle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute w-2 h-2 rounded-sm animate-bounce"
      style={style}
    />
  );
}

function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  const colors = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#f97316"];
  const particles = Array.from({ length: 40 }).map((_, i) => ({
    left:  `${Math.random() * 100}%`,
    top:   `${Math.random() * 60}%`,
    backgroundColor: colors[i % colors.length],
    animationDelay:  `${Math.random() * 0.5}s`,
    animationDuration: `${0.8 + Math.random() * 0.8}s`,
    transform: `rotate(${Math.random() * 360}deg)`,
    opacity: Math.random() * 0.8 + 0.2,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {particles.map((p, i) => <ConfettiParticle key={i} style={p} />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unlock animation overlay
// ---------------------------------------------------------------------------
function UnlockOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative text-center animate-in zoom-in-50 duration-500">
        <Confetti show />
        <div className="h-28 w-28 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mx-auto shadow-2xl animate-pulse">
          <Trophy className="h-14 w-14 text-white" />
        </div>
        <h2 className="mt-6 text-3xl font-display font-black text-white">Congratulations!</h2>
        <p className="mt-2 text-white/80 text-sm">Your certificate has been unlocked 🎉</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Share modal (UI only)
// ---------------------------------------------------------------------------
function ShareModal({ cert, onClose }: { cert: Certificate; onClose: () => void }) {
  const shareUrl = `https://learnly.io/verify/${cert.id}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border-border shadow-soft">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" /> Share certificate
          </h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Share your achievement for <strong>{cert.course_title}</strong> with the world.
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
            <span className="text-xs text-muted-foreground flex-1 truncate font-mono">{shareUrl}</span>
            <Button size="sm" variant="outline" className="h-7 text-xs shrink-0"
              onClick={() => { navigator.clipboard?.writeText(shareUrl); toast.success("Link copied!"); }}>
              Copy
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { platform: "LinkedIn", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
              { platform: "Twitter / X", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just earned a certificate in ${cert.course_title} on Learnly! 🎓`)}&url=${encodeURIComponent(shareUrl)}` },
              { platform: "Email", url: `mailto:?subject=${encodeURIComponent(`My ${cert.course_title} Certificate`)}&body=${encodeURIComponent(`Check out my certificate: ${shareUrl}`)}` },
            ].map(({ platform, url }) => (
              <Button key={platform} variant="outline" size="sm" className="h-9 text-xs"
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}>
                {platform}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Course certificate row — shows status + actions
// ---------------------------------------------------------------------------
function CourseCertRow({
  course,
  certificate,
  onPreview,
  onShare,
}: {
  course: Course;
  certificate?: Certificate;
  onPreview: () => void;
  onShare: () => void;
}) {
  const progress   = course.progress ?? 0;
  const isComplete = progress === 100;

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-xl border transition-all",
      isComplete
        ? "border-amber-400/30 bg-gradient-to-r from-amber-50/60 to-yellow-50/30 dark:from-amber-950/10 dark:to-transparent hover:shadow-md"
        : "border-border bg-secondary/20 hover:bg-secondary/40"
    )}>
      {/* Course thumbnail */}
      <div className={cn(
        "h-12 w-12 rounded-xl bg-gradient-to-br shrink-0 flex items-center justify-center",
        course.thumbnail
      )}>
        {isComplete
          ? <Award className="h-6 w-6 text-white" />
          : <Lock className="h-5 w-5 text-white/70" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-sm truncate">{course.title}</span>
          {isComplete ? (
            <Badge className="bg-amber-400/15 text-amber-700 border-amber-400/30 text-[10px] gap-1 shrink-0">
              <CheckCircle2 className="h-3 w-3" /> Earned
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">
              {progress}% complete
            </Badge>
          )}
        </div>
        {isComplete ? (
          <p className="text-xs text-muted-foreground">
            Issued {certificate ? new Date(certificate.issued_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            {certificate && <span className="ml-2 font-mono text-[10px] text-muted-foreground/60">{certificate.id}</span>}
          </p>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <Progress value={progress} className="h-1.5 flex-1 max-w-[140px]" />
            <span className="text-[10px] text-muted-foreground">{100 - progress}% remaining</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {isComplete ? (
          <>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={onPreview}>
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
            <Button size="sm" className="h-8 gap-1.5 text-xs gradient-primary text-white border-0"
              onClick={() => {
                const link = document.createElement("a");
                link.href = `data:text/plain;charset=utf-8,Certificate: ${certificate?.id ?? ""}`;
                link.download = `certificate-${course.id}.pdf`;
                toast.success("Certificate download started.");
                window.print();
              }}>
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onShare}>
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground italic">Complete course to unlock</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export function CertificatesPage() {
  const { courses, currentUser } = useApp();
  const certRef = useRef<HTMLDivElement>(null);

  const studentId   = currentUser?.id?.toString() ?? "u3";
  const studentName = currentUser?.full_name ?? "Daniel Tesfaye";

  // Courses with progress (enrolled)
  const enrolledCourses = courses.filter((c) => c.progress !== undefined && !c.locked);
  const completedCourses = enrolledCourses.filter((c) => c.progress === 100);
  const inProgressCourses = enrolledCourses.filter((c) => (c.progress ?? 0) < 100);

  // Build certificate map — real certs + mock-generate for completed courses
  const certMap = new Map<string, Certificate>();
  mockCertificates.forEach((c) => certMap.set(c.course_id, c));

  // Auto-generate mock certs for any completed course that doesn't have one
  completedCourses.forEach((course) => {
    if (!certMap.has(course.id)) {
      const hash = course.id.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
      certMap.set(course.id, {
        id:                `CERT-2026-${hash}`,
        course_id:         course.id,
        course_title:      course.title,
        course_category:   course.category,
        student_id:        studentId,
        student_name:      studentName,
        instructor_name:   course.instructor,
        issued_date:       "2026-04-15",
        completion_date:   "2026-04-14",
        grade:             "Merit",
        score:             85,
      });
    }
  });

  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const [shareCert, setShareCert]     = useState<Certificate | null>(null);
  const [showUnlock, setShowUnlock]   = useState(false);
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);

  // Simulate unlock animation for demo
  const handleSimulateUnlock = () => {
    setShowUnlock(true);
    setJustUnlocked("c1");
  };

  return (
    <div className="space-y-6">
      {/* Unlock animation */}
      {showUnlock && <UnlockOverlay onDone={() => setShowUnlock(false)} />}

      {/* Share modal */}
      {shareCert && <ShareModal cert={shareCert} onClose={() => setShareCert(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            My Certificates
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complete courses to earn verified certificates of achievement
          </p>
        </div>
        {/* Demo button */}
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleSimulateUnlock}>
          <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Simulate unlock
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Earned",      value: completedCourses.length,  color: "from-amber-400 to-yellow-500",  icon: Award },
          { label: "In progress", value: inProgressCourses.length, color: "from-sky-400 to-indigo-500",    icon: Trophy },
          { label: "Total courses",value: enrolledCourses.length,  color: "from-emerald-400 to-teal-500",  icon: CheckCircle2 },
        ].map((s) => (
          <Card key={s.label} className="p-4 border-border shadow-soft flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", s.color)}>
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold font-display leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Certificate preview modal ── */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl space-y-4">
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" />
                Certificate Preview
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="gradient-primary text-white border-0 gap-1.5"
                  onClick={() => { toast.success("Certificate download started."); window.print(); }}
                >
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => { setShareCert(previewCert); setPreviewCert(null); }}
                >
                  <Share2 className="h-4 w-4" /> Share
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 text-white hover:bg-white/10"
                  onClick={() => setPreviewCert(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Certificate */}
            <CertificateDocument ref={certRef} certificate={previewCert} />

            {/* Cert ID */}
            <p className="text-center text-white/40 text-xs font-mono">
              Certificate ID: {previewCert.id}
            </p>
          </div>
        </div>
      )}

      {/* ── Earned certificates ── */}
      {completedCourses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Earned certificates</h3>
            <Badge className="bg-amber-400/15 text-amber-700 border-amber-400/30 text-[10px]">
              {completedCourses.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {completedCourses.map((course) => {
              const cert = certMap.get(course.id);
              return (
                <CourseCertRow
                  key={course.id}
                  course={course}
                  certificate={cert}
                  onPreview={() => cert && setPreviewCert(cert)}
                  onShare={() => cert && setShareCert(cert)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── In-progress courses ── */}
      {inProgressCourses.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Locked — complete to unlock</h3>
            <Badge variant="outline" className="text-[10px]">{inProgressCourses.length}</Badge>
          </div>
          <div className="space-y-2">
            {inProgressCourses.map((course) => (
              <CourseCertRow
                key={course.id}
                course={course}
                onPreview={() => {}}
                onShare={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {enrolledCourses.length === 0 && (
        <Card className="border-border shadow-soft">
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Award className="h-12 w-12 opacity-20" />
            <p className="text-sm font-medium">No courses enrolled yet</p>
            <p className="text-xs">Enroll in a course to start earning certificates.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
