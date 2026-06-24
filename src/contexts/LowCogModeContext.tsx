import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LowCogModeContextType {
  /** True when Neurodivergent (Low Cognitive Load) Mode is on. */
  lowCog: boolean;
  /** Toggle or set the mode. Persists per-user when signed in, otherwise device-local. */
  setLowCog: (next: boolean) => Promise<void>;
  /** Convenience flip. */
  toggleLowCog: () => Promise<void>;
}

const LowCogModeContext = createContext<LowCogModeContextType | undefined>(undefined);

const STORAGE_KEY = "iiq_low_cog";
const HTML_CLASS = "low-cog";

const applyClass = (on: boolean) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(HTML_CLASS, on);
};

export const LowCogModeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  // Seed from localStorage so the class lands before the DB roundtrip.
  const [lowCog, setLowCogState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  // Apply on mount / whenever it changes.
  useEffect(() => {
    applyClass(lowCog);
  }, [lowCog]);

  // When the user is known, reconcile with their saved profile preference.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("low_cognitive_mode")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      const remote = !!data.low_cognitive_mode;
      setLowCogState(remote);
      window.localStorage.setItem(STORAGE_KEY, remote ? "1" : "0");
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const setLowCog = useCallback(
    async (next: boolean) => {
      setLowCogState(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (user) {
        await supabase
          .from("profiles")
          .update({ low_cognitive_mode: next })
          .eq("user_id", user.id);
      }
    },
    [user]
  );

  const toggleLowCog = useCallback(() => setLowCog(!lowCog), [lowCog, setLowCog]);

  return (
    <LowCogModeContext.Provider value={{ lowCog, setLowCog, toggleLowCog }}>
      {children}
    </LowCogModeContext.Provider>
  );
};

export const useLowCogMode = () => {
  const ctx = useContext(LowCogModeContext);
  if (!ctx) throw new Error("useLowCogMode must be used within a LowCogModeProvider");
  return ctx;
};
