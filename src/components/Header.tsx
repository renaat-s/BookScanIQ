import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">IQ</span>
            </div>
            <span className="text-xl font-bold text-foreground">InvoiceIQ</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            {isHomePage ? (
              <>
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-smooth">
                  Features
                </a>
                <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-smooth">
                  How It Works
                </a>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-smooth">
                  Pricing
                </a>
              </>
            ) : null}
            <Link 
              to="/about" 
              className={`transition-smooth ${location.pathname === '/about' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              About
            </Link>
            <Link 
              to="/faq" 
              className={`transition-smooth ${location.pathname === '/faq' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              FAQ
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost">Sign In</Button>
            <Button variant="hero">Get Started</Button>
          </div>
          
          <button className="md:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;