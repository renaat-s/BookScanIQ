import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import logoImage from "@/assets/InvoiceIQ_Logo.png";

const Header = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-gradient-header backdrop-blur-md border-b border-border">
      <nav className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <img src={logoImage} alt="InvoiceIQ Logo" className="w-12 h-12 rounded-xl shadow-lg" />
            <span className="text-2xl font-bold text-white tracking-tight">InvoiceIQ</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/about" 
              className={`transition-smooth ${location.pathname === '/about' ? 'text-white font-semibold' : 'text-white/80 hover:text-white'}`}
            >
              About
            </Link>
            <Link 
              to="/faq" 
              className={`transition-smooth ${location.pathname === '/faq' ? 'text-white font-semibold' : 'text-white/80 hover:text-white'}`}
            >
              FAQ
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white">Sign In</Button>
          </div>
          
          <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/20" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Header;