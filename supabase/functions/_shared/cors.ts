// Shared strict CORS helper for BookScanIQ edge functions.
// Reflects the request origin only when it appears in the allowlist.
// Falls back to the canonical production origin so misconfigured clients
// receive a deterministic (and safe) response.

const ALLOWED_ORIGINS = new Set<string>([
  "https://invoice-iq.com",
  "https://www.invoice-iq.com",
  "https://invoice-iq-ai.lovable.app",
  "https://id-preview--1c4d0974-fa17-4e5e-b337-5e7a8473b860.lovable.app",
  "http://localhost:8080",
  "http://localhost:3000",
]);

// Regex for Lovable preview subdomains (sandbox/preview builds).
const LOVABLE_PREVIEW = /^https:\/\/[a-z0-9-]+\.lovable\.(app|dev)$/i;

const BASE_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed =
    ALLOWED_ORIGINS.has(origin) || LOVABLE_PREVIEW.test(origin)
      ? origin
      : "https://invoice-iq.com";
  return { ...BASE_HEADERS, "Access-Control-Allow-Origin": allowed };
}

export function handlePreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeadersFor(req) });
  }
  return null;
}
