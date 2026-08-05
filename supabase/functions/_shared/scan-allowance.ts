import Stripe from "https://esm.sh/stripe@18.5.0";

/**
 * Monthly scan allowance helper (Feature A guardrail).
 *
 * One "scan" = one processed document (an `invoices` row created this calendar
 * month, whether it came from an inbox scan or a manual upload). Recurring
 * auto-scans deduct from the same pool, so a schedule can never quietly run a
 * user past the cap on their plan.
 */

const DEVELOPER_EMAILS = [
  "renaat.sibanda@gmail.com",
  "renaat.sibanda23@gmail.com",
  "ruvimbo.gamanya@gmail.com",
  "tormundsand.744196@gmail.com",
  "cindy.mokko420123@gmail.com",
];

const TIER_CAPS: Record<string, number | null> = {
  starter: 100,
  solo: 250,
  professional: 500,
  enterprise: null,
};

const PRODUCT_TIERS: Record<string, string> = {
  prod_UFAjHWpuf52UEL: "starter",
  prod_UFAjlJBuzAPjC4: "starter",
  prod_Ux0JqEpkSviKSJ: "solo",
  prod_UFAjc3ylFV6hsW: "professional",
  prod_UFAkBm2eLGQWhR: "professional",
  prod_UFAkdM7qvMUtYv: "enterprise",
  prod_UFAlscQkwRaD2i: "enterprise",
};

export interface ScanAllowance {
  tier: string | null;
  /** null = unlimited */
  cap: number | null;
  used: number;
  /** null = unlimited */
  remaining: number | null;
  atCap: boolean;
  /** Exactly one document left before the cap is hit. */
  lastOne: boolean;
}

const monthStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
};

/** Resolve the paid tier for an email via Stripe (developers = enterprise). */
export async function resolveTier(email: string | null | undefined): Promise<string | null> {
  if (!email) return null;
  if (DEVELOPER_EMAILS.includes(email.toLowerCase())) return "enterprise";

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return null;

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) return null;

    const subs = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "active",
      limit: 1,
    });
    if (subs.data.length === 0) return null;

    const productId = subs.data[0].items.data[0].price.product as string;
    return PRODUCT_TIERS[productId] ?? null;
  } catch (err) {
    console.error("resolveTier failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Documents already processed for this user in the current calendar month. */
export async function getUsedThisMonth(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStart());
  return count ?? 0;
}

/** Full allowance snapshot for a user. */
export async function getScanAllowance(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  email: string | null | undefined,
): Promise<ScanAllowance> {
  const tier = await resolveTier(email);
  const cap = tier ? TIER_CAPS[tier] ?? 0 : 0;
  const used = await getUsedThisMonth(supabase, userId);

  if (cap === null) {
    return { tier, cap: null, used, remaining: null, atCap: false, lastOne: false };
  }

  const remaining = Math.max(0, cap - used);
  return {
    tier,
    cap,
    used,
    remaining,
    atCap: remaining <= 0,
    lastOne: remaining === 1,
  };
}
