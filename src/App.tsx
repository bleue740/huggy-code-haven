import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SessionProvider } from "@/hooks/useSession";
import { ThemeProvider } from "@/hooks/useTheme";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import PricingPage from "./pages/Pricing";
import CreditsPage from "./pages/Credits";
import PublishedDeploymentPage from "./pages/PublishedDeployment";
import SettingsPage from "./pages/Settings";
import AboutPage from "./pages/About";
import BillingPage from "./pages/Billing";
import PrivacyPage from "./pages/Privacy";
import TermsPage from "./pages/Terms";
import LegalNoticePage from "./pages/LegalNotice";
import ContactPage from "./pages/Contact";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/credits" element={<CreditsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/account/billing" element={<BillingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/legal" element={<LegalNoticePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/p/:deploymentId" element={<PublishedDeploymentPage />} />
        <Route path="/app" element={<Index />} />
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SessionProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  </QueryClientProvider>
);

export default App;
