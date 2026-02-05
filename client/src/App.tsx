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
import NotificationsPage from "@/pages/dashboard/NotificationsPage";
import DocumentsPage from "@/pages/dashboard/DocumentsPage";
import CreateDocumentPage from "@/pages/dashboard/CreateDocumentPage";
import CreateQuotationPage from "@/pages/dashboard/CreateQuotationPage";
import AdminPage from "@/pages/dashboard/AdminPage";

import { lazy, Suspense } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionKey } from "@/lib/access/permissions";

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

function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="p-6">
      <div className="rounded-lg border bg-background p-6">
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {message ?? "You do not have permission to view this page."}
        </p>
      </div>
    </div>
  );
}

function PermissionGate({
  permissions,
  projectId,
  mode = "all",
  children,
}: {
  permissions: PermissionKey | PermissionKey[];
  projectId?: string | null;
  mode?: "all" | "any";
  children: React.ReactNode;
}) {
  const { has, loading } = usePermissions(projectId ?? null);
  const required = Array.isArray(permissions) ? permissions : [permissions];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  const allowed =
    mode === "any" ? required.some((perm) => has(perm)) : required.every((perm) => has(perm));
  if (!allowed) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

function App() {
  const [location, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication on mount
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoading(false);
      if (!session && !location.startsWith('/auth')) {
        setLocation('/auth/login');
      } else if (session && location.startsWith('/auth') && !location.includes('update-password')) {
        setLocation('/dashboard');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only redirect if we're not already on the correct page
      if (!session && !location.startsWith('/auth')) {
        setLocation('/auth/login');
      } else if (session && location.startsWith('/auth') && !location.includes('update-password')) {
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
            <PermissionGate permissions="dashboard.view">
              <DashboardPage />
            </PermissionGate>
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/profile">
          <ProtectedRoute>
            <PermissionGate permissions="profile.manage">
              <ProfilePage />
            </PermissionGate>
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/projects">
          <ProtectedRoute>
            <PermissionGate permissions="projects.view">
              <ProjectsPage />
            </PermissionGate>
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/projects/:id">
          {(params) => (
            <ProtectedRoute>
              <PermissionGate
                permissions={["projects.view", "project.view"]}
                projectId={params.id}
                mode="any"
              >
                <ProjectDetailPage />
              </PermissionGate>
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/dashboard/projects/:id/settings">
          {(params) => (
            <ProtectedRoute>
              <PermissionGate
                permissions={["projects.settings", "project.manage"]}
                projectId={params.id}
                mode="any"
              >
                <ProjectSettingsPage />
              </PermissionGate>
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/dashboard/hours">
          <ProtectedRoute>
            <PermissionGate permissions="hours.view">
              <HoursPage />
            </PermissionGate>
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/learnings">
          <ProtectedRoute>
            <PermissionGate permissions="learnings.manage">
              <LearningsPage />
            </PermissionGate>
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/financial">
          <ProtectedRoute>
            <PermissionGate permissions="financial.view">
              <FinancialPage />
            </PermissionGate>
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/global-tasks">
          <ProtectedRoute>
            <PermissionGate permissions="global_tasks.manage">
              <GlobalTasksPage />
            </PermissionGate>
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/notifications">
          <ProtectedRoute>
            <PermissionGate permissions="dashboard.view">
              <NotificationsPage />
            </PermissionGate>
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/documents">
          <ProtectedRoute>
            <PermissionGate permissions="documents.manage">
              <DocumentsPage />
            </PermissionGate>
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/documents/create">
          <ProtectedRoute>
            <PermissionGate permissions="documents.manage">
              <CreateDocumentPage />
            </PermissionGate>
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/quotations/create">
          <ProtectedRoute>
            <PermissionGate permissions="quotations.manage">
              <CreateQuotationPage />
            </PermissionGate>
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/admin">
          <ProtectedRoute>
            <PermissionGate permissions="admin.access">
              <AdminPage />
            </PermissionGate>
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard/calendar">
          <ProtectedRoute>
            <PermissionGate permissions="calendar.view">
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading calendar...</div>}>
                <CalendarPage />
              </Suspense>
            </PermissionGate>
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
