import { Card, CardContent } from "@/components/ui/card";
import { Upload, Brain, Bell, Send } from "lucide-react";
import howItWorksImage from "@/assets/how-it-works-illustration.png";

const steps = [
  {
    icon: Upload,
    title: "Upload Invoice",
    description: "Upload invoices directly from Google Drive or Email. Seamlessly integrated with your Google Workspace."
  },
  {
    icon: Brain,
    title: "AI Agent Extracts & Matches",
    description: "Our AI Agent automatically extracts invoice data and matches it with your bank transactions in real-time."
  },
  {
    icon: Bell,
    title: "Payment Tracking & Follow-up",
    description: "Automated payment tracking and smart reminders ensure nothing falls through the cracks."
  },
  {
    icon: Send,
    title: "Export to Xero",
    description: "Verified invoice data is automatically sent to Xero for seamless accounting integration."
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
        
        <div className="mb-16 flex justify-center">
          <img 
            src={howItWorksImage} 
            alt="Invoice processing workflow illustration showing AI-powered invoice extraction and verification"
            className="w-full max-w-2xl h-auto rounded-2xl"
          />
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
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
        
        <div className="mt-16 text-center space-y-4">
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Fully integrated with <span className="font-semibold text-foreground">Google Workspace</span> for seamless document management. 
            Works perfectly with modern fintech banks including <span className="font-semibold text-foreground">Tide</span>, <span className="font-semibold text-foreground">Revolut</span>, and other online banking platforms.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;