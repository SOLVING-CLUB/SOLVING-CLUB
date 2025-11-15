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
import OAuthCallbackPage from "@/pages/auth/OAuthCallbackPage";

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

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("ProtectedRoute: Error getting session:", error);
        setChecking(false);
        return;
      }
      
      setHasSession(!!session);
      setChecking(false);
      
      if (!session) {
        // Use setTimeout to avoid blocking
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 100);
      }
    }).catch((error) => {
      console.error("ProtectedRoute: Error in getSession:", error);
      setChecking(false);
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
    
    // Handle OAuth callback - Supabase automatically handles this
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting session:", error);
        setLoading(false);
        return;
      }
      
      setAuthenticated(!!session);
      setLoading(false);
      
      // Log session details for debugging
      if (session) {
        console.log("Session details:", {
          provider: session.provider,
          hasProviderToken: !!session.provider_token,
          hasProviderRefreshToken: !!session.provider_refresh_token,
          userEmail: session.user?.email,
          userMetadata: session.user?.user_metadata
        });
      }
      
      // Handle redirects
      if (!session && !location.startsWith('/auth')) {
        setLocation('/auth/login');
      } else if (session && location.startsWith('/auth') && !location.includes('update-password')) {
        // Small delay to ensure everything is ready
        setTimeout(() => {
          setLocation('/dashboard');
        }, 100);
      }
    }).catch((error) => {
      console.error("Error in getSession:", error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newAuthenticated = !!session;
      setAuthenticated(newAuthenticated);
      
      // Handle Google OAuth sign-in: ensure profile is created/updated
      // Note: Database trigger should handle this, but we'll also do it here as backup
      // Do this asynchronously without blocking the redirect
      if (event === 'SIGNED_IN' && session?.user) {
        // Store Google provider token if available (this is the best time to capture it)
        if (session.provider === 'google' && session.provider_token) {
          sessionStorage.setItem('google_access_token', session.provider_token);
          console.log('Captured Google provider_token from SIGNED_IN event');
        }
        
        // Don't await - let it run in background
        (async () => {
          try {
            const user = session.user;
            
            // Get user metadata (works for both email/password and OAuth)
            const fullName = user.user_metadata?.full_name || 
                            user.user_metadata?.name || 
                            user.user_metadata?.display_name || null;
            const email = user.email || user.user_metadata?.email || null;
            const avatarUrl = user.user_metadata?.avatar_url || 
                             user.user_metadata?.picture || null;

            // Ensure profile exists (trigger should handle this, but backup in case)
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id, full_name, email, avatar_url')
              .eq('id', user.id)
              .maybeSingle();

            // Only update if profile doesn't exist or if we have new data
            if (!existingProfile || (fullName && !existingProfile.full_name) || (avatarUrl && !existingProfile.avatar_url)) {
              const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                  id: user.id,
                  full_name: fullName || existingProfile?.full_name || null,
                  email: email || existingProfile?.email || null,
                  avatar_url: avatarUrl || existingProfile?.avatar_url || null,
                }, {
                  onConflict: 'id'
                });

              if (profileError) {
                console.error('Error creating/updating profile:', profileError);
              } else {
                console.log('Profile created/updated successfully');
              }
            }
          } catch (error) {
            console.error('Error in profile creation:', error);
            // Don't block on profile creation errors
          }
        })();
      }
      
      // Handle redirects immediately (don't wait for profile creation)
      if (!newAuthenticated && !location.startsWith('/auth')) {
        setLocation('/auth/login');
      } else if (newAuthenticated && location.startsWith('/auth') && !location.includes('update-password')) {
        // Small delay to ensure session is fully set
        setTimeout(() => {
          setLocation('/dashboard');
        }, 100);
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
        {/* Handle OAuth callback - Supabase redirects here after Google auth */}
        <Route path="/auth/callback" component={OAuthCallbackPage} />
        
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
