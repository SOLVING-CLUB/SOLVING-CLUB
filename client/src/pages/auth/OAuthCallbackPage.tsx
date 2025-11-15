import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getSupabaseClient } from "@/lib/supabase";

export default function OAuthCallbackPage() {
	const [, setLocation] = useLocation();
	const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

	useEffect(() => {
		const supabase = getSupabaseClient();
		
		// Supabase automatically handles the OAuth callback from URL hash or query params
		// We need to wait for Supabase to process it
		const handleCallback = async () => {
			try {
				// Check if there's a hash fragment (Supabase uses #access_token=...)
				const hashParams = new URLSearchParams(window.location.hash.substring(1));
				const queryParams = new URLSearchParams(window.location.search);
				
				console.log("OAuth callback - Hash params:", hashParams.toString());
				console.log("OAuth callback - Query params:", queryParams.toString());
				
				// Try to extract Google access token from URL if present
				// This is a workaround since Supabase doesn't expose provider_token
				const googleAccessToken = hashParams.get('provider_token') || 
				                         queryParams.get('provider_token') ||
				                         hashParams.get('access_token');
				
				if (googleAccessToken && googleAccessToken.startsWith('ya29.')) {
					// This looks like a Google OAuth token
					// Store it temporarily in sessionStorage (not ideal, but works for now)
					sessionStorage.setItem('google_access_token', googleAccessToken);
					console.log("Stored Google access token from callback URL");
				}
				
				// Wait a moment for Supabase to process the callback
				await new Promise(resolve => setTimeout(resolve, 1000));
				
				// Try to get the session
				const { data: { session }, error } = await supabase.auth.getSession();
				
				if (error) {
					console.error("Error getting session in callback:", error);
					setStatus("error");
					setTimeout(() => setLocation('/auth/login'), 2000);
					return;
				}
				
				if (session) {
					console.log("OAuth callback successful, session found");
					console.log("Session provider:", session.provider);
					console.log("Has provider_token:", !!session.provider_token);
					
					// If Supabase provided the token, use it
					if (session.provider_token) {
						sessionStorage.setItem('google_access_token', session.provider_token);
						console.log("Stored provider_token from Supabase session");
					}
					
					setStatus("success");
					setTimeout(() => {
						setLocation('/dashboard');
					}, 500);
				} else {
					console.warn("No session found in callback");
					setStatus("error");
					setTimeout(() => setLocation('/auth/login'), 2000);
				}
			} catch (error) {
				console.error("Error in OAuth callback:", error);
				setStatus("error");
				setTimeout(() => setLocation('/auth/login'), 2000);
			}
		};
		
		handleCallback();
	}, [setLocation]);

	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center">
				{status === "loading" && (
					<>
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
						<p className="mt-2 text-sm text-gray-600">Completing sign in...</p>
					</>
				)}
				{status === "success" && (
					<>
						<div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mx-auto">
							<svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<p className="mt-2 text-sm text-gray-600">Sign in successful! Redirecting...</p>
					</>
				)}
				{status === "error" && (
					<>
						<div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center mx-auto">
							<svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</div>
						<p className="mt-2 text-sm text-gray-600">Sign in failed. Redirecting to login...</p>
					</>
				)}
			</div>
		</div>
	);
}

