export const SUPABASE_URL = "https://knkybbflxkqexjdfcnvt.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtua3liYmZseGtxZXhqZGZjbnZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4OTY5NzMsImV4cCI6MjA3MjQ3Mjk3M30.qBiee1YD64YT5MMBQUjDPT4YW2WhRIFHqDb4bci1pvc";

// Google API Configuration
export const GOOGLE_API_KEY = "AIzaSyAt1sLacKziRA3IbmiNBAqIiGtiYbh6CxE";

// Google OAuth Configuration
// Note: Client secret should NOT be in client-side code - it should be on a backend server
// For now, we'll use OAuth 2.0 implicit flow or authorization code flow with PKCE
export const GOOGLE_CLIENT_ID = "70738710958-art5bp2nojgl0l0vl2bv0gjgk1ou5icd.apps.googleusercontent.com";
export const GOOGLE_CLIENT_SECRET = "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"; // ⚠️ WARNING: This should be on backend only! Exposed here for development only.

// OAuth scopes required for Google Meet and user profile
// Note: Google Meet API may require specific scopes - check Google Cloud Console
export const GOOGLE_OAUTH_SCOPES = [
	"openid",
	"https://www.googleapis.com/auth/userinfo.email",
	"https://www.googleapis.com/auth/userinfo.profile",
	// Google Meet API scopes (if available)
	"https://www.googleapis.com/auth/meetings.space.created",
].join(" ");

// OAuth redirect URI (must match Google Cloud Console configuration)
// This dynamically uses the current origin, so it works on any port
export const GOOGLE_REDIRECT_URI = typeof window !== "undefined" 
	? `${window.location.origin}/auth/google/callback`
	: "http://localhost:5174/auth/google/callback"; // Fallback for SSR