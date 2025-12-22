import { Button } from "@/components/ui/button";
import { Zap, Shield, TrendingUp, Camera, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-invoice-illustration.png";
import logoImage from "@/assets/InvoiceIQ_Logo.png";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-subtle overflow-hidden">
      <div className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {/* Logo + Brand Name */}
            <div className="flex items-center gap-4">
              <img 
                src={logoImage} 
                alt="InvoiceIQ Logo" 
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl"
              />
              <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
                InvoiceIQ
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-sm text-brand-primary font-medium">
                <Zap className="w-4 h-4 mr-2" />
                AI-Powered Invoice Automation
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Transform Your{" "}
                <span className="text-gradient">Invoice Processing</span>{" "}
                with AI
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Stop wasting hours on manual invoice processing. InvoiceIQ's AI agent 
                extracts, validates, and processes invoices with 99% accuracy, saving 
                you time and eliminating costly errors.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/capture">
                <Button variant="hero" size="lg" className="shadow-elegant">
                  <Camera className="w-5 h-5 mr-2" />
                  Capture Invoice Now
                </Button>
              </Link>
              <Link to="/detect-invoices">
                <Button variant="hero-secondary" size="lg" className="shadow-elegant">
                  <Mail className="w-5 h-5 mr-2" />
                  Detect Invoices Now
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center space-x-8 pt-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-brand-accent" />
                <span className="text-sm text-muted-foreground">99% Accuracy</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-brand-accent" />
                <span className="text-sm text-muted-foreground">80% Time Saved</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-brand-accent" />
                <span className="text-sm text-muted-foreground">5min Setup</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative z-10">
              <img 
                src={heroImage} 
                alt="AI-powered invoice processing dashboard showing automated data extraction and validation"
                className="w-full h-auto rounded-2xl shadow-glow"
              />
            </div>
            <div className="absolute top-4 right-4 w-72 h-72 bg-gradient-primary opacity-20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-4 left-4 w-48 h-48 bg-brand-accent opacity-20 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;