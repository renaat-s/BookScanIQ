import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Shield, TrendingUp, FolderSync, Loader2, CheckCircle, ExternalLink, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

import logoImage from "@/assets/InvoiceIQ_Logo.png";
import ParticleField from "./LazyParticleField";
import TiltCard from "./TiltCard";

const SUBHEAD = "Stop wasting hours on manual invoice processing. BookScanIQ's AI agent extracts, validates, and processes invoices with 99% accuracy, saving you time and eliminating costly errors.";


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
        toast.success("Workspace synced, you're all set!");
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
      {/* Static gradient-mesh aurora (CSS only, no runtime cost) */}
      <div className="absolute inset-0 pointer-events-none cyber-aurora" aria-hidden="true" />
      {/* 3D particle background */}
      <ParticleField />
      {/* Subtle scanline / grid overlay */}
      <div className="absolute inset-0 pointer-events-none hero-grid-overlay opacity-60" aria-hidden="true" />

      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 relative z-10">
        {/* Status chip — HUD readout above the brand */}
        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/5 backdrop-blur-sm shadow-[0_0_18px_hsl(var(--primary)/0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="font-mono text-[0.65rem] sm:text-xs uppercase tracking-[0.28em] text-primary">
              AI Bookkeeping Engine · Online
            </span>
          </div>
        </div>

        {/* Logo + Brand Name - Centered at Top */}
        <div className="flex flex-col items-center justify-center gap-4 mb-8 sm:mb-12">
          <TiltCard className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl border border-primary/40 shadow-[0_0_35px_hsl(var(--primary)/0.35),0_0_80px_hsl(var(--accent)/0.2)] bg-card/60 backdrop-blur-md overflow-hidden">
            <img
              src={logoImage}
              alt="BookScanIQ Logo"
              className="w-full h-full rounded-2xl"
            />
          </TiltCard>
          <span className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-wide bg-gradient-to-r from-cyan-300 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent [text-shadow:_0_0_30px_rgb(0_229_255_/_0.25)] text-center">
            BookScanIQ
          </span>
        </div>

        <div className="flex flex-col items-center gap-8 sm:gap-12 max-w-5xl mx-auto w-full">
          <div className="space-y-6 sm:space-y-8 text-center flex flex-col items-center w-full">
            <div className="space-y-4 flex flex-col items-center">
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight glitch-text neon-glow-text break-words"
                data-text="Automated Bookkeeping & Invoice Processing"
              >
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
                    className="shadow-elegant neon-glow-box btn-cyber"
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
                    Securely sync BookScanIQ with your Google workspace to unlock all features. We only access what we create, your other files stay private.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-brand-accent font-medium">
                    <CheckCircle className="w-4 h-4" />
                    {setupComplete
                      ? "Workspace synced, your bookkeeping is connected and ready!"
                      : "Workspace synced, finalizing connection…"}
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
                    <Button variant="hero" size="lg" className="shadow-elegant neon-glow-box btn-cyber">
                      <LayoutDashboard className="w-5 h-5 mr-2" />
                      Open Your Portal
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground max-w-md text-center">
                    Detect, file, and review every invoice from your personal portal, your full bookkeeping workspace in one place.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-6">
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-md border border-primary/25 bg-primary/5">
                <Shield className="w-4 h-4 text-primary" />
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground/80">99% Accuracy</span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-md border border-primary/25 bg-primary/5">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground/80">80% Time Saved</span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-md border border-primary/25 bg-primary/5">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground/80">5min Setup</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default Hero;
