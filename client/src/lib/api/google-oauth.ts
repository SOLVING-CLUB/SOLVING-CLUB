import { getSupabaseClient } from "../supabase";
import { GOOGLE_OAUTH_SCOPES } from "../config";

/**
 * Initiate Google OAuth flow using Supabase
 * Supabase handles the OAuth flow and redirects back to the app
 */
export async function initiateGoogleAuth(): Promise<void> {
	const supabase = getSupabaseClient();
	
	// Get the current origin for redirect
	const redirectTo = `${window.location.origin}/auth/callback`;
	
	console.log("Initiating Google OAuth, redirecting to:", redirectTo);
	
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			scopes: GOOGLE_OAUTH_SCOPES,
			redirectTo: redirectTo,
			queryParams: {
				access_type: "offline",
				prompt: "consent",
			},
		},
	});

	if (error) {
		console.error("Error initiating Google OAuth:", error);
		throw error;
	}
	
	// Supabase will redirect automatically, but log the URL for debugging
	if (data?.url) {
		console.log("OAuth URL:", data.url);
	}
}

/**
 * Get Google access token from Supabase session or stored token
 * Supabase may not expose provider_token, so we also check sessionStorage
 */
export async function getStoredGoogleToken(): Promise<string | null> {
	const supabase = getSupabaseClient();
	const { data: { session }, error } = await supabase.auth.getSession();

	if (error) {
		console.error("Error getting session:", error);
		return null;
	}

	if (!session) {
		console.warn("No session found");
		return null;
	}

	console.log("Session provider:", session.provider);
	console.log("Has provider_token:", !!session.provider_token);
	console.log("Has provider_refresh_token:", !!session.provider_refresh_token);

	// First, try to get token from Supabase session
	// Note: session.provider might be undefined even if provider_token exists
	// So we check for provider_token first, and also check if user signed in with Google
	const isGoogleUser = session.provider === "google" || 
	                    session.user?.app_metadata?.provider === "google" ||
	                    session.user?.identities?.some((id: any) => id.provider === "google");

	if (session.provider_token) {
		// If we have a provider_token, use it (even if provider is undefined)
		// Google tokens typically start with "ya29." or "1//"
		const token = session.provider_token;
		if (isGoogleUser || token.startsWith("ya29.") || token.startsWith("1//")) {
			console.log("Found Google provider token in Supabase session");
			// Also store it in sessionStorage as backup
			sessionStorage.setItem('google_access_token', token);
			return token;
		}
	}

	// If session exists but no provider token, try to refresh
	if (isGoogleUser) {
		console.log("Refreshing session to get provider token...");
		const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
		if (refreshError) {
			console.error("Error refreshing session:", refreshError);
		}
		if (refreshedSession?.provider_token) {
			console.log("Got provider token after refresh");
			sessionStorage.setItem('google_access_token', refreshedSession.provider_token);
			return refreshedSession.provider_token;
		}
	}

	// Fallback: Check sessionStorage (stored during OAuth callback)
	const storedToken = sessionStorage.getItem('google_access_token');
	if (storedToken) {
		// Verify it's a Google token format
		if (storedToken.startsWith("ya29.") || storedToken.startsWith("1//")) {
			console.log("Using Google access token from sessionStorage");
			return storedToken;
		}
	}

	console.warn("No Google provider token found in session or storage");
	return null;
}

/**
 * Check if user is authenticated with Google via Supabase
 * Returns true if user signed in with Google provider
 */
export async function isGoogleAuthenticated(): Promise<boolean> {
	const supabase = getSupabaseClient();
	const { data: { session } } = await supabase.auth.getSession();

	if (!session) {
		return false;
	}

	// Check if user signed in with Google provider
	// If they did, they automatically have Google Calendar access
	return session.provider === "google" && !!session.provider_token;
}

/**
 * Clear Google authentication (sign out from Supabase)
 */
export async function clearGoogleTokens(): Promise<void> {
	const supabase = getSupabaseClient();
	await supabase.auth.signOut();
}

