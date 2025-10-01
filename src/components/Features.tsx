import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, ScanText, GitMerge, Mail, FileBarChart } from "lucide-react";

const features = [
  {
    icon: UploadCloud,
    title: "Upload Invoices Instantly",
    description: "Drag and drop or upload invoices in any format - PDF, images, or scanned documents. Get started in seconds."
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
    icon: Mail,
    title: "Smart Payment Reminders",
    description: "Never miss a payment deadline. Automated email reminders keep you and your vendors on track."
  },
  {
    icon: FileBarChart,
    title: "One-Click Reports",
    description: "Generate comprehensive financial reports instantly. Export to Excel, PDF, or your accounting software."
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