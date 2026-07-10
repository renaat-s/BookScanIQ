import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLANS } from "@/lib/stripe-plans";
import { toast } from "sonner";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { user, subscription, signInWithGoogle } = useAuth();

  const handleSubscribe = async (planIndex: number) => {
    if (!user) {
      await signInWithGoogle();
      return;
    }

    // Developer bypass – already fully subscribed
    if (subscription.isDeveloper) {
      toast.info("You have developer access — no subscription needed!");
      return;
    }

    const plan = PLANS[planIndex];
    const priceId = isAnnual ? plan.annualPriceId : plan.monthlyPriceId;
    const planKey = plan.name.toLowerCase();

    setLoadingPlan(planKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: unknown) {
      console.error("Portal error:", err);
      toast.error("Failed to open subscription management.");
    }
  };

  const isCurrentPlan = (planIndex: number) => {
    if (!subscription.subscribed || !subscription.tier) return false;
    return PLANS[planIndex].name.toLowerCase() === subscription.tier;
  };

  return (
    <section id="pricing" className="py-20 bg-transparent relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold neon-cyber-text">
            Simple, <span className="text-gradient">Transparent Pricing</span>
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-[1.8] tracking-[-0.005em] font-light">
            Choose the plan that fits your business. All plans include our core AI features
            with 14-day free trial and no setup fees.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                isAnnual ? "bg-brand-primary" : "bg-muted"
              }`}
              aria-label="Toggle annual billing"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                  isAnnual ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Annual
            </span>
            {isAnnual && (
              <span className="text-xs font-semibold text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-full">
                Save up to 17%
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan, index) => {
            const current = isCurrentPlan(index);
            return (
              <Card
                key={index}
                className={`relative glass-card ${
                  current
                    ? "cyber-border shadow-glow"
                    : plan.popular
                    ? "cyber-border shadow-glow"
                    : "shadow-elegant"
                } hover:shadow-glow transition-smooth`}
              >
                {current && plan.name !== "Enterprise" && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-brand-accent text-white px-4 py-1 rounded-full text-sm font-medium">
                      Your Plan
                    </div>
                  </div>
                )}
                {!current && plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-primary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}

                <CardHeader className="text-center space-y-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">
                        {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        {isAnnual ? "/year" : "/month"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-brand-accent mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {current ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      size="lg"
                      onClick={handleManageSubscription}
                    >
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button
                      variant={plan.popular ? "hero" : "outline"}
                      className="w-full"
                      size="lg"
                      disabled={loadingPlan === plan.name.toLowerCase()}
                      onClick={() => handleSubscribe(index)}
                    >
                      {loadingPlan === plan.name.toLowerCase() ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      {subscription.subscribed ? "Switch Plan" : "Start Free Trial"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center mt-16">
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-elegant px-8 py-4">
            <p className="text-muted-foreground text-center">
              All plans include 14-day free trial • No setup fees • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
