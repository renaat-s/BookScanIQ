/**
 * Canonical document file types InvoiceIQ can process end-to-end.
 * The ledger stores the lowercase key; the UI renders the label.
 */
export type DocFileType = "pdf" | "jpeg" | "png" | "heic" | "html";

const LABELS: Record<DocFileType, string> = {
  pdf: "PDF",
  jpeg: "JPEG/JPG",
  png: "PNG",
  heic: "HEIC/HEIF",
  html: "HTML",
};

/** Normalises any stored/document hint into one of the supported keys. */
export function normalizeFileType(value: unknown): DocFileType | null {
  const s = String(value ?? "").toLowerCase();
  if (!s) return null;
  if (s.includes("pdf")) return "pdf";
  if (s.includes("jpeg") || s.includes("jpg")) return "jpeg";
  if (s.includes("png")) return "png";
  if (s.includes("heic") || s.includes("heif")) return "heic";
  if (s.includes("html") || s.includes("htm")) return "html";
  return null;
}

/** Display label for a ledger entry's document_type, or null when unknown. */
export function fileTypeLabel(value: unknown): string | null {
  const key = normalizeFileType(value);
  return key ? LABELS[key] : null;
}

/** Tailwind classes per file type so the badges stay visually distinct. */
export function fileTypeBadgeClass(value: unknown): string {
  switch (normalizeFileType(value)) {
    case "pdf":
      return "bg-rose-500/10 text-rose-500 border-rose-500/30";
    case "jpeg":
      return "bg-sky-500/10 text-sky-500 border-sky-500/30";
    case "png":
      return "bg-violet-500/10 text-violet-500 border-violet-500/30";
    case "heic":
      return "bg-amber-500/10 text-amber-500 border-amber-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
