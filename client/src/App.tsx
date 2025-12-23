import { Switch, Route, useLocation, Redirect } from "wouter";
import { ThemeProvider } from "next-themes";
import { SimpleToaster } from "@/components/ui/simple-toaster";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import DashboardFrame from "@/components/dashboard-frame";

// Auth Pages
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import UpdatePasswordPage from "@/pages/auth/UpdatePasswordPage";

// Dashboard Pages
import DashboardPage from "@/pages/dashboard/DashboardPage";
import ProfilePage from "@/pages/dashboard/ProfilePage";
import ProjectsPage from "@/pages/dashboard/ProjectsPage";
import ProjectDetailPage from "@/pages/dashboard/projects/ProjectDetailPage";
import ProjectSettingsPage from "@/pages/dashboard/projects/ProjectSettingsPage";
import HoursPage from "@/pages/dashboard/HoursPage";
import LearningsPage from "@/pages/dashboard/LearningsPage";
import FinancialPage from "@/pages/dashboard/FinancialPage";
import GlobalTasksPage from "@/pages/dashboard/GlobalTasksPage";

import { lazy, Suspense } from "react";

const CalendarPage = lazy(() => import("@/pages/dashboard/calendar/CalendarPage"));

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setChecking(false);
      if (!session) {
        setLocation("/auth/login");
      }
    });
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return null;
  }

  return <DashboardFrame>{children}</DashboardFrame>;
}

function App() {
  const [location, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication on mount
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session);
      setLoading(false);
      if (!session && !location.startsWith('/auth')) {
        setLocation('/auth/login');
      } else if (session && location.startsWith('/auth') && !location.includes('update-password')) {
        setLocation('/dashboard');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newAuthenticated = !!session;
      setAuthenticated(newAuthenticated);

      // Only redirect if we're not already on the correct page
      if (!newAuthenticated && !location.startsWith('/auth')) {
        setLocation('/auth/login');
      } else if (newAuthenticated && location.startsWith('/auth') && !location.includes('update-password')) {
        setLocation('/dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [location, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Switch>
        {/* Auth Routes */}
        <Route path="/auth/login" component={LoginPage} />
        <Route path="/auth/signup" component={SignupPage} />
        <Route path="/auth/forgot-password" component={ForgotPasswordPage} />
        <Route path="/auth/update-password" component={UpdatePasswordPage} />

        {/* Dashboard Routes */}
        <Route path="/dashboard">
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/profile">
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/projects">
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/projects/:id">
          <ProtectedRoute>
            <ProjectDetailPage />
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/projects/:id/settings">
          <ProtectedRoute>
            <ProjectSettingsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/hours">
          <ProtectedRoute>
            <HoursPage />
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/learnings">
          <ProtectedRoute>
            <LearningsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/financial">
          <ProtectedRoute>
            <FinancialPage />
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/global-tasks">
          <ProtectedRoute>
            <GlobalTasksPage />
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/calendar">
          <ProtectedRoute>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading calendar...</div>}>
              <CalendarPage />
            </Suspense>
          </ProtectedRoute>
        </Route>

        {/* Root redirect */}
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
      </Switch>
      <SimpleToaster />
    </ThemeProvider>
  );
}

export default App;