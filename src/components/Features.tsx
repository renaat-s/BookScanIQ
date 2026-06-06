import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ScanText, GitMerge, Camera, MessageSquare, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const features = [
  {
    icon: Mail,
    title: "Automated Email Collection",
    description: "InvoiceIQ automatically collects receipts from your email inbox, extracts the data, and sends them into the main workflow.",
    comingSoon: false
  },
  {
    icon: ScanText,
    title: "Automatic Parsing & Categorization",
    description: "AI automatically extracts and categorizes all invoice data - vendor details, amounts, dates, and line items.",
    comingSoon: false
  },
  {
    icon: GitMerge,
    title: "Bank Transaction Matching",
    description: "Seamlessly match invoices with bank transactions to reconcile accounts and track payments effortlessly.",
    comingSoon: false
  },
  {
    icon: Camera,
    title: "Photo Upload & Conversion",
    description: "Upload a photo of a receipt through the InvoiceIQ app, which then converts it to structured invoice data.",
    comingSoon: true
  },
  {
    icon: MessageSquare,
    title: "Smart Weekly Clarification",
    description: "At the end of the week, InvoiceIQ asks you to clarify expense categories for receipts where the category couldn't be determined, then automatically resolves them.",
    comingSoon: true
  },
  {
    icon: Send,
    title: "Xero & QuickBooks Integration",
    description: "All verified receipt data is automatically sent to Xero and QuickBooks for final verification and seamless accounting integration.",
    comingSoon: false
  }
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold neon-cyber-text glitch-text" data-text="Powerful Features for Modern Businesses" data-aos="zoom-in">
            Powerful Features for{" "}
            <span className="text-gradient">Modern Businesses</span>
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-[1.8] tracking-[-0.005em] font-light">
            Everything you need to automate your invoice processing workflow, 
            from extraction to approval, all powered by cutting-edge AI.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
            >
              <Card className={`h-full border-0 shadow-card hover:shadow-elegant transition-smooth glass-card relative ${feature.comingSoon ? 'opacity-50 grayscale' : ''}`}>
                {feature.comingSoon && (
                  <Badge className="absolute top-4 right-4 bg-muted-foreground/80 text-background">Coming Soon</Badge>
                )}
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;