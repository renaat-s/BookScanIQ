import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { toast } from "sonner";
import { MessageSquare, Mail, HelpCircle, Bug, LifeBuoy } from "lucide-react";

const supportTopics = [
  { value: "general", label: "General Inquiry", icon: HelpCircle },
  { value: "technical", label: "Technical Support", icon: Bug },
  { value: "billing", label: "Billing & Subscription", icon: MessageSquare },
  { value: "integration", label: "Integration Help (Xero/QuickBooks)", icon: MessageSquare },
  { value: "feature", label: "Feature Request", icon: MessageSquare },
];

const Support = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    topic: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.topic || !formData.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success("Your message has been sent! We'll get back to you within 24 hours.");
    setFormData({ name: "", email: "", topic: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Support & Contact - InvoiceIQ</title>
        <meta name="description" content="Get help with InvoiceIQ. Contact our support team for technical assistance, billing questions, or integration support." />
        <meta name="keywords" content="InvoiceIQ support, contact, help, technical support, customer service" />
        <link rel="canonical" href="https://invoice-iq.com/support" />
      </Helmet>
      <Header />
      <main className="bg-gradient-subtle">
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
              {/* Header */}
              <div className="text-center space-y-5 mb-16">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-elegant flex items-center justify-center">
                  <LifeBuoy className="w-9 h-9 text-violet-500" />
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-foreground leading-tight py-1">
                  How Can We Help?
                </h1>
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto" />
                <p className="text-lg text-muted-foreground font-light tracking-[-0.005em] max-w-xl mx-auto leading-relaxed">
                  Our support team is here to assist you. Fill out the form below and we'll get back to you within 24 hours.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Quick Contact Options */}
                <div className="md:col-span-1 space-y-6">
                  <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl shadow-elegant hover:shadow-lg hover:border-violet-500/30 transition-all duration-300 p-6">
                    <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                      <Mail className="w-5 h-5 text-violet-500" />
                    </div>
                    <h3 className="font-light text-lg tracking-tight mb-2">Email Us</h3>
                    <p className="text-sm text-muted-foreground font-light mb-3">
                      For general inquiries and support
                    </p>
                    <a
                      href="mailto:info@invoice-iq.com"
                      className="text-violet-500 hover:text-violet-400 transition-colors font-light text-sm"
                    >
                      info@invoice-iq.com
                    </a>
                  </div>

                  <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl shadow-elegant hover:shadow-lg hover:border-violet-500/30 transition-all duration-300 p-6">
                    <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                      <HelpCircle className="w-5 h-5 text-violet-500" />
                    </div>
                    <h3 className="font-light text-lg tracking-tight mb-2">FAQ</h3>
                    <p className="text-sm text-muted-foreground font-light mb-3">
                      Find answers to common questions
                    </p>
                    <a
                      href="/faq"
                      className="text-violet-500 hover:text-violet-400 transition-colors font-light text-sm"
                    >
                      Visit FAQ →
                    </a>
                  </div>

                  <div className="bg-gradient-to-br from-violet-500/10 via-card/60 to-fuchsia-500/10 backdrop-blur-sm border border-violet-500/20 rounded-3xl shadow-elegant p-6">
                    <h3 className="font-light text-lg tracking-tight mb-2">Priority Support</h3>
                    <p className="text-sm text-muted-foreground font-light mb-3">
                      Enterprise customers receive priority response within 4 hours.
                    </p>
                    <p className="text-sm font-light text-violet-500">
                      Included in Enterprise plan
                    </p>
                  </div>
                </div>

                {/* Contact Form */}
                <div className="md:col-span-2">
                  <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl shadow-elegant p-8 md:p-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="font-light">Full Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="font-light">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john@example.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="topic" className="font-light">Topic *</Label>
                        <Select
                          value={formData.topic}
                          onValueChange={(value) => setFormData({ ...formData, topic: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                          <SelectContent>
                            {supportTopics.map((topic) => (
                              <SelectItem key={topic.value} value={topic.value}>
                                <div className="flex items-center gap-2">
                                  <topic.icon className="w-4 h-4" />
                                  {topic.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="font-light">Subject</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="Brief description of your inquiry"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="font-light">Message *</Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Please describe your issue or question in detail..."
                          rows={6}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full font-light"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center font-light">
                        By submitting this form, you agree to our{" "}
                        <a href="/privacy" className="underline hover:text-violet-500">Privacy Policy</a>
                        {" "}and{" "}
                        <a href="/terms" className="underline hover:text-violet-500">Terms of Service</a>.
                      </p>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Support;
