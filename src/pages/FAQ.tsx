import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Helmet } from "react-helmet-async";
import CyberBackground from "@/components/CyberBackground";

// Move FAQ data outside component to prevent recreation on each render
const faqs = [
  {
    question: "Do I need a technical team to use this?",
    answer: "Not at all! BookScanIQ is designed for non-technical users. Simply create your account, link your Email and our AI will handle the rest. No coding, no complex setup, just straightforward automation that works out of the box."
  },
  {
    question: "What happens if the BookScanIQ can't identify my invoice's expenditure type?",
    answer: "If our AI can't identify the expenditure type of your invoice, you'll receive a notification on your dashboard. You can then manually review and categorize the invoice. Our smart algorithms learn from your corrections to improve future categorization accuracy."
  },
  {
    question: "How secure is my data?",
    answer: "Your financial data security is our top priority. We use bank-level encryption for all data in transit and at rest. Your invoice data is never sold or shared with third parties. We're GDPR compliant and host all data on secure EU/UK servers."
  },
  {
    question: "Can I integrate BookScanIQ with my accounting software?",
    answer: "Yes! BookScanIQ supports exports to popular accounting software platforms including Xero and QuickBooks. Our AI automation exports your resolved invoice data to Xero once it has successfully processed and verified it."
  },
  {
    question: "What file formats can I upload?",
    answer: "BookScanIQ accepts PDF and scanned documents. Our AI OCR technology can extract data from even poor-quality scans, mobile phone photos and embedded email data."
  },
  {
    question: "How does the AI extraction work?",
    answer: "Our AI Agent extracts key information from your invoices (vendor name, amount, date, reference numbers) and structures it automatically. It considers multiple factors including vendor variations and line items to produce clean, categorized data ready for export to your accounting software."
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "You can export all your data at any time before canceling. After cancellation, your data is retained for 30 days (in case you change your mind), then permanently deleted from our servers. You maintain full ownership of your data throughout."
  }
];

const FAQ = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>FAQ - BookScanIQ Frequently Asked Questions</title>
        <meta name="description" content="Find answers to common questions about BookScanIQ invoice automation. Learn about integrations, security, pricing, AI accuracy, and more." />
        <meta name="keywords" content="BookScanIQ FAQ, invoice automation questions, integrations, security questions, pricing" />
        <link rel="canonical" href="https://invoiceiq.com/faq" />
      </Helmet>
      <Header />
      <main className="bg-background relative overflow-hidden">
        <CyberBackground />
        <section className="pt-16 pb-8 md:pt-24 md:pb-12 relative">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent neon-cyber-text glitch-text"
                data-text="Frequently Asked Questions"
              >
                Frequently Asked Questions
              </h1>
              <p className="mt-6 text-lg text-muted-foreground font-light tracking-[-0.005em]">
                Everything you need to know about BookScanIQ, answered with clarity.
              </p>
            </div>
          </div>
        </section>

        <section className="pt-8 pb-20 md:pt-12 md:pb-28 relative">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="glass-card cyber-border rounded-3xl shadow-elegant p-6 md:p-10">
                <Accordion type="single" collapsible className="space-y-3">
                  {faqs.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="border border-border/60 rounded-xl px-6 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-violet-500/30 transition-all duration-300"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-6 [&[data-state=open]]:text-violet-600">
                        <span className="font-semibold text-base md:text-lg tracking-[-0.01em]">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-6 text-base leading-[1.8] font-light tracking-[-0.005em]">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="mt-12 text-center space-y-5 p-10 rounded-3xl border border-border/50 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 backdrop-blur-sm shadow-elegant">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Still have questions?</h2>
                <p className="text-muted-foreground font-light">
                  Can't find the answer you're looking for? Reach out to our support team.
                </p>
                <Link
                  to="/support"
                  className="inline-block font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                >
                  Contact Support →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
