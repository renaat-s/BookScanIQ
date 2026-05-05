import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import aboutHeroBg from "@/assets/about-hero-bg.png";
import nanocloneImage from "@/assets/nanoclone-systems.png";

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
        <section className="py-20 md:py-32 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${aboutHeroBg})` }}
          />
          <div className="absolute inset-0 bg-indigo-600/40" />
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-white">About Us</h1>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-gradient-light-indigo">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
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
