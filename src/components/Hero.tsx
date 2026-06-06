import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Shield, TrendingUp, FolderSync, Loader2, CheckCircle, ExternalLink, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-invoice-illustration.png";
import logoImage from "@/assets/InvoiceIQ_Logo.png";
import ParticleField from "./ParticleField";
import TiltCard from "./TiltCard";

const SUBHEAD = "Stop wasting hours on manual invoice processing. InvoiceIQ's AI agent extracts, validates, and processes invoices with 99% accuracy, saving you time and eliminating costly errors.";


const Hero = () => {
  const { user, signInWithGoogle } = useAuth();
  const [directoryInstalled, setDirectoryInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [setupComplete, setSetupComplete] = useState(false);

  // Check if directory is already installed and n8n setup is complete
  useEffect(() => {
    if (!user) {
      setDirectoryInstalled(false);
      setSetupComplete(false);
      setSpreadsheetId(null);
      return;
    }
    setCheckingStatus(true);

    // Check both profiles and user_credentials in parallel
    Promise.all([
      supabase
        .from("profiles")
        .select("directory_installed")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("user_credentials")
        .select("folder_mapping, user_spreadsheet_id, root_folder_id")
        .eq("user_id", user.id)
        .single(),
    ]).then(([profileRes, credRes]) => {
      setDirectoryInstalled(profileRes.data?.directory_installed ?? false);

      const cred = credRes.data;
      if (cred?.folder_mapping && cred?.user_spreadsheet_id && cred?.root_folder_id) {
        setSetupComplete(true);
        setSpreadsheetId(cred.user_spreadsheet_id);
      } else {
        setSetupComplete(false);
        setSpreadsheetId(null);
      }

      setCheckingStatus(false);
    });
  }, [user]);

  // Poll for setup completion after directory is installed but setup isn't complete
  useEffect(() => {
    if (!user || !directoryInstalled || setupComplete) return;

    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("user_credentials")
        .select("folder_mapping, user_spreadsheet_id, root_folder_id")
        .eq("user_id", user.id)
        .single();

      if (data?.folder_mapping && data?.user_spreadsheet_id && data?.root_folder_id) {
        setSetupComplete(true);
        setSpreadsheetId(data.user_spreadsheet_id);
        clearInterval(poll);
      }
    }, 3000);

    return () => clearInterval(poll);
  }, [user, directoryInstalled, setupComplete]);

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
        toast.success("Workspace synced — you're all set!");
      } else {
        throw new Error(data?.error || "Sync failed");
      }
    } catch (err: unknown) {
      console.error("Workspace sync error:", err);
      toast.error(err instanceof Error ? err.message : "We couldn't sync your workspace. Please try again.");
    } finally {
      setInstalling(false);
    }
  };

  const showFeatureButtons = user && directoryInstalled;

  return (
    <section className="relative min-h-screen flex items-center bg-gradient-subtle overflow-hidden">
      {/* 3D particle background */}
      <ParticleField />
      {/* Subtle scanline / grid overlay */}
      <div className="absolute inset-0 pointer-events-none hero-grid-overlay opacity-60" aria-hidden="true" />

      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 relative z-10">
        {/* Logo + Brand Name - Centered at Top */}
        <div className="flex flex-col items-center justify-center gap-4 mb-8 sm:mb-12">
          <TiltCard className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-xl shadow-2xl">
            <img
              src={logoImage}
              alt="InvoiceIQ Logo"
              className="w-full h-full rounded-xl"
            />
          </TiltCard>
          <span className="text-4xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 bg-clip-text text-transparent [text-shadow:_0_4px_12px_rgb(139_92_246_/_0.4)] text-center">
            InvoiceIQ
          </span>
        </div>

        <div className="flex flex-col items-center gap-8 sm:gap-12 max-w-5xl mx-auto w-full">
          <div className="space-y-6 sm:space-y-8 text-center flex flex-col items-center w-full">
            <div className="space-y-4 flex flex-col items-center">
              <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-xs sm:text-sm text-brand-primary font-medium">
                <Zap className="w-4 h-4 mr-2" />
                AI-Powered Invoice Automation
              </div>

              <h1
                className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight glitch-text neon-glow-text break-words"
                data-text="InvoiceIQ — AI-Powered Automated Bookkeeping & Invoice Processing"
              >
                InvoiceIQ — AI-Powered{" "}
                <span className="text-gradient">Automated Bookkeeping</span>{" "}
                &amp; Invoice Processing
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-foreground/80 leading-[1.7] tracking-[-0.005em] font-light max-w-2xl mx-auto px-2">
                {SUBHEAD.split("").map((ch, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.01, delay: i * 0.012 }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              {!showFeatureButtons ? (
                <div className="flex flex-col items-center gap-3">
                  <Button
                    variant="hero"
                    size="lg"
                    className="shadow-elegant neon-glow-box"
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
                        ? "Syncing your workspace…"
                        : checkingStatus
                          ? "Checking status…"
                          : "Sync My Workspace"}
                  </Button>
                  <p className="text-sm text-muted-foreground max-w-md text-center">
                    Securely sync InvoiceIQ with your Google workspace to unlock all features. We only access what we create — your other files stay private.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-brand-accent font-medium">
                    <CheckCircle className="w-4 h-4" />
                    {setupComplete
                      ? "Workspace synced — your bookkeeping is connected and ready!"
                      : "Workspace synced — finalizing connection…"}
                  </div>

                  {spreadsheetId && (
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Your Bookkeeping Sheet
                    </a>
                  )}

                  <Link to="/dashboard">
                    <Button variant="hero" size="lg" className="shadow-elegant neon-glow-box">
                      <LayoutDashboard className="w-5 h-5 mr-2" />
                      Open Your Portal
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground max-w-md text-center">
                    Detect, file, and review every invoice from your personal portal — your full bookkeeping workspace in one place.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-4">
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

          <div className="relative w-full max-w-3xl mx-auto">
            <div className="relative z-10">
              <TiltCard className="rounded-2xl shadow-glow">
                <img
                  src={heroImage}
                  alt="AI-powered invoice processing dashboard showing automated data extraction and validation"
                  className="w-full h-auto rounded-2xl"
                  data-aos="fade-up"
                />
              </TiltCard>
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
