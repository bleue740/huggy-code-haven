import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SessionProvider, useSession } from "@/hooks/useSession";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import PricingPage from "./pages/Pricing";
import CreditsPage from "./pages/Credits";
import PublishedDeploymentPage from "./pages/PublishedDeployment";
import SettingsPage from "./pages/Settings";
import AboutPage from "./pages/About";
const queryClient = new QueryClient();

function HomeRedirect() {
  return <Index />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SessionProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/credits" element={<CreditsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/p/:deploymentId" element={<PublishedDeploymentPage />} />
            <Route path="/app" element={<Index />} />
            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SessionProvider>
  </QueryClientProvider>
);

export default App;
