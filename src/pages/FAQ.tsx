import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Helmet } from "react-helmet-async";

const faqs = [
  {
    question: "Do I need a technical team to use this?",
    answer: "Not at all! InvoiceIQ is designed for non-technical users. Simply upload your invoices via email or Google Drive, and our AI handles the rest. No coding, no complex setup—just straightforward automation that works out of the box."
  },
  {
    question: "What banks do you support?",
    answer: "InvoiceIQ works seamlessly with modern fintech banks including Tide, Revolut, Starling Bank, and traditional banks. We support standard bank statement formats and can match transactions from any bank that provides CSV or PDF statements."
  },
  {
    question: "What happens if an invoice doesn't match?",
    answer: "If our AI can't find a matching bank transaction, you'll receive a notification in your dashboard. You can then manually review and match the invoice, or mark it as pending. Our smart algorithms learn from your corrections to improve future matching accuracy."
  },
  {
    question: "How secure is my data?",
    answer: "Your financial data security is our top priority. We use bank-level encryption for all data in transit and at rest. Your invoice data is never sold or shared with third parties. We're GDPR compliant and host all data on secure EU/UK servers."
  },
  {
    question: "Can I integrate InvoiceIQ with my accounting software?",
    answer: "Yes! InvoiceIQ supports exports to popular accounting software formats including Xero, QuickBooks, and FreeAgent. You can export your matched invoices and transactions with one click, ready to import into your accounting system."
  },
  {
    question: "What file formats can I upload?",
    answer: "InvoiceIQ accepts PDF, JPG, PNG, and scanned documents. Our AI OCR technology can extract data from even poor-quality scans, handwritten invoices, and mobile phone photos."
  },
  {
    question: "How does the AI matching work?",
    answer: "Our AI Agent extracts key information from your invoices (vendor name, amount, date, reference numbers) and intelligently matches them with your bank transactions. It considers multiple factors including amount, date range, vendor variations, and payment references to find the right match."
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "You can export all your data at any time before canceling. After cancellation, your data is retained for 30 days (in case you change your mind), then permanently deleted from our servers. You maintain full ownership of your data throughout."
  },
  {
    question: "Do you offer a free trial?",
    answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start. You can process up to 50 invoices during your trial period."
  },
  {
    question: "Can I automate payment reminders?",
    answer: "Absolutely! InvoiceIQ automatically sends email reminders to vendors for upcoming and overdue invoices. You can customize reminder schedules and email templates to match your business style."
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
        <section className="py-20 md:py-32 bg-gradient-subtle">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold">Frequently Asked Questions</h1>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about InvoiceIQ
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-dark-indigo">
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

              <div className="mt-16 text-center space-y-6 p-8 bg-primary/5 rounded-lg">
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