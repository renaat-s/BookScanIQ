import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Helmet } from "react-helmet-async";
import faqHeroBg from "@/assets/faq-hero-bg.jpg";

// Move FAQ data outside component to prevent recreation on each render
const faqs = [
  {
    question: "Do I need a technical team to use this?",
    answer: "Not at all! InvoiceIQ is designed for non-technical users. Simply create your account, link your Email and our AI will handle the rest. No coding, no complex setup—just straightforward automation that works out of the box."
  },
  {
    question: "What happens if the InvoiceIQ can't identify my invoice's expenditure type?",
    answer: "If our AI can't identify the expenditure type of your invoice, you'll receive a notification on your dashboard. You can then manually review and categorize the invoice. Our smart algorithms learn from your corrections to improve future matching accuracy."
  },
  {
    question: "How secure is my data?",
    answer: "Your financial data security is our top priority. We use bank-level encryption for all data in transit and at rest. Your invoice data is never sold or shared with third parties. We're GDPR compliant and host all data on secure EU/UK servers."
  },
  {
    question: "Can I integrate InvoiceIQ with my accounting software?",
    answer: "Yes! InvoiceIQ supports exports to popular accounting software platforms including Xero and QuickBooks. Our AI automation exports your matched invoice data to Xero once it has successfully resolved it."
  },
  {
    question: "What file formats can I upload?",
    answer: "InvoiceIQ accepts PDF and scanned documents. Our AI OCR technology can extract data from even poor-quality scans, mobile phone photos and embedded email data."
  },
  {
    question: "How does the AI matching work?",
    answer: "Our AI Agent extracts key information from your invoices (vendor name, amount, date, reference numbers) and intelligently matches them with your bank transactions. It considers multiple factors including amount, date range, vendor variations, and payment references to find the right match."
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
        <title>FAQ - InvoiceIQ Frequently Asked Questions</title>
        <meta name="description" content="Find answers to common questions about InvoiceIQ invoice automation. Learn about supported banks, security, pricing, AI accuracy, and more." />
        <meta name="keywords" content="InvoiceIQ FAQ, invoice automation questions, bank support, security questions, pricing" />
        <link rel="canonical" href="https://invoiceiq.com/faq" />
      </Helmet>
      <Header />
      <main>
        <section 
          className="py-20 md:py-32 relative bg-cover bg-center"
          style={{ backgroundImage: `url(${faqHeroBg})` }}
        >
          <div className="absolute inset-0 bg-primary/40"></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white">Frequently Asked Questions</h1>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-gradient-light-indigo">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="border rounded-lg px-6 bg-card shadow-sm hover:shadow-md transition-smooth"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-6">
                      <span className="font-semibold text-lg">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-6">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="mt-16 text-center space-y-6 p-8 bg-gradient-to-br from-white to-primary/20 rounded-lg">
                <h2 className="text-2xl font-bold">Still have questions?</h2>
                <p className="text-muted-foreground">
                  Can't find the answer you're looking for? Reach out to our support team.
                </p>
                <a 
                  href="mailto:support@invoiceiq.com" 
                  className="inline-block text-primary font-semibold hover:underline"
                >
                  Contact Support →
                </a>
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