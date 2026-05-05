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
      <main className="bg-gradient-subtle">
        <section className="pt-16 pb-8 md:pt-24 md:pb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-primary opacity-10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-accent opacity-10 rounded-full blur-3xl pointer-events-none" />
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent [text-shadow:_0_4px_12px_rgb(139_92_246_/_0.25)]">
                About Us
              </h1>
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28 relative">
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl shadow-elegant p-8 md:p-12 space-y-10">
                <div className="flex justify-center">
                  <img
                    src={nanocloneLogo}
                    alt="NANOCLONE Systems Logo"
                    className="w-56 md:w-72 h-auto object-contain"
                  />
                </div>
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto" />
                <p className="text-lg md:text-xl text-foreground/90 leading-[1.8] tracking-[-0.005em] font-light first-letter:text-4xl first-letter:font-semibold first-letter:text-brand-primary first-letter:mr-1 first-letter:float-left first-letter:leading-none first-letter:mt-1">
                  At Nanoclone Systems, we are redefining productivity by bridging the gap between cutting-edge Artificial Intelligence and daily operational efficiency. We provide secure, scalable AI Automation SaaS solutions designed to empower enterprises to streamline complex workflows and individuals to reclaim their time from repetitive tasks. By integrating intelligent agentic AI into existing systems, we deliver immediate, tangible ROI—freeing teams to focus on growth and innovation rather than manual data handling. From intelligent chatbots to autonomous workflow orchestration, we turn AI from a futuristic concept into a daily, reliable utility that drives superior performance and strategic agility in 2026.
                </p>
                <img
                  src={nanocloneImage}
                  alt="NANOCLONE Systems"
                  className="w-full h-auto rounded-2xl shadow-elegant"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
