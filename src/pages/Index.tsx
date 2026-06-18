import Header from "@/components/Header";
import Hero from "@/components/Hero";

import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const Index = () => {
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "InvoiceIQ",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "InvoiceIQ — Automate your bookkeeping. AI-powered invoice processing with Google Drive, Xero, and QuickBooks integration.",
    url: "https://invoice-iq.com/",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>InvoiceIQ - Automated Bookkeeping & AI Invoice Processing</title>
        <meta
          name="description"
          content="InvoiceIQ — Automate your bookkeeping. AI-powered invoice processing with Google Drive, Xero, and QuickBooks integration."
        />
        <meta
          name="keywords"
          content="automated bookkeeping, invoice automation, AI invoice processing, bank transaction matching, Google Workspace, Xero, QuickBooks"
        />
        <link rel="canonical" href="https://invoice-iq.com/" />
        <script type="application/ld+json">
          {JSON.stringify(softwareJsonLd)}
        </script>
      </Helmet>
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
