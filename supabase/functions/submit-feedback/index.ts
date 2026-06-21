// Inserts feedback row and forwards a copy to the founder inbox via Resend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const RECIPIENT = "renaat.sibanda@gmail.com";
const FROM = "InvoiceIQ Feedback <feedback@invoice-iq.com>";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return json({ error: "Not authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const message = String(body.message ?? "").trim();
    if (!message || message.length < 2) return json({ error: "Message required" }, 400);
    if (message.length > 4000) return json({ error: "Message too long" }, 400);
    const sentiment = ["happy", "neutral", "worried"].includes(body.sentiment) ? body.sentiment : null;
    const prompt = body.prompt ? String(body.prompt).slice(0, 200) : null;
    const route = body.route ? String(body.route).slice(0, 200) : null;
    const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

    const admin = createClient(supabaseUrl, serviceKey);
    const { error: insertErr } = await admin.from("feedback").insert({
      user_id: user.id,
      email: user.email ?? null,
      prompt, message, sentiment, route, user_agent: userAgent,
    });
    if (insertErr) {
      console.error("feedback insert error", insertErr);
      return json({ error: "Failed to save feedback" }, 500);
    }

    // Best-effort email forward — never fail the request if Resend hiccups
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      try {
        const sentimentLabel = sentiment ? sentiment.toUpperCase() : "—";
        const html = `
          <h2>New InvoiceIQ feedback</h2>
          <p><strong>From:</strong> ${user.email ?? user.id}</p>
          <p><strong>Sentiment:</strong> ${sentimentLabel}</p>
          <p><strong>Route:</strong> ${route ?? "—"}</p>
          <p><strong>Prompt:</strong> ${prompt ?? "—"}</p>
          <hr/>
          <pre style="white-space:pre-wrap;font-family:inherit">${message.replace(/[<>]/g, "")}</pre>
        `;
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: FROM,
            to: [RECIPIENT],
            reply_to: user.email ?? undefined,
            subject: `[Feedback ${sentimentLabel}] ${message.slice(0, 60)}`,
            html,
          }),
        });
      } catch (e) {
        console.error("resend forward failed (non-fatal)", e);
      }
    }

    return json({ ok: true });
  } catch (e) {
    console.error("submit-feedback error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
