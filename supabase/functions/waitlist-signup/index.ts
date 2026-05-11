import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// NOTE: Switch to "InvoiceIQ <info@invoice-iq.com>" once invoice-iq.com is verified in Resend.
const FROM_ADDRESS = "InvoiceIQ <info@invoice-iq.com>";
const SITE_URL = "https://invoice-iq.com";

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function buildWelcomeHtml(name: string | null): string {
  const greetingName = name && name.trim() ? name.trim() : "there";
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(15,23,42,0.06);overflow:hidden;">
          <tr><td style="padding:32px 32px 8px;text-align:center;">
            <div style="font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#4f46e5;">InvoiceIQ</div>
          </td></tr>
          <tr><td style="padding:8px 32px 0;text-align:center;">
            <h1 style="font-size:28px;line-height:1.2;margin:16px 0 8px;color:#0f172a;">You're on the list! 🎉</h1>
          </td></tr>
          <tr><td style="padding:8px 32px 24px;font-size:16px;line-height:1.6;color:#334155;">
            <p style="margin:0 0 16px;">Thanks for joining the InvoiceIQ waitlist, ${greetingName}!</p>
            <p style="margin:0 0 16px;">We're building the future of automated bookkeeping — powered by AI, Google Drive, Xero, and QuickBooks. We'll notify you the moment we go live.</p>
          </td></tr>
          <tr><td align="center" style="padding:8px 32px 32px;">
            <a href="${SITE_URL}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:10px;font-size:15px;">Visit InvoiceIQ</a>
          </td></tr>
          <tr><td style="padding:24px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#64748b;">
            © 2026 InvoiceIQ. You received this because you signed up for our waitlist.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  let payload: { name?: string; email?: string; referral_source?: string };
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const email = (payload.email ?? "").trim().toLowerCase();
  const name = payload.name?.trim() || null;
  const referral = payload.referral_source?.trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    return json(400, { error: "invalid_email" });
  }
  if (name && name.length > 100) return json(400, { error: "invalid_name" });
  if (referral && referral.length > 50) return json(400, { error: "invalid_referral" });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ---- Step A: Rate limiting (5 per IP per 60 min) ----
  const ip = getClientIp(req);
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count: recentCount, error: rlError } = await supabase
    .from("waitlist_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("submitted_at", since);

  if (rlError) {
    console.error("Rate limit check failed:", rlError);
    // Fail open on internal errors so legit users aren't blocked.
  } else if ((recentCount ?? 0) >= 5) {
    return json(429, {
      error: "rate_limited",
      message: "Too many attempts. Please try again in a few minutes.",
    });
  }

  await supabase.from("waitlist_rate_limits").insert({ ip_address: ip });

  // ---- Step B: Insert into waitlist (duplicate-safe) ----
  const { error: insertError } = await supabase
    .from("waitlist")
    .insert({ email, name, referral_source: referral });

  if (insertError) {
    if ((insertError as { code?: string }).code === "23505") {
      return json(200, {
        success: true,
        message: "You're already on the list! We'll be in touch soon.",
        duplicate: true,
      });
    }
    console.error("Waitlist insert error:", insertError);
    return json(500, { error: "insert_failed", message: "Something went wrong. Please try again." });
  }

  // ---- Step C: Send welcome email via Resend ----
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [email],
          subject: "Welcome to InvoiceIQ 🎉",
          html: buildWelcomeHtml(name),
        }),
      });
      if (!res.ok) {
        console.error("Resend send failed:", res.status, await res.text());
      }
    } catch (err) {
      console.error("Resend send threw:", err);
    }
  } else {
    console.warn("RESEND_API_KEY not configured — skipping welcome email.");
  }

  return json(200, {
    success: true,
    message: "You're in! Check your inbox for a welcome email.",
    duplicate: false,
  });
});
