import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$25",
    period: "/month",
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
    price: "$150",
    period: "/month",
    description: "Ideal for growing businesses with higher invoice volumes",
    features: [
      "Up to 1,000 invoices/month",
      "Advanced AI extraction",
      "Custom validation workflows",
      "Priority support",
      "Premium integrations",
      "Advanced analytics",
      "Multi-user access",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$500",
    period: "/month",
    description: "For large organizations with complex requirements",
    features: [
      "Unlimited invoices",
      "Custom AI models",
      "Dedicated account manager",
      "24/7 phone support",
      "Custom integrations",
      "Enterprise analytics",
      "SSO & advanced security",
      "SLA guarantee",
    ],
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold">
            Simple, <span className="text-gradient">Transparent Pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the plan that fits your business. All plans include our core AI features
            with 14-day free trial and no setup fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${plan.popular ? "border-2 border-brand-primary shadow-glow" : "border border-border"} hover:shadow-elegant transition-smooth`}
            >
              {plan.popular && (
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
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
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

                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full"
                  size="lg"
                >
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            All plans include 14-day free trial • No setup fees • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
