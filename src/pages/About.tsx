import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Target, Users, Zap } from "lucide-react";
import { Helmet } from "react-helmet-async";
import aboutHeroBg from "@/assets/about-hero-bg.png";

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
              <h1 className="text-4xl md:text-5xl font-bold text-white">Our Story</h1>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-gradient-light-indigo">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              <Card className="border-0 shadow-elegant">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <Heart className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold">Who Built This</h2>
                  </div>
                  <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                    <p>
                      InvoiceIQ was created by a small, independent software company focused on building practical automation tools for modern businesses. Our team combines expertise in artificial intelligence, cloud automation, and financial operations to deliver a system that handles receipts, invoices, and bookkeeping workflows with precision. We built InvoiceIQ to give business owners access to enterprise-level automation without enterprise-level complexity or cost.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-elegant">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <Target className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold">Why It Matters</h2>
                  </div>
                  <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                    <p>
                      Most businesses lose hours every week hunting for receipts, categorizing expenses, processing invoices, or manually cleaning messy data. Errors slip through, reconciliation is delayed, and financial clarity suffers. InvoiceIQ eliminates that burden entirely.
                    </p>
                    <p>
                      Our system automatically collects receipts from email, processes receipt images uploaded by your team, extracts accurate financial data using AI, classifies expenses, and pushes clean, validated records directly into your accounting platform. The result? Zero paper trails, zero manual entry, zero guesswork. Just accurate, real-time bookkeeping handled effortlessly in the background.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-elegant">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <Users className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold">Our Mission</h2>
                  </div>
                  <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                    <p>
                      To remove the friction from financial administration by giving every business—big or small—access to effortless, accurate, fully automated bookkeeping workflows. We believe financial clarity should be instant, reliable, and stress-free.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-6 mt-16">
                <div className="text-center space-y-3">
                  <div className="p-4 rounded-full bg-primary/10 text-primary w-16 h-16 mx-auto flex items-center justify-center">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg">Fast & Reliable</h3>
                  <p className="text-muted-foreground">Built to handle hundreds of invoices without breaking a sweat</p>
                </div>
                <div className="text-center space-y-3">
                  <div className="p-4 rounded-full bg-primary/10 text-primary w-16 h-16 mx-auto flex items-center justify-center">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg">Made with Care</h3>
                  <p className="text-muted-foreground">Every feature designed to solve real business problems</p>
                </div>
                <div className="text-center space-y-3">
                  <div className="p-4 rounded-full bg-primary/10 text-primary w-16 h-16 mx-auto flex items-center justify-center">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg">Customer First</h3>
                  <p className="text-muted-foreground">Direct access to the developer, no middlemen</p>
                </div>
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