import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { LowCogModeProvider } from "@/contexts/LowCogModeContext";
import { ThemeProvider } from "next-themes";
import { Loader2 } from "lucide-react";

// Eagerly load the landing page
import Index from "./pages/Index";
import FeedbackWidget from "./components/FeedbackWidget";
import CookieConsent from "./components/CookieConsent";

// Lazy load all other routes
const About = lazy(() => import("./pages/About"));
const AboutInvoiceIQ = lazy(() => import("./pages/AboutInvoiceIQ"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Compliance = lazy(() => import("./pages/Compliance"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const EULA = lazy(() => import("./pages/EULA"));
const Support = lazy(() => import("./pages/Support"));
const DocumentCapture = lazy(() => import("./pages/DocumentCapture"));
const DetectInvoices = lazy(() => import("./pages/DetectInvoices"));
const FileInvoices = lazy(() => import("./pages/FileInvoices"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Settings = lazy(() => import("./pages/Settings"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="invoiceiq-theme">
        <AuthProvider>
          <LowCogModeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/about-invoiceiq" element={<AboutInvoiceIQ />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/eula" element={<EULA />} />
              <Route path="/support" element={<Support />} />
              <Route path="/capture-invoices" element={<DocumentCapture />} />
              <Route path="/detect-invoices" element={<DetectInvoices />} />
              <Route path="/file-invoices" element={<FileInvoices />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/oauth/xero" element={<OAuthCallback provider="xero" />} />
              <Route path="/oauth/quickbooks" element={<OAuthCallback provider="quickbooks" />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <FeedbackWidget />
            <CookieConsent />
            </BrowserRouter>
          </TooltipProvider>
          </LowCogModeProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
