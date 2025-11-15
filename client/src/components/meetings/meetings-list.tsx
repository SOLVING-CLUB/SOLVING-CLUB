import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMeetings, type Meeting } from "@/lib/api/meetings";
import { getSupabaseClient } from "@/lib/supabase";
import { format } from "date-fns";
import { CalendarIcon, Users, Clock, ExternalLink, Trash2 } from "lucide-react";
import { MeetingScheduler } from "./meeting-scheduler";
import { toast } from "sonner";
import { deleteMeeting } from "@/lib/api/meetings";

interface MeetingsListProps {
	projectId?: string;
}

export function MeetingsList({ projectId }: MeetingsListProps) {
	const [meetings, setMeetings] = useState<Meeting[]>([]);
	const [loading, setLoading] = useState(false);
	const supabase = getSupabaseClient();

	useEffect(() => {
		loadMeetings();

		// Subscribe to real-time updates
		let channel: ReturnType<typeof supabase.channel> | null = null;
		
		(async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			channel = supabase
				.channel(`meetings-${projectId || 'global'}`)
				.on(
					'postgres_changes',
					{
						event: '*',
						schema: 'public',
						table: 'meetings',
						filter: projectId ? `project_id=eq.${projectId}` : undefined,
					},
					() => {
						loadMeetings();
					}
				)
				.on(
					'postgres_changes',
					{
						event: '*',
						schema: 'public',
						table: 'meeting_participants',
					},
					() => {
						loadMeetings();
					}
				)
				.subscribe();

		})();

		return () => {
			if (channel) {
				supabase.removeChannel(channel);
			}
		};
	}, [projectId, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

	async function loadMeetings() {
		setLoading(true);
		try {
			const data = await getMeetings({
				project_id: projectId,
				upcoming: true,
			});
			setMeetings(data || []);
		} catch (error) {
			console.error("Error loading meetings:", error);
			toast.error("Failed to load meetings");
			setMeetings([]);
		} finally {
			setLoading(false);
		}
	}

	async function handleDelete(meetingId: string) {
		if (!confirm("Are you sure you want to delete this meeting?")) {
			return;
		}

		const success = await deleteMeeting(meetingId);
		if (success) {
			loadMeetings();
		}
	}

	const [currentUserId, setCurrentUserId] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			const { data: { user } } = await supabase.auth.getUser();
			setCurrentUserId(user?.id || null);
		})();
	}, [supabase]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold">Upcoming Meetings</h3>
					<p className="text-sm text-muted-foreground">
						Schedule and manage team meetings
					</p>
				</div>
				<MeetingScheduler
					projectId={projectId}
					onMeetingCreated={loadMeetings}
				/>
			</div>

			{loading ? (
				<div className="text-center py-8 text-muted-foreground">Loading meetings...</div>
			) : meetings.length === 0 ? (
				<Card>
					<CardContent className="py-8 text-center text-muted-foreground">
						<CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<p>No upcoming meetings</p>
						<p className="text-sm mt-2">Schedule a meeting to get started</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-3">
					{meetings.map((meeting) => {
						const meetingDate = new Date(meeting.meeting_date);
						const isOrganizer = meeting.organizer_id === currentUserId;
						const participantCount = meeting.participants?.length || 0;

						return (
							<Card key={meeting.id}>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<CardTitle className="text-base">{meeting.title}</CardTitle>
											{meeting.description && (
												<CardDescription className="mt-1">
													{meeting.description}
												</CardDescription>
											)}
										</div>
										{isOrganizer && (
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={() => handleDelete(meeting.id)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										)}
									</div>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex items-center gap-4 text-sm">
										<div className="flex items-center gap-2">
											<CalendarIcon className="h-4 w-4 text-muted-foreground" />
											<span>{format(meetingDate, "PPP 'at' p")}</span>
										</div>
										<div className="flex items-center gap-2">
											<Clock className="h-4 w-4 text-muted-foreground" />
											<span>{meeting.duration_minutes} minutes</span>
										</div>
										<div className="flex items-center gap-2">
											<Users className="h-4 w-4 text-muted-foreground" />
											<span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
										</div>
									</div>

									{meeting.google_meet_link && (
										<Button
											variant="outline"
											size="sm"
											className="w-full"
											onClick={() => window.open(meeting.google_meet_link, '_blank')}
										>
											<ExternalLink className="h-4 w-4 mr-2" />
											Join Google Meet
										</Button>
									)}

									{meeting.participants && meeting.participants.length > 0 && (
										<div className="flex flex-wrap gap-2 pt-2 border-t">
											{meeting.participants.map((participant) => (
												<Badge
													key={participant.id}
													variant={participant.status === 'accepted' ? 'default' : 'secondary'}
												>
													{participant.user?.full_name || participant.user?.email || 'Unknown'}
													{participant.status !== 'accepted' && (
														<span className="ml-1 text-xs">({participant.status})</span>
													)}
												</Badge>
											))}
										</div>
									)}
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}

