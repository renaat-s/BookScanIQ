import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingSection from "@/components/Pricing";
import { Helmet } from "react-helmet-async";

const Pricing = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Pricing - InvoiceIQ Plans & Packages</title>
        <meta name="description" content="Choose the InvoiceIQ plan that fits your business. Starter, Professional, and Enterprise packages with AI-powered invoice automation. 14-day free trial." />
        <meta name="keywords" content="InvoiceIQ pricing, invoice automation plans, subscription packages, AI invoice processing" />
        <link rel="canonical" href="https://invoiceiq.com/pricing" />
      </Helmet>
      <Header />
      <main>
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
