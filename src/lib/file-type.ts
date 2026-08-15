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
      return "bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-transparent";
    case "jpeg":
      return "bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-transparent";
    case "png":
      return "bg-sky-400 text-sky-950 border-transparent";
    case "heic":
      return "bg-sky-400 text-sky-950 border-transparent";
    case "html":
      return "bg-sky-400 text-sky-950 border-transparent";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
