import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingSection from "@/components/Pricing";
import { Helmet } from "react-helmet-async";
import CyberBackground from "@/components/CyberBackground";

const Pricing = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Pricing - InvoiceIQ Plans & Packages</title>
        <meta name="description" content="Choose the InvoiceIQ plan that fits your business. Starter, Professional, and Enterprise packages with AI-powered invoice automation. 14-day free trial." />
        <meta name="keywords" content="InvoiceIQ pricing, invoice automation plans, subscription packages, AI invoice processing" />
        <link rel="canonical" href="https://invoice-iq.com/pricing" />
      </Helmet>
      <Header />
      <main className="relative overflow-hidden">
        <CyberBackground />
        <div className="relative z-10">
          <PricingSection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
