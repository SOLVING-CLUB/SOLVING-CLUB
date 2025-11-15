import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { exchangeCodeForToken, storeGoogleToken } from "@/lib/api/google-oauth";
import { toast } from "sonner";
import AuthCard from "@/components/auth/auth-card";

export default function GoogleCallbackPage() {
	const [, setLocation] = useLocation();
	const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

	useEffect(() => {
		async function handleCallback() {
			// Extract authorization code from URL
			const urlParams = new URLSearchParams(window.location.search);
			const code = urlParams.get("code");
			const error = urlParams.get("error");

			if (error) {
				console.error("OAuth error:", error);
				toast.error("Authentication failed", "Google authentication was cancelled or failed.");
				setStatus("error");
				setTimeout(() => {
					setLocation("/dashboard");
				}, 2000);
				return;
			}

			if (!code) {
				console.error("No authorization code received");
				toast.error("Authentication failed", "No authorization code received from Google.");
				setStatus("error");
				setTimeout(() => {
					setLocation("/dashboard");
				}, 2000);
				return;
			}

			try {
				// Exchange code for access token
				const tokenData = await exchangeCodeForToken(code);

				if (!tokenData) {
					throw new Error("Failed to exchange code for token");
				}

				// Store token
				storeGoogleToken(tokenData);

				toast.success("Google connected!", "You can now automatically create Google Meet links.");
				setStatus("success");

				// Redirect to dashboard after a short delay
				setTimeout(() => {
					setLocation("/dashboard");
				}, 1500);
			} catch (error) {
				console.error("Error handling OAuth callback:", error);
				toast.error("Authentication failed", "Failed to complete Google authentication.");
				setStatus("error");
				setTimeout(() => {
					setLocation("/dashboard");
				}, 2000);
			}
		}

		handleCallback();
	}, [setLocation]);

	return (
		<AuthCard
			title="Connecting Google Account"
			description="Please wait while we complete the authentication..."
		>
			<div className="flex flex-col items-center justify-center py-8">
				{status === "loading" && (
					<>
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
						<p className="text-sm text-muted-foreground">Authenticating with Google...</p>
					</>
				)}
				{status === "success" && (
					<>
						<div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
							<svg
								className="h-6 w-6 text-green-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<p className="text-sm text-muted-foreground">Successfully connected! Redirecting...</p>
					</>
				)}
				{status === "error" && (
					<>
						<div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
							<svg
								className="h-6 w-6 text-red-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</div>
						<p className="text-sm text-muted-foreground">Authentication failed. Redirecting...</p>
					</>
				)}
			</div>
		</AuthCard>
	);
}

