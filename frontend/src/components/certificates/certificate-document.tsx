/**
 * CertificateDocument — the visual certificate itself.
 * Designed to look premium: gold border, navy header, serif title,
 * decorative lines, seal, and watermark.
 *
 * Pass ref to the outer div to use html2canvas / print for download.
 */
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { Certificate } from "@/lib/mock-data";

interface CertificateDocumentProps {
  certificate: Certificate;
  className?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ── Decorative SVG corner ornament ──────────────────────────────────────────
function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={cn("w-16 h-16 text-amber-400/60", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <path d="M4 4 L4 30 M4 4 L30 4" strokeWidth="2.5" />
      <path d="M10 10 L10 26 M10 10 L26 10" />
      <circle cx="4" cy="4" r="2.5" fill="currentColor" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );
}

// ── Decorative divider line ──────────────────────────────────────────────────
function GoldDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-amber-400/80" />
      <div className="flex items-center gap-1.5">
        <div className="h-1 w-1 rounded-full bg-amber-400" />
        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        <div className="h-1 w-1 rounded-full bg-amber-400" />
      </div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-400/60 to-amber-400/80" />
    </div>
  );
}

// ── Seal / stamp ─────────────────────────────────────────────────────────────
function Seal() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ring */}
      <div className="h-20 w-20 rounded-full border-2 border-amber-400/70 flex items-center justify-center">
        {/* Inner ring */}
        <div className="h-16 w-16 rounded-full border border-amber-400/50 flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100/50">
          {/* Center mark */}
          <div className="text-center">
            <div className="text-[8px] font-bold text-amber-700 tracking-widest uppercase leading-none">Learnly</div>
            <div className="h-px w-8 bg-amber-400/60 mx-auto my-0.5" />
            <div className="text-[6px] text-amber-600 tracking-wider uppercase">Certified</div>
          </div>
        </div>
      </div>
      {/* Radiating lines */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute h-px w-2.5 bg-amber-400/40 origin-right"
          style={{
            right: "50%",
            top: "50%",
            transform: `translateY(-50%) rotate(${i * 30}deg) translateX(${-42}px)`,
          }}
        />
      ))}
    </div>
  );
}

// ── Grade badge ───────────────────────────────────────────────────────────────
function GradeBadge({ grade, score }: { grade: string; score: number }) {
  const colors =
    grade === "Distinction" ? "from-amber-400 to-yellow-500 text-amber-900" :
    grade === "Merit"       ? "from-sky-400 to-blue-500 text-sky-900" :
                              "from-emerald-400 to-teal-500 text-emerald-900";
  return (
    <div className={cn(
      "inline-flex flex-col items-center px-5 py-2 rounded-full bg-gradient-to-r shadow-md",
      colors
    )}>
      <span className="text-xs font-bold tracking-widest uppercase">{grade}</span>
      <span className="text-[10px] font-medium opacity-80">{score}% Final Score</span>
    </div>
  );
}

// ── Main certificate ──────────────────────────────────────────────────────────
export const CertificateDocument = forwardRef<HTMLDivElement, CertificateDocumentProps>(
  ({ certificate, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Outer gold border frame
          "relative bg-white overflow-hidden select-none",
          "border-[6px] border-amber-400/80",
          "shadow-[0_0_0_2px_rgba(180,130,0,0.15),0_20px_60px_-10px_rgba(0,0,0,0.25)]",
          "rounded-sm",
          // Fixed aspect ratio — A4 landscape proportions
          "w-full aspect-[1.414/1]",
          className
        )}
      >
        {/* ── Watermark ── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span
            className="text-[120px] font-black text-amber-100/40 tracking-widest uppercase rotate-[-25deg] whitespace-nowrap"
            style={{ fontFamily: "serif" }}
          >
            LEARNLY
          </span>
        </div>

        {/* ── Inner border ── */}
        <div className="absolute inset-3 border border-amber-300/50 rounded-sm pointer-events-none" />
        <div className="absolute inset-[14px] border border-amber-200/30 rounded-sm pointer-events-none" />

        {/* ── Corner ornaments ── */}
        <CornerOrnament className="absolute top-4 left-4" />
        <CornerOrnament className="absolute top-4 right-4 rotate-90" />
        <CornerOrnament className="absolute bottom-4 left-4 -rotate-90" />
        <CornerOrnament className="absolute bottom-4 right-4 rotate-180" />

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col items-center justify-between h-full px-12 py-8 text-center">

          {/* Header */}
          <div className="w-full space-y-2">
            {/* Institution name */}
            <div className="flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/50" />
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <span className="text-white text-[8px] font-black">L</span>
                </div>
                <span
                  className="text-xs font-bold tracking-[0.3em] uppercase text-slate-500"
                  style={{ fontFamily: "serif" }}
                >
                  Learnly E-Learning Platform
                </span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/50" />
            </div>

            {/* Certificate of Completion */}
            <div>
              <p className="text-[10px] tracking-[0.4em] uppercase text-amber-600 font-semibold">
                Certificate of Completion
              </p>
              <h1
                className="text-3xl sm:text-4xl font-black text-slate-800 mt-1 leading-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Certificate of Achievement
              </h1>
            </div>

            <GoldDivider className="mt-1" />
          </div>

          {/* Body */}
          <div className="space-y-3 w-full">
            <p className="text-xs text-slate-500 tracking-wider uppercase">
              This is to certify that
            </p>

            {/* Student name */}
            <div className="relative inline-block">
              <h2
                className="text-2xl sm:text-3xl font-bold text-slate-800 px-8"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                {certificate.student_name}
              </h2>
              <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            </div>

            <p className="text-xs text-slate-500 tracking-wider uppercase mt-1">
              has successfully completed the course
            </p>

            {/* Course title */}
            <div className="bg-gradient-to-r from-transparent via-slate-50 to-transparent py-2 px-6 rounded">
              <h3
                className="text-lg sm:text-xl font-bold text-slate-700"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                {certificate.course_title}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 tracking-wider uppercase">
                {certificate.course_category}
              </p>
            </div>

            {/* Grade badge */}
            <div className="flex justify-center mt-1">
              <GradeBadge grade={certificate.grade} score={certificate.score} />
            </div>
          </div>

          {/* Footer */}
          <div className="w-full space-y-3">
            <GoldDivider />

            <div className="grid grid-cols-3 items-end gap-4">
              {/* Instructor signature */}
              <div className="text-center">
                <div
                  className="text-base font-bold text-slate-600 border-b border-slate-300 pb-1 mb-1"
                  style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
                >
                  {certificate.instructor_name}
                </div>
                <p className="text-[9px] text-slate-400 tracking-wider uppercase">Instructor</p>
              </div>

              {/* Seal */}
              <div className="flex justify-center">
                <Seal />
              </div>

              {/* Date + ID */}
              <div className="text-center space-y-1">
                <div className="text-xs font-semibold text-slate-600 border-b border-slate-300 pb-1 mb-1">
                  {formatDate(certificate.issued_date)}
                </div>
                <p className="text-[9px] text-slate-400 tracking-wider uppercase">Date of Issue</p>
                <p className="text-[8px] text-slate-300 font-mono mt-1">{certificate.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CertificateDocument.displayName = "CertificateDocument";
