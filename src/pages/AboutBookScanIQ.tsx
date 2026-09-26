import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import TiltCard from "@/components/TiltCard";
import CyberBackground from "@/components/CyberBackground";
import { Helmet } from "react-helmet-async";
import adVideo from "@/assets/InvoiceIQ_AD_Captioned.mp4.asset.json";
import adPoster from "@/assets/IIQ_Thumbnail.png.asset.json";

const AboutBookScanIQ = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>About BookScanIQ - What It Is & How It Works</title>
        <meta
          name="description"
          content="Learn what BookScanIQ is and how the platform automates invoice capture, parsing, and bookkeeping with AI."
        />
        <link rel="canonical" href="https://bookscaniq.com/about-invoiceiq" />
      </Helmet>
      <Header />
      <main className="bg-gradient-subtle relative overflow-hidden">
        <CyberBackground />

        <section className="pt-16 pb-12 md:pt-24 md:pb-16 relative">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent neon-cyber-text glitch-text"
                data-text="About BookScanIQ"
              >
                About BookScanIQ
              </h1>
            </div>
          </div>
        </section>

        <section className="pb-16 md:pb-20 relative">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="relative w-full max-w-3xl mx-auto">
              <div className="relative z-10">
                <TiltCard className="rounded-2xl shadow-glow overflow-hidden">
                  <video
                    src={adVideo.url}
                    poster={adPoster.url}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-auto rounded-2xl block"
                  >
                    Your browser does not support the video tag.
                  </video>
                </TiltCard>
              </div>
              <div className="absolute top-4 right-4 w-72 h-72 bg-gradient-primary opacity-20 rounded-full blur-3xl" />
              <div className="absolute bottom-4 left-4 w-48 h-48 bg-brand-accent opacity-20 rounded-full blur-2xl" />
            </div>
          </div>
        </section>

        <Features />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default AboutBookScanIQ;
