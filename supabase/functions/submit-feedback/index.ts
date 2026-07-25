// Inserts feedback row and forwards a copy to the founder inbox via Resend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@18.5.0";

import { corsHeadersFor } from "../_shared/cors.ts";

const DEFAULT_RECIPIENT = "info@invoice-iq.com";
const PRIORITY_RECIPIENT = "priority@invoice-iq.com";
const FROM = "InvoiceIQ Feedback <feedback@invoice-iq.com>";

const DEVELOPER_EMAILS = [
  "renaat.sibanda@gmail.com",
  "renaat.sibanda23@gmail.com",
  "ruvimbo.gamanya@gmail.com",
];

const ENTERPRISE_PRODUCTS = ["prod_UFAkdM7qvMUtYv", "prod_UFAlscQkwRaD2i"];
const STARTER_PRODUCTS = ["prod_UFAjHWpuf52UEL", "prod_UFAjlJBuzAPjC4"];
const SOLO_PRODUCTS = ["prod_Ux0JqEpkSviKSJ"];
const PRO_PRODUCTS = ["prod_UFAjc3ylFV6hsW", "prod_UFAkBm2eLGQWhR"];

async function resolveTier(email: string | null | undefined): Promise<string> {
  if (!email) return "free";
  if (DEVELOPER_EMAILS.includes(email.toLowerCase())) return "enterprise";
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return "free";
  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) return "free";
    const subs = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "active",
      limit: 1,
    });
    if (!subs.data.length) return "free";
    const productId = subs.data[0].items.data[0].price.product as string;
    if (ENTERPRISE_PRODUCTS.includes(productId)) return "enterprise";
    if (PRO_PRODUCTS.includes(productId)) return "professional";
    if (SOLO_PRODUCTS.includes(productId)) return "solo";
    if (STARTER_PRODUCTS.includes(productId)) return "starter";
    return "free";
  } catch (e) {
    console.error("tier lookup failed", e);
    return "free";
  }
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), {
      status: s,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

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

    const tier = await resolveTier(user.email);
    const isPriority = tier === "enterprise";
    const recipient = isPriority ? PRIORITY_RECIPIENT : DEFAULT_RECIPIENT;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      try {
        const sentimentLabel = sentiment ? sentiment.toUpperCase() : "—";
        const tierLabel = tier.toUpperCase();
        const subjectPrefix = isPriority ? "[PRIORITY] " : "";
        const html = `
          <h2>${isPriority ? "🚨 PRIORITY " : ""}New InvoiceIQ feedback</h2>
          <p><strong>From:</strong> ${user.email ?? user.id}</p>
          <p><strong>Plan:</strong> ${tierLabel}</p>
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
            to: [recipient],
            reply_to: user.email ?? undefined,
            subject: `${subjectPrefix}[Feedback ${sentimentLabel}] ${message.slice(0, 60)}`,
            html,
          }),
        });
      } catch (e) {
        console.error("resend forward failed (non-fatal)", e);
      }
    }

    return json({ ok: true, priority: isPriority });
  } catch (e) {
    console.error("submit-feedback error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
    });
  }
});
