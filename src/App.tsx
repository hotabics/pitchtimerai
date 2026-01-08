import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminAnalytics from "./pages/AdminAnalytics";
import FeedbackAnalytics from "./pages/FeedbackAnalytics";
import Pricing from "./pages/Pricing";
import SharedScript from "./pages/SharedScript";
import ResetPassword from "./pages/ResetPassword";
import { AICoachPage } from "./components/ai-coach/AICoachPage";
import { AuthModal } from "./components/auth/AuthModal";
import { WhatsNewModal } from "./components/WhatsNewModal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthModal />
      <WhatsNewModal />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/feedback" element={<FeedbackAnalytics />} />
          <Route path="/ai-coach" element={<AICoachPage />} />
          <Route path="/shared/:id" element={<SharedScript />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
