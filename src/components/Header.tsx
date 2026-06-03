import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Trash2, LogIn, ChevronDown, User, Settings, LayoutDashboard } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signInWithGoogle, signOut, deleteAccount, loading } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
            <Link 
              to="/pricing" 
              className={`transition-smooth ${location.pathname === '/pricing' ? 'text-white font-semibold' : 'text-white/80 hover:text-white'}`}
            >
              Pricing
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white" disabled>
                Loading...
              </Button>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white">
                    <User className="h-4 w-4 mr-2" />
                    Menu
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover">
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20 hover:text-white"
                onClick={handleSignIn}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/20" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-1 mt-8">
                <Link to="/about" className="px-3 py-3 rounded-md hover:bg-muted transition-smooth">About</Link>
                <Link to="/faq" className="px-3 py-3 rounded-md hover:bg-muted transition-smooth">FAQ</Link>
                <Link to="/pricing" className="px-3 py-3 rounded-md hover:bg-muted transition-smooth">Pricing</Link>
                <div className="h-px bg-border my-2" />
                {user ? (
                  <>
                    <button onClick={() => navigate('/dashboard')} className="px-3 py-3 rounded-md hover:bg-muted text-left transition-smooth flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </button>
                    <button onClick={() => navigate('/settings')} className="px-3 py-3 rounded-md hover:bg-muted text-left transition-smooth flex items-center gap-2">
                      <Settings className="h-4 w-4" /> Settings
                    </button>
                    <button onClick={handleSignOut} className="px-3 py-3 rounded-md hover:bg-muted text-left transition-smooth flex items-center gap-2">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                    <button onClick={() => setDeleteDialogOpen(true)} className="px-3 py-3 rounded-md hover:bg-destructive/10 text-destructive text-left transition-smooth flex items-center gap-2">
                      <Trash2 className="h-4 w-4" /> Delete Account
                    </button>
                  </>
                ) : (
                  <button onClick={handleSignIn} className="px-3 py-3 rounded-md hover:bg-muted text-left transition-smooth flex items-center gap-2">
                    <LogIn className="h-4 w-4" /> Sign In
                  </button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
    </header>
  );
};

export default Header;