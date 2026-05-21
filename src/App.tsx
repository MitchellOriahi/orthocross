import React, { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { MusicProvider } from "@/contexts/MusicContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLoader } from "@/components/AppLoader";
import Friends from "./pages/Friends";
import FriendProfile from "./pages/FriendProfile";
import GroupDetail from "./pages/GroupDetail";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { TutorialIntro } from "@/components/TutorialIntro";
import { NotificationManager } from "@/components/NotificationManager";
import Auth from "./pages/Auth";
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

const AppContent = () => {
  const [authState, setAuthState] = useState<{
    isReady: boolean;
    isAuthenticated: boolean;
  }>({ isReady: false, isAuthenticated: false });

  const handleAuthReady = useCallback((isAuthenticated: boolean) => {
    setAuthState({ isReady: true, isAuthenticated });
  }, []);

  return (
    <AppLoader onAuthReady={handleAuthReady}>
      <AuthProvider>
        <NotificationManager />
        <Routes>
          {/* Root route - redirect based on auth state */}
          <Route 
            path="/" 
            element={
              authState.isReady && authState.isAuthenticated 
                ? <Navigate to="/dashboard" replace /> 
                : <Auth />
            } 
          />
          <Route path="/home" element={<Home />} />
          <Route path="/index" element={<ProtectedRoute><Index /></ProtectedRoute>} />
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
      </AuthProvider>
    </AppLoader>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
