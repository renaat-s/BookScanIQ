import { Link } from "react-router-dom";
import logoImage from "@/assets/InvoiceIQ_Logo.png";
import nanocloneLogo from "@/assets/nanoclone-logo.png";

const Footer = () => {
  return (
    <footer className="relative bg-background/80 backdrop-blur-xl border-t border-primary/25 text-foreground overflow-hidden">
      {/* Neon top edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" aria-hidden="true" />

      <div className="absolute inset-0 hero-grid-overlay opacity-30 pointer-events-none" aria-hidden="true" />
      <div className="container mx-auto px-4 sm:px-6 relative z-10 py-8">
        <div>
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <img src={logoImage} alt="BookScanIQ Logo" className="w-8 h-8 rounded-lg shadow-[0_0_12px_hsl(var(--primary)/0.35)]" />
              <span className="text-xl font-bold font-display tracking-wide bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">BookScanIQ</span>
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-foreground/70">
              <Link to="/about" className="hover:text-primary transition-smooth">About</Link>
              <Link to="/support" className="hover:text-primary transition-smooth">Support</Link>
              <Link to="/compliance" className="hover:text-primary transition-smooth">Security</Link>
              <Link to="/privacy" className="hover:text-primary transition-smooth">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-smooth">Terms of Service</Link>
              <Link to="/eula" className="hover:text-primary transition-smooth">EULA</Link>
              <Link to="/faq" className="hover:text-primary transition-smooth">FAQ</Link>
              <a href="mailto:info@bookscaniq.com" className="hover:text-primary transition-smooth">info@bookscaniq.com</a>
            </div>

            <p className="text-sm text-foreground/50">
              © {new Date().getFullYear()} BookScanIQ. All rights reserved.
            </p>
          </div>

          {/* Developed by NANOCLONE Systems */}
          <div className="flex items-center justify-center space-x-3 mt-6 pt-6 border-t border-primary/15">
            <span className="text-sm text-foreground/60">BookScanIQ - Developed by</span>
            <img src={nanocloneLogo} alt="NANOCLONE Systems" className="h-6 w-auto object-contain" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;