import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Trash2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoImage from "@/assets/InvoiceIQ_Logo.png";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signInWithGoogle, signOut, deleteAccount, loading } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);
    if (error) {
      toast.error("Failed to delete account. Please try again.");
    } else {
      toast.success("Your account has been deleted.");
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-header backdrop-blur-md border-b border-border">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img src={logoImage} alt="InvoiceIQ Logo" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold text-white">InvoiceIQ</span>
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
            {loading ? (
              <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white" disabled>
                Loading...
              </Button>
            ) : user ? (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="text-destructive hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action is permanent and cannot be undone. All your data, including scan history and profile information, will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? "Deleting..." : "Yes, delete my account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/20 hover:text-white"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20 hover:text-white"
                onClick={handleSignIn}
              >
                Sign In
              </Button>
            )}
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