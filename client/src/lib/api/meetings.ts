import { getSupabaseClient } from "../supabase";
import { toast } from "sonner";
import { createGoogleMeetLink, generateMeetLinkViaAPI } from "./google-meet";

export interface Meeting {
	id: string;
	project_id?: string;
	title: string;
	description?: string;
	meeting_date: string;
	duration_minutes: number;
	google_meet_link?: string;
	organizer_id: string;
	created_at: string;
	updated_at: string;
	organizer?: {
		full_name?: string;
		avatar_url?: string;
	};
	participants?: MeetingParticipant[];
}

export interface MeetingParticipant {
	id: string;
	meeting_id: string;
	user_id: string;
	status: 'pending' | 'accepted' | 'declined' | 'tentative';
	created_at: string;
	user?: {
		full_name?: string;
		avatar_url?: string;
		email?: string;
	};
}

export interface CreateMeetingInput {
	project_id?: string;
	title: string;
	description?: string;
	meeting_date: string;
	duration_minutes?: number;
	google_meet_link?: string;
	participant_ids: string[];
}

export async function createMeeting(input: CreateMeetingInput): Promise<Meeting | null> {
	const supabase = getSupabaseClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	if (!user) {
		toast.error("You must be logged in to create a meeting");
		return null;
	}

	// Try to automatically generate Google Meet link if not provided
	let googleMeetLink = input.google_meet_link;
	
	if (!googleMeetLink) {
		try {
			console.log("Attempting to generate Google Meet link...");
			const meetingDate = new Date(input.meeting_date);
			const durationMinutes = input.duration_minutes || 60;
			const endTime = new Date(meetingDate.getTime() + durationMinutes * 60000);

			// Check if user has Google token
			const { data: { session } } = await supabase.auth.getSession();
			if (session?.provider_token) {
				console.log("Google token found in session, attempting to generate Meet link...");
			} else {
				console.warn("No Google token found. User may need to sign in with Google.");
			}

			// Try Google Meet API directly (no Calendar needed)
			console.log("Generating Google Meet link directly...");
			googleMeetLink = await generateMeetLinkViaAPI();

			if (googleMeetLink) {
				console.log("Successfully generated Google Meet link:", googleMeetLink);
			} else {
				console.warn("Could not automatically generate Google Meet link. User can add manually.");
			}
		} catch (error) {
			console.error("Error generating Google Meet link:", error);
			// Continue without Meet link - user can add manually
		}
	}

	// Create meeting
	const { data: meeting, error: meetingError } = await supabase
		.from("meetings")
		.insert({
			project_id: input.project_id || null,
			title: input.title,
			description: input.description || null,
			meeting_date: input.meeting_date,
			duration_minutes: input.duration_minutes || 60,
			google_meet_link: googleMeetLink || null,
			organizer_id: user.id,
		})
		.select()
		.single();

	if (meetingError) {
		console.error("Error creating meeting:", meetingError);
		toast.error("Failed to create meeting");
		return null;
	}

	// Add participants (including organizer)
	const participantIds = [...new Set([user.id, ...input.participant_ids])];
	const participants = participantIds.map(userId => ({
		meeting_id: meeting.id,
		user_id: userId,
		status: userId === user.id ? 'accepted' as const : 'pending' as const,
	}));

	const { error: participantsError } = await supabase
		.from("meeting_participants")
		.insert(participants);

	if (participantsError) {
		console.error("Error adding participants:", participantsError);
		// Meeting was created, but participants failed - still return meeting
		toast.warning("Meeting created but failed to add some participants");
	}

	toast.success("Meeting created successfully");
	return meeting;
}

export async function getMeetings(filters?: {
	project_id?: string;
	upcoming?: boolean;
}): Promise<Meeting[]> {
	const supabase = getSupabaseClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	if (!user) {
		console.log("No user found");
		return [];
	}

	// First, get meetings - RLS will filter based on organizer or participant status
	let query = supabase
		.from("meetings")
		.select("*")
		.order("meeting_date", { ascending: true });

	if (filters?.project_id) {
		query = query.eq("project_id", filters.project_id);
	}

	if (filters?.upcoming) {
		// Show meetings that haven't ended yet (meeting_date + duration > now)
		// This includes meetings scheduled for today that haven't finished
		const now = new Date();
		// We'll filter in JavaScript after fetching, since Supabase doesn't easily support
		// arithmetic in WHERE clauses. Alternatively, we can use a function, but for simplicity
		// we'll get meetings from today onwards and filter client-side
		const startOfToday = new Date();
		startOfToday.setHours(0, 0, 0, 0);
		query = query.gte("meeting_date", startOfToday.toISOString());
	}

	const { data: meetingsData, error } = await query;

	if (error) {
		console.error("Error fetching meetings:", error);
		console.error("Error details:", JSON.stringify(error, null, 2));
		return [];
	}

	if (!meetingsData || meetingsData.length === 0) {
		console.log("No meetings found for user:", user.id, "project:", filters?.project_id);
		return [];
	}

	console.log("Found meetings:", meetingsData.length);

	// Filter out meetings that have already ended (if upcoming filter is set)
	let filteredMeetings = meetingsData;
	if (filters?.upcoming) {
		const now = new Date();
		console.log("Filtering upcoming meetings. Current time:", now.toISOString());
		filteredMeetings = meetingsData.filter(meeting => {
			const meetingDate = new Date(meeting.meeting_date);
			const meetingEnd = new Date(meetingDate.getTime() + (meeting.duration_minutes || 60) * 60000);
			// Show meetings that haven't ended yet (either starting in future or currently happening)
			const isUpcoming = meetingEnd > now;
			if (!isUpcoming) {
				console.log(`Excluding meeting "${meeting.title}": start=${meetingDate.toISOString()}, end=${meetingEnd.toISOString()}, now=${now.toISOString()}`);
			}
			return isUpcoming;
		});
		console.log(`Filtered to ${filteredMeetings.length} upcoming meetings out of ${meetingsData.length} total`);
	}

	// Get organizer profiles
	const organizerIds = [...new Set(filteredMeetings.map(m => m.organizer_id))];
	const { data: organizerProfiles } = await supabase
		.from("profiles")
		.select("id, full_name, avatar_url")
		.in("id", organizerIds);

	const organizerMap = (organizerProfiles || []).reduce((acc, p) => {
		acc[p.id] = p;
		return acc;
	}, {} as Record<string, { id: string; full_name?: string; avatar_url?: string }>);

	// Load participants for each meeting
	const meetingsWithParticipants = await Promise.all(
		filteredMeetings.map(async (meeting) => {
			const { data: participants } = await supabase
				.from("meeting_participants")
				.select("*")
				.eq("meeting_id", meeting.id);

			// Get participant profiles
			let participantsWithProfiles: MeetingParticipant[] = [];
			if (participants && participants.length > 0) {
				const participantUserIds = participants.map(p => p.user_id);
				const { data: participantProfiles } = await supabase
					.from("profiles")
					.select("id, full_name, avatar_url, email")
					.in("id", participantUserIds);

				const participantProfileMap = (participantProfiles || []).reduce((acc, p) => {
					acc[p.id] = p;
					return acc;
				}, {} as Record<string, { id: string; full_name?: string; avatar_url?: string; email?: string }>);

				participantsWithProfiles = participants.map(p => ({
					...p,
					user: participantProfileMap[p.user_id],
				}));
			}

			return {
				...meeting,
				organizer: organizerMap[meeting.organizer_id],
				participants: participantsWithProfiles,
			};
		})
	);

	return meetingsWithParticipants;
}

export async function getMeeting(meetingId: string): Promise<Meeting | null> {
	const supabase = getSupabaseClient();
	
	const { data, error } = await supabase
		.from("meetings")
		.select("*")
		.eq("id", meetingId)
		.single();

	if (error) {
		console.error("Error fetching meeting:", error);
		return null;
	}

	// Get organizer profile
	const { data: organizerProfile } = await supabase
		.from("profiles")
		.select("id, full_name, avatar_url")
		.eq("id", data.organizer_id)
		.single();

	// Load participants
	const { data: participants } = await supabase
		.from("meeting_participants")
		.select("*")
		.eq("meeting_id", meetingId);

	// Get participant profiles
	let participantsWithProfiles: MeetingParticipant[] = [];
	if (participants && participants.length > 0) {
		const participantUserIds = participants.map(p => p.user_id);
		const { data: participantProfiles } = await supabase
			.from("profiles")
			.select("id, full_name, avatar_url, email")
			.in("id", participantUserIds);

		const participantProfileMap = (participantProfiles || []).reduce((acc, p) => {
			acc[p.id] = p;
			return acc;
		}, {} as Record<string, { id: string; full_name?: string; avatar_url?: string; email?: string }>);

		participantsWithProfiles = participants.map(p => ({
			...p,
			user: participantProfileMap[p.user_id],
		}));
	}

	return {
		...data,
		organizer: organizerProfile || undefined,
		participants: participantsWithProfiles,
	};
}

export async function updateMeeting(
	meetingId: string,
	updates: Partial<CreateMeetingInput>
): Promise<boolean> {
	const supabase = getSupabaseClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	if (!user) {
		toast.error("You must be logged in to update a meeting");
		return false;
	}

	const { error } = await supabase
		.from("meetings")
		.update({
			title: updates.title,
			description: updates.description,
			meeting_date: updates.meeting_date,
			duration_minutes: updates.duration_minutes,
		})
		.eq("id", meetingId)
		.eq("organizer_id", user.id); // Ensure user is organizer

	if (error) {
		console.error("Error updating meeting:", error);
		toast.error("Failed to update meeting");
		return false;
	}

	// Update participants if provided
	if (updates.participant_ids) {
		// Remove existing participants (except organizer)
		const { error: deleteError } = await supabase
			.from("meeting_participants")
			.delete()
			.eq("meeting_id", meetingId)
			.neq("user_id", user.id);

		if (deleteError) {
			console.error("Error removing participants:", deleteError);
		}

		// Add new participants
		const participantIds = updates.participant_ids.filter(id => id !== user.id);
		if (participantIds.length > 0) {
			const participants = participantIds.map(userId => ({
				meeting_id: meetingId,
				user_id: userId,
				status: 'pending' as const,
			}));

			const { error: insertError } = await supabase
				.from("meeting_participants")
				.insert(participants);

			if (insertError) {
				console.error("Error adding participants:", insertError);
			}
		}
	}

	toast.success("Meeting updated successfully");
	return true;
}

export async function deleteMeeting(meetingId: string): Promise<boolean> {
	const supabase = getSupabaseClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	if (!user) {
		toast.error("You must be logged in to delete a meeting");
		return false;
	}

	const { error } = await supabase
		.from("meetings")
		.delete()
		.eq("id", meetingId)
		.eq("organizer_id", user.id); // Ensure user is organizer

	if (error) {
		console.error("Error deleting meeting:", error);
		toast.error("Failed to delete meeting");
		return false;
	}

	toast.success("Meeting deleted successfully");
	return true;
}

export async function updateParticipantStatus(
	meetingId: string,
	status: 'accepted' | 'declined' | 'tentative'
): Promise<boolean> {
	const supabase = getSupabaseClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	if (!user) {
		toast.error("You must be logged in");
		return false;
	}

	const { error } = await supabase
		.from("meeting_participants")
		.update({ status })
		.eq("meeting_id", meetingId)
		.eq("user_id", user.id);

	if (error) {
		console.error("Error updating participant status:", error);
		toast.error("Failed to update status");
		return false;
	}

	toast.success("Status updated");
	return true;
}

