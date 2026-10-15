import React, { useState, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { StatusBarSync } from "@/components/StatusBarSync";
import { MusicProvider } from "@/contexts/MusicContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLoader } from "@/components/AppLoader";
import Friends from "./pages/Friends";
import FriendProfile from "./pages/FriendProfile";
import GroupDetail from "./pages/GroupDetail";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { TutorialIntro } from "@/components/TutorialIntro";
import { OrientationOnboarding } from "@/components/OrientationOnboarding";
import { NotificationManager } from "@/components/NotificationManager";
import { DonationThankYouDialog } from "@/components/DonationThankYouDialog";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import IconTuner from "./pages/IconTuner";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Reading from "./pages/Reading";
import Settings from "./pages/Settings";
import ChurchResources from "./pages/ChurchResources";
import OrthodoxHistory from "./pages/OrthodoxHistory";
import CropIcons from "./pages/CropIcons";
import AdminImport from "./pages/AdminImport";
import ScriptureImport from "./pages/ScriptureImport";
import Support from "./pages/Support";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataSafety from "./pages/DataSafety";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname;
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  return (
    <div className={`transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  );
};

// The root path is the app's home: the sign-in screen when nobody is signed in,
// and the Board for a signed-in user. Reading live auth state (rather than the
// launch-time snapshot) means signing out or deleting an account lands here
// instead of bouncing back into a protected page.
const RootRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <Auth />;
};

const AppContent = () => {
  return (
    <AppLoader onAuthReady={() => {}}>
      <AuthProvider>
        <NotificationManager />
        <TutorialIntro />
        <OrientationOnboarding />
        {/* Thank-you sticker after a donation, on whichever page the donor returns to */}
        <DonationThankYouDialog />
        <PageTransition>
        <Routes>
          {/* Root route - redirect based on auth state */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/home" element={<Home />} />
          <Route path="/index" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/icon-tuner" element={<AdminRoute><IconTuner /></AdminRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/reading" element={<ProtectedRoute><Reading /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/church-resources" element={<ProtectedRoute><ChurchResources /></ProtectedRoute>} />
          <Route path="/orthodox-history" element={<ProtectedRoute><OrthodoxHistory /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
          <Route path="/friends/:friendId" element={<ProtectedRoute><FriendProfile /></ProtectedRoute>} />
          <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
          <Route path="/admin/import" element={<ProtectedRoute><AdminRoute><AdminImport /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/scripture-import" element={<ProtectedRoute><AdminRoute><ScriptureImport /></AdminRoute></ProtectedRoute>} />
          <Route path="/crop-icons" element={<CropIcons />} />
          <Route path="/support" element={<Support />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/data-safety" element={<DataSafety />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </PageTransition>
      </AuthProvider>
    </AppLoader>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <StatusBarSync />
      <MusicProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Toaster />
            <Sonner />
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </MusicProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
