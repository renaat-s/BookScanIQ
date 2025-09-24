import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, FileText, CheckCircle, BarChart3, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Extraction",
    description: "Advanced OCR and machine learning algorithms extract data from any invoice format with 99% accuracy."
  },
  {
    icon: FileText,
    title: "Smart Document Processing",
    description: "Automatically categorize, validate, and route invoices through your approval workflow."
  },
  {
    icon: CheckCircle,
    title: "Automated Validation",
    description: "Cross-reference PO numbers, vendor details, and line items to catch errors before they cost you."
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track processing times, approval rates, and cost savings with comprehensive dashboards."
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption and SOC 2 compliance ensure your financial data stays protected."
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Process hundreds of invoices in minutes, not hours. Scale effortlessly as your business grows."
  }
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold">
            Powerful Features for{" "}
            <span className="text-gradient">Modern Businesses</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to automate your invoice processing workflow, 
            from extraction to approval, all powered by cutting-edge AI.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-card hover:shadow-elegant transition-smooth bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;