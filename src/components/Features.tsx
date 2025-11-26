import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ScanText, GitMerge, Camera, MessageSquare, Send } from "lucide-react";

const features = [
  {
    icon: Mail,
    title: "Automated Email Collection",
    description: "InvoiceIQ automatically collects receipts from your email inbox, extracts the data, and sends them into the main workflow."
  },
  {
    icon: ScanText,
    title: "Automatic Parsing & Categorization",
    description: "AI automatically extracts and categorizes all invoice data - vendor details, amounts, dates, and line items."
  },
  {
    icon: GitMerge,
    title: "Bank Transaction Matching",
    description: "Seamlessly match invoices with bank transactions to reconcile accounts and track payments effortlessly."
  },
  {
    icon: Camera,
    title: "Photo Upload & Conversion",
    description: "Upload a photo of a receipt through the InvoiceIQ app, which then converts it to structured invoice data."
  },
  {
    icon: MessageSquare,
    title: "Smart Weekly Clarification",
    description: "At the end of the week, InvoiceIQ asks you to clarify expense categories for receipts where the category couldn't be determined, then automatically resolves them."
  },
  {
    icon: Send,
    title: "Xero Integration",
    description: "All verified receipt data is automatically sent to Xero for final verification and seamless accounting integration."
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