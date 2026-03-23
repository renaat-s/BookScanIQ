import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star } from "lucide-react";

const plan = {
  name: "Professional",
  price: "$149",
  period: "/month",
  description: "Ideal for growing businesses with higher invoice volumes",
  features: [
    "Up to 1,000 invoices/month",
    "Advanced AI extraction",
    "Custom validation workflows",
    "Priority support",
    "Premium integrations",
    "Advanced analytics",
    "Multi-user access"
  ],
};

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
        
        <div className="max-w-lg mx-auto">
          <Card className="relative border-2 border-brand-primary shadow-glow hover:shadow-elegant transition-smooth">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-primary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                <Star className="w-4 h-4 mr-1" />
                Most Popular
              </div>
            </div>
            
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
              
              <Button variant="hero" className="w-full" size="lg">
                Start Free Trial
              </Button>
            </CardContent>
          </Card>
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
