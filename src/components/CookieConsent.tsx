import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const STORAGE_KEY = "invoiceiq-cookie-consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Delay slightly so it doesn't jump in during first paint
        const t = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const persist = (value: "accepted" | "declined") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-[100] rounded-xl border border-border bg-background/95 backdrop-blur shadow-lg p-4 md:p-5"
    >
      <button
        type="button"
        onClick={() => persist("declined")}
        aria-label="Dismiss cookie notice"
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded-md"
      >
        <X className="w-4 h-4" />
      </button>
      <h2 className="text-sm font-semibold text-foreground mb-1">Cookies on BookScanIQ</h2>
      <p className="text-xs text-muted-foreground leading-relaxed pr-6">
        We use essential cookies to keep you signed in and to run the app. With your consent
        we also use a small number of non-essential cookies to improve performance. Read our{" "}
        <Link to="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => persist("accepted")} className="flex-1">
          Accept
        </Button>
        <Button size="sm" variant="outline" onClick={() => persist("declined")} className="flex-1">
          Decline
        </Button>
      </div>
    </div>
  );
};

export default CookieConsent;
