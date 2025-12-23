import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { ProjectMeetingWithParticipants } from "@/lib/types/meetings";
import { createProjectMeeting, getMeetingConflicts, getProjectMeetings, updateProjectMeetingNotes } from "@/lib/api/meetings";
import { Calendar, Clock, Plus, Users, Video, AlertTriangle } from "lucide-react";

interface ProjectMeetingsTabProps {
	projectId: string;
}

interface Member {
	id: string;
	full_name?: string;
	avatar_url?: string;
}

export function ProjectMeetingsTab({ projectId }: ProjectMeetingsTabProps) {
	const supabase = getSupabaseClient();
	const [meetings, setMeetings] = useState<ProjectMeetingWithParticipants[]>([]);
	const [members, setMembers] = useState<Member[]>([]);
	const [loading, setLoading] = useState(false);

	const [isScheduleOpen, setIsScheduleOpen] = useState(false);
	const [title, setTitle] = useState("");
	const [date, setDate] = useState("");
	const [time, setTime] = useState("");
	const [duration, setDuration] = useState(60);
	const [meetingLink, setMeetingLink] = useState("");
	const [notes, setNotes] = useState("");
	const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
	const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);

	const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
	const [editingNotesValue, setEditingNotesValue] = useState("");

	useEffect(() => {
		loadData();
	}, [projectId]);

	async function loadData() {
		setLoading(true);
		try {
			const [meetingsData, membersData] = await Promise.all([
				getProjectMeetings(projectId),
				loadMembers(),
			]);
			setMeetings(meetingsData);
			setMembers(membersData);
		} catch (err) {
			console.error(err);
			toast.error("Error", "Failed to load meetings");
		} finally {
			setLoading(false);
		}
	}

	async function loadMembers(): Promise<Member[]> {
		const { data: memberRows, error } = await supabase
			.from("project_members")
			.select("*")
			.eq("project_id", projectId);

		if (error) {
			console.error("Error loading members", error);
			return [];
		}

		const baseList = (memberRows as Array<{ user_id: string }> | null) ?? [];
		if (baseList.length === 0) return [];

		const ids = Array.from(new Set(baseList.map((m) => m.user_id)));
		const { data: profiles, error: profilesError } = await supabase
			.from("profiles")
			.select("id, full_name, avatar_url")
			.in("id", ids);

		if (profilesError) {
			console.error("Error loading member profiles", profilesError);
			return [];
		}

		const map = (profiles ?? []).reduce((acc, p) => {
			acc[p.id as string] = p;
			return acc;
		}, {} as Record<string, { id: string; full_name?: string; avatar_url?: string }>);

		return ids.map((id) => ({
			id,
			full_name: map[id]?.full_name,
			avatar_url: map[id]?.avatar_url,
		}));
	}

	const now = new Date();
	const { upcoming, past } = useMemo(() => {
		const upcomingMeetings: ProjectMeetingWithParticipants[] = [];
		const pastMeetings: ProjectMeetingWithParticipants[] = [];

		for (const m of meetings) {
			if (new Date(m.scheduled_at) >= now) {
				upcomingMeetings.push(m);
			} else {
				pastMeetings.push(m);
			}
		}

		upcomingMeetings.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
		pastMeetings.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

		return { upcoming: upcomingMeetings, past: pastMeetings };
	}, [meetings, now]);

	const upcomingCount = upcoming.length;
	const pastCount = past.length;
	const thisWeekCount = upcoming.filter((m) => {
		const d = new Date(m.scheduled_at);
		const diffDays = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
		return diffDays >= 0 && diffDays <= 7;
	}).length;

	function resetForm() {
		setTitle("");
		setDate("");
		setTime("");
		setDuration(60);
		setMeetingLink("");
		setNotes("");
		setSelectedParticipantIds([]);
		setConflictWarnings([]);
	}

	function toggleParticipant(id: string) {
		setSelectedParticipantIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
	}

	async function checkConflicts() {
		setConflictWarnings([]);
		if (!date || !time || !duration || selectedParticipantIds.length === 0) {
			return;
		}
		const scheduledDate = new Date(`${date}T${time}:00`);
		if (isNaN(scheduledDate.getTime())) return;

		try {
			const conflicts = await getMeetingConflicts(projectId, selectedParticipantIds, scheduledDate, duration);
			if (conflicts.length > 0) {
				const messages = conflicts.map((c) => {
					const start = new Date(c.scheduled_at);
					const end = new Date(start.getTime() + c.duration_minutes * 60_000);
					const timeRange = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
					return `${c.participant_name || 'A participant'} is already in "${c.meeting_title}" from ${timeRange}`;
				});
				setConflictWarnings(messages);
				toast.warning("Scheduling conflict", messages[0]);
			}
		} catch (err) {
			console.error(err);
		}
	}

	async function handleSchedule() {
		if (!title.trim() || !date || !time || !meetingLink.trim()) {
			toast.error("Validation Error", "Title, date, time, and meeting link are required");
			return;
		}

		const scheduledDate = new Date(`${date}T${time}:00`);
		if (isNaN(scheduledDate.getTime())) {
			toast.error("Validation Error", "Invalid date or time");
			return;
		}

		setSaving(true);
		try {
			await checkConflicts();
			await createProjectMeeting({
				project_id: projectId,
				title: title.trim(),
				scheduled_at: scheduledDate,
				duration_minutes: duration,
				meeting_link: meetingLink.trim(),
				notes: notes.trim() || undefined,
				participant_ids: selectedParticipantIds,
			});

			toast.success("Meeting scheduled", "Your meeting has been created");
			setIsScheduleOpen(false);
			resetForm();
			await loadData();
		} catch (err) {
			console.error(err);
			toast.error("Error", "Failed to schedule meeting");
		} finally {
			setSaving(false);
		}
	}

	function handleStartEditNotes(meeting: ProjectMeetingWithParticipants) {
		setEditingNotesId(meeting.id);
		setEditingNotesValue(meeting.notes ?? "");
	}

	async function handleSaveNotes() {
		if (!editingNotesId) return;
		try {
			await updateProjectMeetingNotes(editingNotesId, editingNotesValue);
			toast.success("Notes updated", "Meeting notes have been saved");
			setEditingNotesId(null);
			setEditingNotesValue("");
			await loadData();
		} catch (err) {
			console.error(err);
			toast.error("Error", "Failed to update notes");
		}
	}

	return (
		<div className="space-y-6">
			{/* Summary / Header */}
			<Card>
				<CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-2 text-xl">
							<Calendar className="h-5 w-5" />
							Project Meetings
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							Schedule meetings, see upcoming calls, and review meeting history.
						</p>
					</div>
					<Dialog open={isScheduleOpen} onOpenChange={(open) => { setIsScheduleOpen(open); if (!open) resetForm(); }}>
						<DialogTrigger asChild>
							<Button>
								<Plus className="h-4 w-4 mr-2" />
								Schedule Meeting
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Schedule Meeting</DialogTitle>
								<DialogDescription>
									Create a new meeting for this project. Participants will be able to join via the link.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="meeting-title">Title *</Label>
									<Input
										id="meeting-title"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="e.g. Sprint Planning"
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="meeting-date">Date *</Label>
										<Input
											id="meeting-date"
											type="date"
											value={date}
											onChange={(e) => setDate(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="meeting-time">Start time *</Label>
										<Input
											id="meeting-time"
											type="time"
											value={time}
											onChange={(e) => setTime(e.target.value)}
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="meeting-duration">Duration (minutes) *</Label>
									<Input
										id="meeting-duration"
										type="number"
										min={15}
										step={15}
										value={duration}
										onChange={(e) => setDuration(parseInt(e.target.value || "0", 10))}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="meeting-link">Meeting link *</Label>
									<Input
										id="meeting-link"
										type="url"
										value={meetingLink}
										onChange={(e) => setMeetingLink(e.target.value)}
										placeholder="https://zoom.us/j/..."
									/>
									<p className="text-xs text-muted-foreground">
										Every scheduled meeting stores its own link, even if you reuse the same room.
									</p>
								</div>
								<div className="space-y-2">
									<Label>Participants</Label>
									<div className="flex flex-wrap gap-2">
										{members.length === 0 && (
											<p className="text-xs text-muted-foreground">No members found for this project.</p>
										)}
										{members.map((m) => {
											const selected = selectedParticipantIds.includes(m.id);
											const conflicted = conflictWarnings.some((msg) =>
												msg.toLowerCase().includes((m.full_name || "").toLowerCase()),
											);
											return (
												<button
													key={m.id}
													type="button"
													onClick={() => toggleParticipant(m.id)}
													className={`px-2 py-1 rounded-full border text-xs flex items-center gap-1 ${
														selected
															? "bg-primary text-primary-foreground border-primary"
															: "bg-background text-foreground border-border"
													} ${conflicted ? "ring-2 ring-amber-500" : ""}`}
												>
													<Users className="h-3 w-3" />
													<span>{m.full_name || "Member"}</span>
												</button>
											);
										})}
									</div>
									{conflictWarnings.length > 0 && (
										<div className="mt-2 space-y-1 text-xs text-amber-600 dark:text-amber-400">
											<div className="flex items-center gap-1 font-medium">
												<AlertTriangle className="h-3 w-3" />
												<span>Some participants have conflicts:</span>
											</div>
											<ul className="list-disc list-inside">
												{conflictWarnings.map((msg, idx) => (
													<li key={idx}>{msg}</li>
												))}
											</ul>
										</div>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="meeting-notes">Initial notes</Label>
									<Textarea
										id="meeting-notes"
										rows={3}
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										placeholder="Optional context or agenda..."
									/>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setIsScheduleOpen(false)} disabled={saving}>
									Cancel
								</Button>
								<Button onClick={handleSchedule} disabled={saving}>
									{saving ? "Scheduling..." : "Schedule"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div>
						<div className="text-2xl font-semibold">{upcomingCount}</div>
						<p className="text-sm text-muted-foreground">Upcoming meetings</p>
					</div>
					<div>
						<div className="text-2xl font-semibold">{thisWeekCount}</div>
						<p className="text-sm text-muted-foreground">Meetings this week</p>
					</div>
					<div>
						<div className="text-2xl font-semibold">{pastCount}</div>
						<p className="text-sm text-muted-foreground">Past meetings</p>
					</div>
				</CardContent>
			</Card>

			{/* Upcoming Meetings */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5" />
						Upcoming Meetings
					</CardTitle>
				</CardHeader>
				<CardContent>
					{loading && meetings.length === 0 ? (
						<p className="text-sm text-muted-foreground">Loading meetings...</p>
					) : upcoming.length === 0 ? (
						<p className="text-sm text-muted-foreground">No upcoming meetings scheduled.</p>
					) : (
						<div className="space-y-3">
							{upcoming.map((m) => {
								const start = new Date(m.scheduled_at);
								const end = new Date(start.getTime() + m.duration_minutes * 60_000);
								const isNow = start <= now && end >= now;
								return (
									<div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg">
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<span className="font-medium">{m.title}</span>
												{isNow && (
													<Badge className="bg-emerald-600 text-white">Happening now</Badge>
												)}
											</div>
											<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
												<span>
													{start.toLocaleDateString()} •{" "}
													{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –
													{end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
												</span>
												<span>• {m.duration_minutes} min</span>
												{m.participants.length > 0 && (
													<span className="flex items-center gap-1">
														<Users className="h-3 w-3" />
														{m.participants
															.map((p) => {
																const member = members.find((mm) => mm.id === p.user_id);
																return member?.full_name || "Member";
															})
															.join(", ")}
													</span>
												)}
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Button asChild variant="default" size="sm">
												<a href={m.meeting_link} target="_blank" rel="noreferrer">
													<Video className="h-4 w-4 mr-1" />
													Join
												</a>
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Meeting History */}
			<Card>
				<CardHeader>
					<CardTitle>Meeting History</CardTitle>
				</CardHeader>
				<CardContent>
					{past.length === 0 ? (
						<p className="text-sm text-muted-foreground">No past meetings yet.</p>
					) : (
						<div className="space-y-3">
							{past.map((m) => {
								const start = new Date(m.scheduled_at);
								const end = new Date(start.getTime() + m.duration_minutes * 60_000);
								const isEditing = editingNotesId === m.id;
								return (
									<div key={m.id} className="p-3 border rounded-lg space-y-2">
										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													<span className="font-medium">{m.title}</span>
													<span className="text-xs text-muted-foreground">
														{start.toLocaleDateString()} •{" "}
														{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –
														{end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
													</span>
												</div>
												{m.participants.length > 0 && (
													<div className="flex items-center gap-1 text-xs text-muted-foreground">
														<Users className="h-3 w-3" />
														<span>
															{m.participants
																.map((p) => {
																	const member = members.find((mm) => mm.id === p.user_id);
																	return member?.full_name || "Member";
																})
																.join(", ")}
														</span>
													</div>
												)}
											</div>
											<Button asChild variant="outline" size="sm">
												<a href={m.meeting_link} target="_blank" rel="noreferrer">
													<Video className="h-4 w-4 mr-1" />
													Join
												</a>
											</Button>
										</div>
										<div className="space-y-1">
											<div className="flex items-center justify-between">
												<span className="text-xs font-medium text-muted-foreground">
													Notes
												</span>
											</div>
											{isEditing ? (
												<div className="space-y-2">
													<Textarea
														rows={3}
														value={editingNotesValue}
														onChange={(e) => setEditingNotesValue(e.target.value)}
													/>
													<div className="flex justify-end gap-2">
														<Button
															variant="outline"
															size="sm"
															onClick={() => {
																setEditingNotesId(null);
																setEditingNotesValue("");
															}}
														>
															Cancel
														</Button>
														<Button size="sm" onClick={handleSaveNotes}>
															Save
														</Button>
													</div>
												</div>
											) : (
												<div className="flex items-start justify-between gap-2">
													<p className="text-sm text-muted-foreground whitespace-pre-wrap">
														{m.notes?.trim() || "No notes yet."}
													</p>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleStartEditNotes(m)}
													>
														Edit
													</Button>
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}


