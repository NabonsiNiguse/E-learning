/**
 * Shared download utility.
 *
 * In production this would call the backend API to get a signed URL.
 * In demo/mock mode it creates a Blob with placeholder content so the
 * browser actually triggers a real "Save file" dialog.
 */

/**
 * Trigger a browser download for a named file.
 * Uses a Blob so the browser shows a real save dialog even in demo mode.
 */
export function downloadFile(fileName: string, mimeType = "application/octet-stream") {
  const placeholder = `Learnly — ${fileName}\n\nThis file would contain the real content in production.`;
  const blob = new Blob([placeholder], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Guess MIME type from file extension */
export function mimeFromName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf:  "application/pdf",
    doc:  "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt:  "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xls:  "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    zip:  "application/zip",
    csv:  "text/csv",
    txt:  "text/plain",
    png:  "image/png",
    jpg:  "image/jpeg",
    jpeg: "image/jpeg",
    ipynb:"application/json",
    ts:   "text/plain",
  };
  return map[ext] ?? "application/octet-stream";
}
