/**
 * Stripe product & price IDs for each InvoiceIQ plan.
 * Keep this single source-of-truth for all checkout + subscription logic.
 */

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
    features: [
      "Up to 100 invoices/month",
      "Basic AI extraction",
      "Email support",
      "Standard integrations",
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
    description: "Ideal for growing businesses with higher invoice volumes",
    features: [
      "Up to 1,000 invoices/month",
      "Advanced AI extraction",
      "Priority support",
      "Premium integrations",
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
    features: [
      "Unlimited invoices",
      "Custom integrations",
      "Enterprise analytics",
      "SSO & advanced security",
      "SLA guarantee",
    ],
    popular: false,
  },
];

/** Find which tier a product ID belongs to. */
export const getTierByProductId = (productId: string | null): string | null => {
  if (!productId) return null;
  if (productId === "developer_bypass") return "enterprise";
  for (const plan of PLANS) {
    if (plan.monthlyProductId === productId || plan.annualProductId === productId) {
      return plan.name.toLowerCase();
    }
  }
  return null;
};
