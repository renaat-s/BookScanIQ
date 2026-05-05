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
        <section className="py-20 md:py-32 relative overflow-hidden bg-background">
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">About Us</h1>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex justify-center">
                <img
                  src={nanocloneLogo}
                  alt="NANOCLONE Systems Logo"
                  className="w-64 md:w-96 h-auto rounded-2xl shadow-elegant object-contain bg-white p-4"
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
