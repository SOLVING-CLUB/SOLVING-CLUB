import { getStoredGoogleToken } from "./google-oauth";
import { getSupabaseClient } from "../supabase";

export interface GoogleMeetLinkResponse {
	meetingUri?: string;
	entryPoint?: {
		uri?: string;
		entryPointType?: string;
	};
}

/**
 * Creates a Google Meet link using Google Calendar API
 * Requires OAuth 2.0 authentication token
 */
export async function createGoogleMeetLink(
	title: string,
	startTime: Date,
	endTime: Date,
	description?: string
): Promise<string | null> {
	try {
		// Get OAuth access token from Supabase session
		const accessToken = await getStoredGoogleToken();
		
		if (!accessToken) {
			console.warn("No Google OAuth token found. User needs to authenticate.");
			const { data: { session } } = await getSupabaseClient().auth.getSession();
			console.warn("Session details:", {
				hasSession: !!session,
				provider: session?.provider,
				hasProviderToken: !!session?.provider_token
			});
			return null;
		}

		console.log("Using Google access token to create calendar event with Meet link");

		// Generate a unique request ID
		const requestId = `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`;

		// Format dates for Google Calendar API (RFC3339 format)
		const formatGoogleDate = (date: Date) => {
			return date.toISOString();
		};

		// Get user's timezone
		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		// Create calendar event with Google Meet link
		const eventData = {
			summary: title,
			description: description || "",
			start: {
				dateTime: formatGoogleDate(startTime),
				timeZone: timeZone,
			},
			end: {
				dateTime: formatGoogleDate(endTime),
				timeZone: timeZone,
			},
			conferenceData: {
				createRequest: {
					requestId: requestId,
					conferenceSolutionKey: {
						type: "hangoutsMeet",
					},
				},
			},
		};

		const response = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${accessToken}`,
				},
				body: JSON.stringify(eventData),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error("Google Calendar API error:", {
				status: response.status,
				statusText: response.statusText,
				error: errorData
			});
			
			// Log detailed error information
			if (errorData.error) {
				console.error("Google API Error Details:", {
					code: errorData.error.code,
					message: errorData.error.message,
					errors: errorData.error.errors
				});
			}
			
			// If token is invalid, user needs to re-authenticate
			if (response.status === 401) {
				console.warn("OAuth token invalid or expired. User needs to re-authenticate.");
				return null;
			}
			
			// 403 Forbidden usually means:
			// 1. Missing required scopes
			// 2. Calendar API not enabled in Google Cloud Console
			// 3. OAuth consent screen not verified/published
			if (response.status === 403) {
				console.error("403 Forbidden - Possible causes:");
				console.error("1. Calendar API not enabled in Google Cloud Console");
				console.error("2. Missing required OAuth scopes (calendar, calendar.events)");
				console.error("3. OAuth consent screen needs verification/publishing");
				console.error("4. User hasn't granted Calendar permissions");
				
				// Check if it's a scope issue
				if (errorData.error?.message?.includes("scope") || errorData.error?.message?.includes("permission")) {
					console.error("This appears to be a scope/permission issue. User may need to re-authenticate with proper scopes.");
				}
				
				return null;
			}
			
			throw new Error(`Failed to create Google Meet link: ${response.statusText}`);
		}

		const event = await response.json();
		
		// Extract Google Meet link from response
		if (event.conferenceData?.entryPoints?.[0]?.uri) {
			return event.conferenceData.entryPoints[0].uri;
		}

		// Fallback: try to extract from hangoutLink
		if (event.hangoutLink) {
			return event.hangoutLink;
		}

		return null;
	} catch (error) {
		console.error("Error creating Google Meet link:", error);
		return null;
	}
}

/**
 * Generate a Google Meet link using Supabase Edge Function
 * This avoids CORS issues by calling Google's API server-side
 */
export async function generateMeetLinkViaAPI(): Promise<string | null> {
	try {
		const supabase = getSupabaseClient();
		
		// Get current session to verify user is authenticated
		const { data: { session }, error: sessionError } = await supabase.auth.getSession();
		
		if (sessionError || !session) {
			console.warn("No session found. User needs to authenticate.");
			return null;
		}

		// Check if user signed in with Google
		const isGoogleUser = session.provider === "google" || 
		                    session.user?.app_metadata?.provider === "google" ||
		                    session.user?.identities?.some((id: any) => id.provider === "google");
		
		if (!isGoogleUser && !session.provider_token) {
			console.warn("User is not authenticated with Google");
			return null;
		}

		console.log("Calling Supabase Edge Function to create Meet link (avoids CORS)");

		// Get the Google provider token to pass to the Edge Function
		const providerToken = session.provider_token || await getStoredGoogleToken();
		
		if (!providerToken) {
			console.warn("No Google provider token available");
			return null;
		}

		// Call Supabase Edge Function instead of Google API directly
		// This avoids CORS issues
		// Pass the provider token in the request body
		const { data, error } = await supabase.functions.invoke('create-meet-link', {
			headers: {
				Authorization: `Bearer ${session.access_token}`,
			},
			body: {
				providerToken: providerToken,
			},
		});

		if (error) {
			console.error("Error calling Edge Function:", error);
			return null;
		}

		if (data?.error) {
			console.error("Edge Function error:", data.error);
			return null;
		}

		if (data?.meetLink) {
			console.log("Successfully generated Meet link via Edge Function:", data.meetLink);
			return data.meetLink;
		}

		console.warn("No Meet link in Edge Function response");
		return null;

	} catch (error) {
		console.error("Error generating Meet link:", error);
		return null;
	}
}

