import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, TrendingUp, Camera, Mail, FileText, FolderSync, Loader2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import heroImage from "@/assets/hero-invoice-illustration.png";
import logoImage from "@/assets/InvoiceIQ_Logo.png";

const Hero = () => {
  const { user, signInWithGoogle } = useAuth();
  const [directoryInstalled, setDirectoryInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Check if directory is already installed when user is authenticated
  useEffect(() => {
    if (!user) {
      setDirectoryInstalled(false);
      return;
    }
    setCheckingStatus(true);
    supabase
      .from("profiles")
      .select("directory_installed")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setDirectoryInstalled(data?.directory_installed ?? false);
        setCheckingStatus(false);
      });
  }, [user]);

  const handleInstallDirectory = async () => {
    if (!user) {
      // Sign in first
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error("Sign in failed. Please try again.");
      }
      return;
    }

    setInstalling(true);
    try {
      const { data, error } = await supabase.functions.invoke("install-directory");

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        setDirectoryInstalled(true);
        toast.success("File directory installed successfully! You're all set.");
      } else {
        throw new Error(data?.error || "Installation failed");
      }
    } catch (err: any) {
      console.error("Install directory error:", err);
      toast.error(err.message || "Failed to install file directory. Please try again.");
    } finally {
      setInstalling(false);
    }
  };

  const showFeatureButtons = user && directoryInstalled;

  return (
    <section className="relative min-h-screen flex items-center bg-gradient-subtle overflow-hidden">
      <div className="container mx-auto px-6 py-20">
        {/* Logo + Brand Name - Centered at Top */}
        <div className="flex flex-col items-center justify-center gap-4 mb-12">
          <img 
            src={logoImage} 
            alt="InvoiceIQ Logo" 
            className="w-32 h-32 md:w-40 md:h-40 rounded-xl shadow-2xl"
          />
          <span className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 bg-clip-text text-transparent [text-shadow:_0_4px_12px_rgb(139_92_246_/_0.4)]">
            InvoiceIQ
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
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
            
            <div className="flex flex-col gap-4">
              {!showFeatureButtons ? (
                /* Install Directory Button - Gate */
                <div className="flex flex-col gap-3">
                  <Button
                    variant="hero"
                    size="lg"
                    className="shadow-elegant sm:self-start"
                    onClick={handleInstallDirectory}
                    disabled={installing || checkingStatus}
                  >
                    {installing ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <FolderSync className="w-5 h-5 mr-2" />
                    )}
                    {!user
                      ? "Sign In to Get Started"
                      : installing
                        ? "Installing File Directory..."
                        : checkingStatus
                          ? "Checking status..."
                          : "Install Online File Directory"}
                  </Button>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Set up your Google Drive &amp; Sheets file directory to unlock all InvoiceIQ features.
                  </p>

                  {/* Show locked feature buttons as preview */}
                  <div className="flex flex-col gap-3 mt-2 opacity-40 pointer-events-none select-none">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative">
                        <Button variant="hero" size="lg" className="shadow-elegant" disabled>
                          <Camera className="w-5 h-5 mr-2" />
                          Capture Invoice Now
                        </Button>
                        <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                          Coming Soon
                        </Badge>
                      </div>
                      <Button variant="hero-secondary" size="lg" className="shadow-elegant" disabled>
                        <Mail className="w-5 h-5 mr-2" />
                        Detect Invoices Now
                      </Button>
                    </div>
                    <Button variant="hero-tertiary" size="lg" className="sm:self-start" disabled>
                      <FileText className="w-5 h-5 mr-2" />
                      File Invoices and Log Transactions
                    </Button>
                  </div>
                </div>
              ) : (
                /* Unlocked Feature Buttons */
                <>
                  <div className="flex items-center gap-2 text-sm text-brand-accent font-medium">
                    <CheckCircle className="w-4 h-4" />
                    File directory installed — you're all set!
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative">
                      <Button variant="hero" size="lg" className="shadow-elegant opacity-50 cursor-not-allowed" disabled>
                        <Camera className="w-5 h-5 mr-2" />
                        Capture Invoice Now
                      </Button>
                      <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                        Coming Soon
                      </Badge>
                    </div>
                    <Link to="/detect-invoices">
                      <Button variant="hero-secondary" size="lg" className="shadow-elegant">
                        <Mail className="w-5 h-5 mr-2" />
                        Detect Invoices Now
                      </Button>
                    </Link>
                  </div>
                  
                  <Link to="/file-invoices" className="sm:self-start">
                    <Button variant="hero-tertiary" size="lg" className="px-[111px]">
                      <FileText className="w-5 h-5 mr-2" />
                      File Invoices and Log Transactions
                    </Button>
                  </Link>
                </>
              )}
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
