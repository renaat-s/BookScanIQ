import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

import nanocloneImage from "@/assets/nanoclone-systems.png";
import nanocloneLogo from "@/assets/nanoclone-logo.png";

const About = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>About InvoiceIQ - Our Story & Mission</title>
        <meta name="description" content="Learn about InvoiceIQ - built by an indie developer to solve real small business invoice management challenges. Discover our mission and values." />
        <meta name="keywords" content="about InvoiceIQ, invoice automation story, small business solutions, indie developer" />
        <link rel="canonical" href="https://invoiceiq.com/about" />
      </Helmet>
      <Header />
      <main>
        <section className="pt-12 pb-6 md:pt-16 md:pb-8 relative overflow-hidden bg-background">
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                About Us
              </h1>
            </div>
          </div>
        </section>

        <section className="pt-4 pb-12 md:pt-6 md:pb-16 bg-background">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-center">
                <img
                  src={nanocloneLogo}
                  alt="NANOCLONE Systems Logo"
                  className="w-64 md:w-80 h-auto rounded-2xl shadow-elegant object-contain bg-white p-4"
                />
              </div>
              <p className="text-base md:text-lg text-foreground leading-relaxed">
                At Nanoclone Systems, we are redefining productivity by bridging the gap between cutting-edge Artificial Intelligence and daily operational efficiency. We provide secure, scalable AI Automation SaaS solutions designed to empower enterprises to streamline complex workflows and individuals to reclaim their time from repetitive tasks. By integrating intelligent agentic AI into existing systems, we deliver immediate, tangible ROI—freeing teams to focus on growth and innovation rather than manual data handling. From intelligent chatbots to autonomous workflow orchestration, we turn AI from a futuristic concept into a daily, reliable utility that drives superior performance and strategic agility in 2026.
              </p>
              <img
                src={nanocloneImage}
                alt="NANOCLONE Systems"
                className="w-full h-auto rounded-3xl shadow-elegant"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
