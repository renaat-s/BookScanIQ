import { Card, CardContent } from "@/components/ui/card";
import { Upload, Brain, CheckCircle, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload & Scan",
    description: "Simply upload invoices via email, API, or drag & drop. Our AI instantly scans and identifies document types."
  },
  {
    icon: Brain,
    title: "AI Extraction",
    description: "Advanced machine learning extracts all relevant data: vendor info, amounts, line items, and due dates."
  },
  {
    icon: CheckCircle,
    title: "Smart Validation",
    description: "Cross-reference with your systems to validate PO numbers, budgets, and approval workflows automatically."
  },
  {
    icon: TrendingUp,
    title: "Seamless Integration",
    description: "Approved invoices flow directly into your ERP, accounting software, or payment systems for processing."
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold">
            How <span className="text-gradient">InvoiceIQ</span> Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From upload to payment in four simple steps. Our AI handles the complexity 
            while you focus on growing your business.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="h-full border-0 shadow-card bg-background/80 backdrop-blur-sm hover:shadow-elegant transition-smooth">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
              
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-primary opacity-30"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;