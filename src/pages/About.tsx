import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import CyberBackground from "@/components/CyberBackground";
import TiltCard from "@/components/TiltCard";

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
      <main className="bg-gradient-subtle relative overflow-hidden">
        <CyberBackground />
        <section className="pt-16 pb-16 md:pt-24 md:pb-24 relative">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent neon-cyber-text glitch-text"
                data-text="About Us"
              >
                About Us
              </h1>
            </div>
          </div>
        </section>

        <section className="pt-12 pb-20 md:pt-20 md:pb-28 relative">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="max-w-4xl mx-auto">
              <TiltCard className="rounded-3xl">
                <div className="glass-card cyber-border rounded-3xl shadow-elegant p-8 md:p-12 space-y-10">
                  <div className="flex justify-center">
                    <img
                      src={nanocloneLogo}
                      alt="NANOCLONE Systems Logo"
                      className="w-56 md:w-72 h-auto object-contain [filter:drop-shadow(0_0_18px_hsl(174_72%_56%/0.55))_drop-shadow(0_0_38px_hsl(174_72%_56%/0.35))]"
                    />
                  </div>
                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto" />
                  <p className="text-lg md:text-xl text-foreground/90 leading-[1.8] tracking-[-0.005em] font-light">
                    At Nanoclone Systems, we are redefining productivity by bridging the gap between cutting-edge Artificial Intelligence and daily operational efficiency. We provide secure, scalable AI Automation SaaS solutions designed to empower enterprises to streamline complex workflows and individuals to reclaim their time from repetitive tasks. By integrating intelligent agentic AI into existing systems, we deliver immediate, tangible ROI, freeing teams to focus on growth and innovation rather than manual data handling. From intelligent chatbots to autonomous workflow orchestration, we turn AI from a futuristic concept into a daily, reliable utility that drives superior performance and strategic agility in 2026.
                  </p>
                  <a
                    href="https://nanoclone.systems"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visit NANOCLONE Systems Website"
                    className="group relative block overflow-hidden rounded-2xl shadow-elegant"
                  >
                    <img
                      src={nanocloneImage}
                      alt="NANOCLONE Systems"
                      className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="px-6 py-3 rounded-full bg-card/80 backdrop-blur-md border border-border/50 shadow-elegant text-base md:text-lg font-light tracking-[-0.005em] text-foreground">
                        Click Here to Visit Our Website
                      </span>
                    </div>
                  </a>
                </div>
              </TiltCard>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
