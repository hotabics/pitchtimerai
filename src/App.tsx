import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthModal } from "./components/auth/AuthModal";
import { WhatsNewModal } from "./components/WhatsNewModal";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { SurveyTriggerProvider } from "./components/survey";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";

// Lazy load pages for code splitting - reduces initial CSS bundle
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const FeedbackAnalytics = lazy(() => import("./pages/FeedbackAnalytics"));
const Pricing = lazy(() => import("./pages/Pricing"));
const SharedScript = lazy(() => import("./pages/SharedScript"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const About = lazy(() => import("./pages/About"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Contact = lazy(() => import("./pages/Contact"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Careers = lazy(() => import("./pages/Careers"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const MobileRecord = lazy(() => import("./pages/MobileRecord"));
const AICoachPage = lazy(() => import("./components/ai-coach/AICoachPage").then(m => ({ default: m.AICoachPage })));
const InterrogationHistory = lazy(() => import("./pages/InterrogationHistory"));
const Survey = lazy(() => import("./pages/Survey"));
const SurveyAnalytics = lazy(() => import("./pages/SurveyAnalytics"));
const AdminRoles = lazy(() => import("./pages/AdminRoles"));
const SalesSimulator = lazy(() => import("./pages/SalesSimulator"));
const SalesSimulatorSetup = lazy(() => import("./pages/SalesSimulatorSetup"));
const SalesSimulatorLive = lazy(() => import("./pages/SalesSimulatorLive"));
const SalesSimulatorSummary = lazy(() => import("./pages/SalesSimulatorSummary"));
const ScriptCoach = lazy(() => import("./pages/ScriptCoach"));

const queryClient = new QueryClient();

// Minimal loading fallback to avoid layout shift
const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthModal />
      <WhatsNewModal />
      <BrowserRouter>
        <SurveyTriggerProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 pt-16">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/shared/:id" element={<SharedScript />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:id" element={<BlogArticle />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/cookies" element={<Cookies />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/survey" element={<Survey />} />
                  <Route path="/sales-simulator" element={<SalesSimulator />} />
                  <Route path="/sales-simulator/setup" element={<SalesSimulatorSetup />} />
                  <Route path="/sales-simulator/live/:sessionId" element={<SalesSimulatorLive />} />
                  <Route path="/sales-simulator/summary/:sessionId" element={<SalesSimulatorSummary />} />
                  <Route path="/sales-simulator/script-coach" element={<ScriptCoach />} />
                  
                  {/* Protected routes - require authentication */}
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/ai-coach" element={<ProtectedRoute><AICoachPage /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/interrogation-history" element={<ProtectedRoute><InterrogationHistory /></ProtectedRoute>} />
                  <Route path="/mobile-record/:sessionId" element={<ProtectedRoute><MobileRecord /></ProtectedRoute>} />
                  {/* Redirect /my-pitches to /profile */}
                  <Route path="/my-pitches" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  
                  {/* Admin routes - require admin role */}
                  <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
                  <Route path="/admin/feedback" element={<AdminRoute><FeedbackAnalytics /></AdminRoute>} />
                  <Route path="/admin/surveys" element={<AdminRoute><SurveyAnalytics /></AdminRoute>} />
                  <Route path="/admin/roles" element={<AdminRoute><AdminRoles /></AdminRoute>} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </SurveyTriggerProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
