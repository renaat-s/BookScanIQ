import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Trash2, LogIn, ChevronDown, Settings, LayoutDashboard, Info, HelpCircle, Tag, Terminal } from "lucide-react";
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
    <header className="sticky top-0 z-50 bg-background/40 backdrop-blur-xl border-b border-primary/20 shadow-[0_0_24px_hsl(var(--primary)/0.15)]">
      {/* Cyberpunk scanline accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

      <nav className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* LEFT: Brand */}
          <Link to="/" className="flex items-center space-x-2 min-w-0 group">
            <div className="relative">
              <img src={logoImage} alt="InvoiceIQ Logo" className="w-8 h-8 rounded-lg shrink-0 relative z-10" />
              <div className="absolute inset-0 rounded-lg bg-primary/40 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-[0.18em] uppercase bg-gradient-to-r from-primary via-foreground to-accent bg-clip-text text-transparent truncate">
              InvoiceIQ
            </span>
          </Link>

          {/* CENTER: Dashboard (signed-in only) */}
          <div className="hidden md:flex flex-1 justify-center">
            {user && (
              <Link
                to="/dashboard"
                className={`group relative inline-flex items-center gap-2 px-5 py-2 rounded-md font-mono text-xs uppercase tracking-[0.22em] border transition-all
                  ${location.pathname === '/dashboard'
                    ? 'border-primary/70 text-primary bg-primary/10 shadow-[0_0_18px_hsl(var(--primary)/0.35)]'
                    : 'border-primary/30 text-foreground/80 hover:text-primary hover:border-primary/70 hover:bg-primary/5'}`}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>Dashboard</span>
                <span className="absolute -top-px left-2 right-2 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )}
          </div>

          {/* RIGHT: Theme + Menu */}
          <div className="hidden md:flex items-center space-x-2">
            <ThemeToggle className="text-foreground/80 hover:text-primary hover:bg-primary/10" />
            {loading ? (
              <Button variant="ghost" className="text-foreground/70" disabled>
                ...
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/80 hover:text-primary hover:bg-primary/10 border border-primary/20 hover:border-primary/60"
                  >
                    <Menu className="h-4 w-4 mr-2" />
                    Menu
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-background/95 backdrop-blur-xl border border-primary/30 shadow-[0_0_30px_hsl(var(--primary)/0.2)]"
                >
                  <DropdownMenuItem onClick={() => navigate('/about')} className="font-mono text-xs uppercase tracking-wider">
                    <Info className="h-4 w-4 mr-2" /> About
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/faq')} className="font-mono text-xs uppercase tracking-wider">
                    <HelpCircle className="h-4 w-4 mr-2" /> FAQ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/pricing')} className="font-mono text-xs uppercase tracking-wider">
                    <Tag className="h-4 w-4 mr-2" /> Pricing
                  </DropdownMenuItem>

                  {user ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/dashboard')} className="font-mono text-xs uppercase tracking-wider">
                        <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/settings')} className="font-mono text-xs uppercase tracking-wider">
                        <Settings className="h-4 w-4 mr-2" /> Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="font-mono text-xs uppercase tracking-wider">
                        <LogOut className="h-4 w-4 mr-2" /> Sign Out
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive font-mono text-xs uppercase tracking-wider"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignIn} className="font-mono text-xs uppercase tracking-wider">
                        <LogIn className="h-4 w-4 mr-2" /> Sign In
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* MOBILE */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-foreground hover:text-primary hover:bg-primary/10 border border-primary/20" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background/95 backdrop-blur-xl border-l border-primary/30">
              <div className="flex flex-col gap-1 mt-8 font-mono text-xs uppercase tracking-[0.2em]">
                {user && (
                  <button onClick={() => navigate('/dashboard')} className="px-3 py-3 rounded-md hover:bg-primary/10 hover:text-primary text-left transition-smooth flex items-center gap-2 border border-primary/30 mb-2">
                    <Terminal className="h-4 w-4" /> Dashboard
                  </button>
                )}
                <Link to="/about" className="px-3 py-3 rounded-md hover:bg-primary/10 hover:text-primary transition-smooth flex items-center gap-2">
                  <Info className="h-4 w-4" /> About
                </Link>
                <Link to="/faq" className="px-3 py-3 rounded-md hover:bg-primary/10 hover:text-primary transition-smooth flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" /> FAQ
                </Link>
                <Link to="/pricing" className="px-3 py-3 rounded-md hover:bg-primary/10 hover:text-primary transition-smooth flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Pricing
                </Link>
                <div className="flex items-center justify-between px-3 py-2 mt-2">
                  <span className="text-muted-foreground">Theme</span>
                  <ThemeToggle variant="outline" />
                </div>
                <div className="h-px bg-primary/20 my-2" />
                {user ? (
                  <>
                    <button onClick={() => navigate('/settings')} className="px-3 py-3 rounded-md hover:bg-primary/10 hover:text-primary text-left transition-smooth flex items-center gap-2">
                      <Settings className="h-4 w-4" /> Settings
                    </button>
                    <button onClick={handleSignOut} className="px-3 py-3 rounded-md hover:bg-primary/10 hover:text-primary text-left transition-smooth flex items-center gap-2">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                    <button onClick={() => setDeleteDialogOpen(true)} className="px-3 py-3 rounded-md hover:bg-destructive/10 text-destructive text-left transition-smooth flex items-center gap-2">
                      <Trash2 className="h-4 w-4" /> Delete Account
                    </button>
                  </>
                ) : (
                  <button onClick={handleSignIn} className="px-3 py-3 rounded-md hover:bg-primary/10 hover:text-primary text-left transition-smooth flex items-center gap-2">
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
