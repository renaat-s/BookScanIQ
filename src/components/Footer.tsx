import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/InvoiceIQ_Logo.png";
import nanocloneLogo from "@/assets/nanoclone-logo.png";

const Footer = () => {
  return (
    <footer className="bg-gradient-primary text-white">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Transform Your Invoice Processing?
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Join thousands of businesses saving time and money with InvoiceIQ's AI-powered automation.
          </p>
          <Button 
            variant="secondary" 
            size="lg" 
            className="bg-white text-brand-primary hover:bg-white/90 shadow-elegant"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
        
        <div className="border-t border-white/20 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <img src={logoImage} alt="InvoiceIQ Logo" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-bold">InvoiceIQ</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/80">
              <Link to="/about" className="hover:text-white transition-smooth">About</Link>
              <Link to="/support" className="hover:text-white transition-smooth">Support</Link>
              <Link to="/compliance" className="hover:text-white transition-smooth">Security</Link>
              <Link to="/privacy" className="hover:text-white transition-smooth">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-smooth">Terms of Service</Link>
              <Link to="/eula" className="hover:text-white transition-smooth">EULA</Link>
              <Link to="/faq" className="hover:text-white transition-smooth">FAQ</Link>
              <a href="mailto:info@invoice-iq.com" className="hover:text-white transition-smooth">info@invoice-iq.com</a>
            </div>
            
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} InvoiceIQ. All rights reserved.
            </p>
          </div>
          
          {/* Developed by NANOCLONE Systems */}
          <div className="flex items-center justify-center space-x-3 mt-6 pt-6 border-t border-white/10">
            <span className="text-sm text-white/70">InvoiceIQ - Developed by</span>
            <img src={nanocloneLogo} alt="NANOCLONE Systems" className="h-6 w-auto object-contain" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;