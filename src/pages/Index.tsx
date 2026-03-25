import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>InvoiceIQ - AI-Powered Invoice Processing & Automation</title>
        <meta name="description" content="Automate invoice processing with AI. Upload, parse, match bank transactions, and track payments effortlessly. Integrated with Google Workspace, Tide, and Revolut." />
        <meta name="keywords" content="invoice automation, AI invoice processing, bank transaction matching, payment reminders, Google Workspace integration" />
        <link rel="canonical" href="https://invoice-iq.com/" />
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
