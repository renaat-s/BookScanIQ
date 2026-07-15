/**
 * Stripe product & price IDs for each InvoiceIQ plan.
 * Keep this single source-of-truth for all checkout + subscription logic.
 */

export type PlanTier = "starter" | "professional" | "enterprise";

export interface PlanConfig {
  name: string;
  monthlyPriceId: string;
  annualPriceId: string;
  monthlyProductId: string;
  annualProductId: string;
  monthlyPrice: string;
  annualPrice: string;
  description: string;
  features: string[];
  popular: boolean;
  /** Maximum scans per calendar month. `null` = unlimited. */
  maxScans: number | null;
  /** Whether Xero + QuickBooks integrations are unlocked on this tier. */
  hasAccountingIntegrations: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    name: "Starter",
    monthlyPriceId: "price_1TGgNeARQphcY8qGeaSa0BSw",
    annualPriceId: "price_1TGgO2ARQphcY8qGpDr2AfPD",
    monthlyProductId: "prod_UFAjHWpuf52UEL",
    annualProductId: "prod_UFAjlJBuzAPjC4",
    monthlyPrice: "$25",
    annualPrice: "$300",
    description: "Perfect for small businesses just getting started",
    maxScans: 100,
    hasAccountingIntegrations: false,
    features: [
      "Up to 100 scans/month",
      "Basic AI extraction",
      "Email support",
      "Google Drive + Sheets sync",
      "Basic analytics",
    ],
    popular: false,
  },
  {
    name: "Professional",
    monthlyPriceId: "price_1TGgOQARQphcY8qGrQg9j5kh",
    annualPriceId: "price_1TGgOhARQphcY8qGXBfBbxeq",
    monthlyProductId: "prod_UFAjc3ylFV6hsW",
    annualProductId: "prod_UFAkBm2eLGQWhR",
    monthlyPrice: "$150",
    annualPrice: "$1,750",
    description: "Ideal for growing businesses with higher scan volumes",
    maxScans: 500,
    hasAccountingIntegrations: true,
    features: [
      "Up to 500 scans/month",
      "Advanced AI extraction",
      "Priority support",
      "Xero + QuickBooks integrations",
      "Advanced analytics",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    monthlyPriceId: "price_1TGgPCARQphcY8qGIIaJnZRJ",
    annualPriceId: "price_1TGgPVARQphcY8qGGjJpleZF",
    monthlyProductId: "prod_UFAkdM7qvMUtYv",
    annualProductId: "prod_UFAlscQkwRaD2i",
    monthlyPrice: "$500",
    annualPrice: "$6,000",
    description: "For large organizations with complex requirements",
    maxScans: null,
    hasAccountingIntegrations: true,
    features: [
      "Unlimited scans",
      "Xero + QuickBooks integrations",
      "Enterprise analytics",
      "SSO & advanced security",
      "SLA guarantee",
    ],
    popular: false,
  },
];

/** Find which tier a product ID belongs to. */
export const getTierByProductId = (productId: string | null): PlanTier | null => {
  if (!productId) return null;
  if (productId === "developer_bypass") return "enterprise";
  for (const plan of PLANS) {
    if (plan.monthlyProductId === productId || plan.annualProductId === productId) {
      return plan.name.toLowerCase() as PlanTier;
    }
  }
  return null;
};

/** Look up a plan config by tier string. */
export const getPlanByTier = (tier: string | null | undefined): PlanConfig | null => {
  if (!tier) return null;
  return PLANS.find((p) => p.name.toLowerCase() === tier.toLowerCase()) ?? null;
};

/** Monthly scan cap for a tier. `null` = unlimited. Unpaid = 0. */
export const getScanCap = (tier: string | null | undefined): number | null => {
  const plan = getPlanByTier(tier);
  if (!plan) return 0;
  return plan.maxScans;
};

/** Whether the given tier can connect Xero + QuickBooks. */
export const canUseAccountingIntegrations = (tier: string | null | undefined): boolean => {
  return getPlanByTier(tier)?.hasAccountingIntegrations ?? false;
};
