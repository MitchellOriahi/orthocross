import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { MusicProvider } from "@/contexts/MusicContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { TutorialIntro } from "@/components/TutorialIntro";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <MusicProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <TutorialIntro />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
              <Route path="/" element={<Auth />} />
              <Route path="/home" element={<Home />} />
              <Route path="/index" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/reading" element={<ProtectedRoute><Reading /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/church-resources" element={<ProtectedRoute><ChurchResources /></ProtectedRoute>} />
              <Route path="/orthodox-history" element={<ProtectedRoute><OrthodoxHistory /></ProtectedRoute>} />
              <Route path="/admin/import" element={<ProtectedRoute><AdminRoute><AdminImport /></AdminRoute></ProtectedRoute>} />
              <Route path="/admin/scripture-import" element={<ProtectedRoute><AdminRoute><ScriptureImport /></AdminRoute></ProtectedRoute>} />
              <Route path="/crop-icons" element={<CropIcons />} />
              <Route path="/support" element={<Support />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </MusicProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
