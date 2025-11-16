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
// Lazy load meeting pages to prevent blocking on import errors
import { lazy, Suspense } from "react";

const ErrorFallback = ({ error }: { error?: Error }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center p-6">
      <p className="text-lg font-semibold mb-2">Meetings feature unavailable</p>
      <p className="text-muted-foreground mb-2">Please ensure the database schema is set up and dependencies are installed.</p>
      {error && (
        <p className="text-sm text-red-500 mt-2 font-mono">{error.message}</p>
      )}
    </div>
  </div>
);

const MeetingsPage = lazy(() => 
  import("@/pages/dashboard/meetings/MeetingsPage").catch((err) => { 
    console.error('Failed to load MeetingsPage:', err);
    return { default: () => <ErrorFallback error={err} /> };
  })
);
const CreateMeetingPage = lazy(() => 
  import("@/pages/dashboard/meetings/CreateMeetingPage").catch((err) => { 
    console.error('Failed to load CreateMeetingPage:', err);
    return { default: () => <ErrorFallback error={err} /> };
  })
);
const MeetingRoomPage = lazy(() => 
  import("@/pages/dashboard/meetings/MeetingRoomPage").catch((err) => { 
    console.error('Failed to load MeetingRoomPage:', err);
    return { default: () => <ErrorFallback error={err} /> };
  })
);

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setChecking(false);
      if (!session) {
        window.location.href = '/auth/login';
      }
    });
  }, [location]);

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
        <Route path="/dashboard/meetings">
          <ProtectedRoute>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading meetings...</div>}>
              <MeetingsPage />
            </Suspense>
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/meetings/create">
          <ProtectedRoute>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
              <CreateMeetingPage />
            </Suspense>
          </ProtectedRoute>
        </Route>
        {/* Meeting room is full-screen, no DashboardFrame */}
        <Route path="/dashboard/meetings/:id">
          <ProtectedRoute>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Joining meeting...</div>}>
              <MeetingRoomPage />
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
