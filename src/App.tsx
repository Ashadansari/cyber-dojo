import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import LearningPaths from "./pages/LearningPaths";
import PathDetail from "./pages/PathDetail";
import Labs from "./pages/Labs";
import LabDetail from "./pages/LabDetail";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import FollowList from "./pages/FollowList";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import CyberChatbot from "./components/CyberChatbot";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/paths" element={<ProtectedRoute><LearningPaths /></ProtectedRoute>} />
              <Route path="/paths/:id" element={<ProtectedRoute><PathDetail /></ProtectedRoute>} />
              <Route path="/labs" element={<ProtectedRoute><Labs /></ProtectedRoute>} />
              <Route path="/labs/:id" element={<ProtectedRoute><LabDetail /></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/user/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/user/:userId/connections" element={<ProtectedRoute><FollowList /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CyberChatbot />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
