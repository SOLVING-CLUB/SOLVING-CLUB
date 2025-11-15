import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { getSupabaseClient } from "@/lib/supabase";
import { createMeeting, type CreateMeetingInput } from "@/lib/api/meetings";
import { toast } from "sonner";
import { isGoogleAuthenticated, initiateGoogleAuth } from "@/lib/api/google-oauth";
import { CalendarIcon, Users, Clock, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface MeetingSchedulerProps {
	projectId?: string;
	onMeetingCreated?: () => void;
	trigger?: React.ReactNode;
}

interface Profile {
	id: string;
	full_name?: string;
	avatar_url?: string;
	email?: string;
}

export function MeetingScheduler({ projectId, onMeetingCreated, trigger }: MeetingSchedulerProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [availableMembers, setAvailableMembers] = useState<Profile[]>([]);
	
	const [formData, setFormData] = useState<CreateMeetingInput>({
		title: "",
		description: "",
		meeting_date: "",
		duration_minutes: 60,
		google_meet_link: "",
		participant_ids: [],
	});

	const [selectedDate, setSelectedDate] = useState<Date>();
	const [selectedTime, setSelectedTime] = useState("");
	const [googleConnected, setGoogleConnected] = useState(false);

	const supabase = getSupabaseClient();

	useEffect(() => {
		// Check if Google is connected
		(async () => {
			const connected = await isGoogleAuthenticated();
			setGoogleConnected(connected);
		})();
	}, [open]);

	useEffect(() => {
		if (open) {
			loadAvailableMembers();
		}
	}, [open, projectId]);

	async function loadAvailableMembers() {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;

		if (projectId) {
			// Load project members - use two-step approach like ProjectDetailPage
			const { data: memberRows, error: membersError } = await supabase
				.from("project_members")
				.select("user_id")
				.eq("project_id", projectId);

			if (membersError) {
				console.error("Error loading project members:", membersError);
				return;
			}

			if (memberRows && memberRows.length > 0) {
				// Get unique user IDs
				const userIds = Array.from(new Set(memberRows.map(m => m.user_id)));
				
				// Load profiles for these users
				const { data: profiles, error: profilesError } = await supabase
					.from("profiles")
					.select("id, full_name, avatar_url, email")
					.in("id", userIds);

				if (profilesError) {
					console.error("Error loading profiles:", profilesError);
					return;
				}

				// Filter out current user and set available members
				if (profiles) {
					const available = profiles
						.filter(p => p.id !== user.id)
						.map(p => ({
							id: p.id,
							full_name: p.full_name,
							avatar_url: p.avatar_url,
							email: p.email,
						}));
					setAvailableMembers(available);
				}
			} else {
				setAvailableMembers([]);
			}
		} else {
			// Load all profiles (for global meetings)
			const { data: profiles } = await supabase
				.from("profiles")
				.select("id, full_name, avatar_url, email")
				.neq("id", user.id)
				.order("full_name");

			if (profiles) {
				setAvailableMembers(profiles);
			}
		}
	}

	function handleDateSelect(date: Date | undefined) {
		setSelectedDate(date);
		if (date) {
			updateMeetingDateTime(date, selectedTime || "09:00");
		}
	}

	function handleTimeChange(time: string) {
		setSelectedTime(time);
		if (selectedDate) {
			updateMeetingDateTime(selectedDate, time);
		}
	}

	function updateMeetingDateTime(date: Date, time: string) {
		// Get local date components to avoid timezone issues
		const year = date.getFullYear();
		const month = date.getMonth();
		const day = date.getDate();
		
		// Parse time (HH:MM format)
		const [hours, minutes] = time.split(':').map(Number);
		
		// Create date in local timezone, then convert to ISO
		// Using Date constructor with local components ensures correct timezone handling
		const localDate = new Date(year, month, day, hours, minutes, 0);
		const isoString = localDate.toISOString();
		
		console.log(`Setting meeting date: Local=${localDate.toLocaleString()}, ISO=${isoString}`);
		
		setFormData(prev => ({
			...prev,
			meeting_date: isoString,
		}));
	}

	function toggleParticipant(userId: string) {
		setFormData(prev => ({
			...prev,
			participant_ids: prev.participant_ids.includes(userId)
				? prev.participant_ids.filter(id => id !== userId)
				: [...prev.participant_ids, userId],
		}));
	}

	async function handleSubmit() {
		if (!formData.title.trim()) {
			toast.error("Meeting title is required");
			return;
		}

		if (!formData.meeting_date) {
			toast.error("Please select a date and time");
			return;
		}

		if (formData.participant_ids.length === 0) {
			toast.error("Please select at least one participant");
			return;
		}

		setLoading(true);
		console.log("Creating meeting with date:", formData.meeting_date, "Local time:", new Date(formData.meeting_date).toLocaleString());
		const meeting = await createMeeting({
			...formData,
			project_id: projectId,
		});

		if (meeting) {
			setOpen(false);
			setFormData({
				title: "",
				description: "",
				meeting_date: "",
				duration_minutes: 60,
				google_meet_link: "",
				participant_ids: [],
			});
			setSelectedDate(undefined);
			setSelectedTime("");
			onMeetingCreated?.();
		}

		setLoading(false);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button>
						<CalendarIcon className="h-4 w-4 mr-2" />
						Schedule Meeting
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Schedule Meeting</DialogTitle>
					<DialogDescription>
						Create a new meeting and invite team members
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="title">Meeting Title *</Label>
						<Input
							id="title"
							value={formData.title}
							onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
							placeholder="Team Standup, Project Review, etc."
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
							placeholder="Meeting agenda, topics to discuss..."
							rows={3}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Date *</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className={cn(
											"w-full justify-start text-left font-normal",
											!selectedDate && "text-muted-foreground"
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={selectedDate}
										onSelect={handleDateSelect}
										disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>

						<div className="space-y-2">
							<Label htmlFor="time">Time *</Label>
							<Input
								id="time"
								type="time"
								value={selectedTime}
								onChange={(e) => handleTimeChange(e.target.value)}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="duration">Duration (minutes)</Label>
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4" />
							<Input
								id="duration"
								type="number"
								min="15"
								max="480"
								step="15"
								value={formData.duration_minutes}
								onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="google_meet_link">Google Meet Link</Label>
							{googleConnected ? (
								<div className="flex items-center gap-1 text-xs text-green-600">
									<CheckCircle2 className="h-3 w-3" />
									<span>Connected via Google Sign In</span>
								</div>
							) : (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={async () => {
										try {
											await initiateGoogleAuth();
										} catch (error) {
											toast.error("Failed to connect Google", "Please try again.");
										}
									}}
									className="text-xs"
								>
									<ExternalLink className="h-3 w-3 mr-1" />
									Connect Google
								</Button>
							)}
						</div>
						{googleConnected ? (
							<div className="space-y-2">
								<Input
									id="google_meet_link"
									type="url"
									value={formData.google_meet_link || ""}
									onChange={(e) => setFormData(prev => ({ ...prev, google_meet_link: e.target.value }))}
									placeholder="Will be auto-generated if left empty"
								/>
								<p className="text-xs text-muted-foreground">
									Leave empty to automatically generate a Google Meet link using your Google account, or paste your own link
								</p>
							</div>
						) : (
							<div className="border rounded-lg p-4 bg-muted/50">
								<div className="flex items-start gap-2">
									<AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
									<div className="flex-1">
										<p className="text-xs text-muted-foreground">
											Sign in with Google during login/signup to automatically generate Google Meet links, or connect your Google account here.
										</p>
									</div>
								</div>
							</div>
						)}
					</div>

					<div className="space-y-2">
						<Label>Participants *</Label>
						<div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
							{availableMembers.length === 0 ? (
								<p className="text-sm text-muted-foreground">No members available</p>
							) : (
								availableMembers.map((member) => (
									<div key={member.id} className="flex items-center space-x-2">
										<Checkbox
											id={`member-${member.id}`}
											checked={formData.participant_ids.includes(member.id)}
											onCheckedChange={() => toggleParticipant(member.id)}
										/>
										<Label
											htmlFor={`member-${member.id}`}
											className="flex-1 cursor-pointer flex items-center gap-2"
										>
											{member.avatar_url ? (
												<img
													src={member.avatar_url}
													alt={member.full_name || "User"}
													className="h-6 w-6 rounded-full"
												/>
											) : (
												<div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
													<Users className="h-3 w-3" />
												</div>
											)}
											<span>{member.full_name || member.email || "Unknown User"}</span>
										</Label>
									</div>
								))
							)}
						</div>
						{formData.participant_ids.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-2">
								{formData.participant_ids.map((userId) => {
									const member = availableMembers.find(m => m.id === userId);
									return member ? (
										<Badge key={userId} variant="secondary">
											{member.full_name || member.email || "Unknown"}
										</Badge>
									) : null;
								})}
							</div>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={loading}>
						{loading ? "Creating..." : "Create Meeting"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

