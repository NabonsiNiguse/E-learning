import type { FileType } from "@/lib/mock-data";

export interface FileTypeConfig {
  label: string;
  ext: string;
  bg: string;       // Tailwind bg class
  text: string;     // Tailwind text class
  border: string;   // Tailwind border class
  iconBg: string;   // gradient or solid bg for the icon tile
}

export const FILE_TYPE_CONFIG: Record<FileType, FileTypeConfig> = {
  pdf: {
    label:  "PDF",
    ext:    ".pdf",
    bg:     "bg-red-500/10",
    text:   "text-red-600 dark:text-red-400",
    border: "border-red-500/20",
    iconBg: "from-red-400 to-rose-600",
  },
  ppt: {
    label:  "PPT",
    ext:    ".pptx",
    bg:     "bg-orange-500/10",
    text:   "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/20",
    iconBg: "from-orange-400 to-amber-600",
  },
  doc: {
    label:  "DOC",
    ext:    ".docx",
    bg:     "bg-sky-500/10",
    text:   "text-sky-600 dark:text-sky-400",
    border: "border-sky-500/20",
    iconBg: "from-sky-400 to-blue-600",
  },
  xls: {
    label:  "XLS",
    ext:    ".xlsx",
    bg:     "bg-emerald-500/10",
    text:   "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    iconBg: "from-emerald-400 to-teal-600",
  },
  zip: {
    label:  "ZIP",
    ext:    ".zip",
    bg:     "bg-violet-500/10",
    text:   "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/20",
    iconBg: "from-violet-400 to-purple-600",
  },
  txt: {
    label:  "TXT",
    ext:    ".txt",
    bg:     "bg-slate-500/10",
    text:   "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/20",
    iconBg: "from-slate-400 to-slate-600",
  },
  img: {
    label:  "IMG",
    ext:    ".png",
    bg:     "bg-pink-500/10",
    text:   "text-pink-600 dark:text-pink-400",
    border: "border-pink-500/20",
    iconBg: "from-pink-400 to-rose-500",
  },
};
