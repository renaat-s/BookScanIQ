// Prefetch route chunks on hover/focus so navigation feels instant.
// Keys must match the dynamic imports declared in App.tsx.
const loaders: Record<string, () => Promise<unknown>> = {
  "/about": () => import("@/pages/About"),
  "/about-invoiceiq": () => import("@/pages/AboutInvoiceIQ"),
  "/faq": () => import("@/pages/FAQ"),
  "/compliance": () => import("@/pages/Compliance"),
  "/privacy": () => import("@/pages/Privacy"),
  "/terms": () => import("@/pages/Terms"),
  "/eula": () => import("@/pages/EULA"),
  "/support": () => import("@/pages/Support"),
  "/capture-invoices": () => import("@/pages/DocumentCapture"),
  "/detect-invoices": () => import("@/pages/DetectInvoices"),
  "/file-invoices": () => import("@/pages/FileInvoices"),
  "/pricing": () => import("@/pages/Pricing"),
  "/settings": () => import("@/pages/Settings"),
  "/dashboard": () => import("@/pages/Dashboard"),
};

const prefetched = new Set<string>();

export const prefetchRoute = (path: string) => {
  const loader = loaders[path];
  if (!loader || prefetched.has(path)) return;
  prefetched.add(path);
  // Fire-and-forget; failures are harmless.
  loader().catch(() => prefetched.delete(path));
};

// Convenience handlers to spread on Links/buttons.
export const prefetchHandlers = (path: string) => ({
  onMouseEnter: () => prefetchRoute(path),
  onFocus: () => prefetchRoute(path),
  onTouchStart: () => prefetchRoute(path),
});
