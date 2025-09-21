"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { HoursSkeleton } from "@/components/ui/loading-states";
import { 
	Plus, 
	Calendar, 
	Users, 
	ChevronLeft,
	ChevronRight,
	Trash2,
	Pencil,
	Clock
} from "lucide-react";
import { Calendar as UiCalendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

interface CalendarAvailability {
	id: string;
	user_id: string;
	date: string; // ISO date yyyy-mm-dd
	start_time: string; // HH:MM or HH:MM:SS
	end_time: string; // HH:MM or HH:MM:SS
	title?: string;
	notes?: string;
	availability_type: 'available' | 'busy' | 'tentative';
	created_at: string;
	updated_at: string;
}

interface TeamMember {
	id: string;
	full_name: string;
	avatar_url?: string;
}

export default function HoursPage() {
	const supabase = getSupabaseBrowserClient();
	const [availabilityData, setAvailabilityData] = useState<CalendarAvailability[]>([]);
	const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
	const [loading, setLoading] = useState(false);
	const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
	const [currentUserId, setCurrentUserId] = useState<string>("");

	// Add availability dialog state
	const [isAddAvailabilityOpen, setIsAddAvailabilityOpen] = useState(false);
	const [newAvailabilityDate, setNewAvailabilityDate] = useState<Date | undefined>(undefined);
	const [newAvailabilityStart, setNewAvailabilityStart] = useState<string>("09:00");
	const [newAvailabilityEnd, setNewAvailabilityEnd] = useState<string>("17:00");
	const [newAvailabilityTitle, setNewAvailabilityTitle] = useState<string>("");
	const [newAvailabilityType, setNewAvailabilityType] = useState<'available' | 'busy' | 'tentative'>('available');
	const [newAvailabilityNotes, setNewAvailabilityNotes] = useState<string>("");

	// Edit availability dialog state
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [editingAvailabilityId, setEditingAvailabilityId] = useState<string | null>(null);
	const [editDate, setEditDate] = useState<Date | undefined>(undefined);
	const [editStart, setEditStart] = useState<string>("09:00");
	const [editEnd, setEditEnd] = useState<string>("17:00");
	const [editTitle, setEditTitle] = useState<string>("");
	const [editType, setEditType] = useState<'available' | 'busy' | 'tentative'>('available');
	const [editNotes, setEditNotes] = useState<string>("");

	// All Availability by Date state
	const [showAllByDate, setShowAllByDate] = useState(false);
	const [allViewDate, setAllViewDate] = useState<Date>(() => new Date());

	// All Availability by Member state
	const [showAllByMember, setShowAllByMember] = useState(false);
	const [memberFilterId, setMemberFilterId] = useState<string>("");

	// Helper function to format date
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', { 
			weekday: 'long', 
			month: 'short', 
			day: 'numeric' 
		});
	}

	const loadData = useCallback(async () => {
		setLoading(true);
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			setLoading(false);
			return;
		}
		setCurrentUserId(user.id);

		try {
			// Load calendar availability for the visible month
			const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).toISOString().split('T')[0];
			const last = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).toISOString().split('T')[0];
			
			const { data: availabilityData, error: availabilityError } = await supabase
				.from("calendar_availability")
				.select("*")
				.gte("date", first)
				.lte("date", last)
				.order("date", { ascending: true })
				.order("start_time", { ascending: true });

			if (availabilityError) {
				console.error("Error loading calendar availability:", availabilityError);
				if (availabilityError.code !== 'PGRST200') {
					toast.error("Error", "Failed to load calendar availability");
				}
			} else {
				setAvailabilityData(availabilityData || []);
			}

			// Load ALL team members (not just those with availability data)
			const { data: membersData, error: membersError } = await supabase
				.from("profiles")
				.select("id, full_name, avatar_url")
				.order("full_name", { ascending: true });

			if (membersError) {
				console.error("Error loading team members:", membersError);
			} else {
				console.log("Loaded team members:", membersData?.length || 0, "members");
				setTeamMembers(membersData || []);
			}
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("Error", "An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}, [calendarMonth, supabase]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	// Also refresh when month changes so calendars always show data for that month
	useEffect(() => {
		loadData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [calendarMonth]);

	// Ensure dialog opens with a sensible default date
	useEffect(() => {
		if (isAddAvailabilityOpen && !newAvailabilityDate) {
			setNewAvailabilityDate(new Date());
		}
	}, [isAddAvailabilityOpen, newAvailabilityDate]);

	useEffect(() => {
		// Auto-select current user if available, otherwise first team member
		if (!memberFilterId && currentUserId) {
			setMemberFilterId(currentUserId);
		} else if (!memberFilterId && teamMembers.length > 0) {
			setMemberFilterId(teamMembers[0].id);
		}
	}, [teamMembers, memberFilterId, currentUserId]);

	function getPlannedDurationHours(): string {
		const [sh, sm = "0"] = newAvailabilityStart.split(":");
		const [eh, em = "0"] = newAvailabilityEnd.split(":");
		const start = parseInt(sh, 10) + parseInt(sm, 10) / 60;
		const end = parseInt(eh, 10) + parseInt(em, 10) / 60;
		const dur = Math.max(0, end - start);
		return `${Math.round(dur * 10) / 10}h`;
	}

	function getEditDurationHours(): string {
		const [sh, sm = "0"] = editStart.split(":");
		const [eh, em = "0"] = editEnd.split(":");
		const start = parseInt(sh, 10) + parseInt(sm, 10) / 60;
		const end = parseInt(eh, 10) + parseInt(em, 10) / 60;
		const dur = Math.max(0, end - start);
		return `${Math.round(dur * 10) / 10}h`;
	}

	async function saveAvailability() {
		setLoading(true);
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			toast.error("Authentication Error", "You must be logged in");
			setLoading(false);
			return;
		}

		try {
			if (!newAvailabilityDate) {
				toast.error("Validation Error", "Please select a date");
				setLoading(false);
				return;
			}

			if (newAvailabilityEnd <= newAvailabilityStart) {
				toast.error("Validation Error", "End time must be after start time");
					setLoading(false);
					return;
				}

			const dateIso = toYmdLocal(newAvailabilityDate);

				const { error } = await supabase
				.from("calendar_availability")
					.insert({
						user_id: user.id,
					date: dateIso,
					start_time: newAvailabilityStart + ":00",
					end_time: newAvailabilityEnd + ":00",
					title: newAvailabilityTitle || null,
					notes: newAvailabilityNotes || null,
					availability_type: newAvailabilityType
					});

				if (error) {
				console.error("Error creating calendar availability:", error);
				toast.error("Error", "Failed to save availability");
					setLoading(false);
					return;
			}

			toast.success("Availability Saved", "Your availability has been saved successfully");
			setIsAddAvailabilityOpen(false);
			// Reset form
			setNewAvailabilityDate(undefined);
			setNewAvailabilityStart("09:00");
			setNewAvailabilityEnd("17:00");
			setNewAvailabilityTitle("");
			setNewAvailabilityType("available");
			setNewAvailabilityNotes("");
			loadData();
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("Error", "An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}

	async function deleteAvailability(availabilityId: string) {
		setLoading(true);
		try {
			const { error } = await supabase
				.from("calendar_availability")
				.delete()
				.eq("id", availabilityId);

			if (error) {
				console.error("Error deleting availability:", error);
				toast.error("Error", "Failed to delete availability");
				setLoading(false);
				return;
			}

			toast.success("Availability Deleted", "Your availability has been deleted successfully");
			loadData();
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("Error", "An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}

	function openEditDialog(a: CalendarAvailability) {
		setEditingAvailabilityId(a.id);
		setEditDate(parseYmdToLocalDate(a.date));
		setEditStart(a.start_time.slice(0, 5));
		setEditEnd(a.end_time.slice(0, 5));
		setEditTitle(a.title || "");
		setEditType(a.availability_type);
		setEditNotes(a.notes || "");
		setIsEditOpen(true);
	}

	async function updateAvailability() {
		if (!editingAvailabilityId) {
			return;
		}
		setLoading(true);
		try {
			if (!editDate) {
				toast.error("Validation Error", "Please select a date");
				setLoading(false);
				return;
			}
			if (editEnd <= editStart) {
				toast.error("Validation Error", "End time must be after start time");
				setLoading(false);
				return;
			}
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				toast.error("Authentication Error", "You must be logged in");
				setLoading(false);
				return;
			}

			const { error } = await supabase
				.from("calendar_availability")
				.update({
					date: toYmdLocal(editDate),
					start_time: editStart + ":00",
					end_time: editEnd + ":00",
					title: editTitle || null,
					notes: editNotes || null,
					availability_type: editType,
					updated_at: new Date().toISOString(),
				})
				.eq("id", editingAvailabilityId)
				.eq("user_id", user.id);

			if (error) {
				console.error("Error updating availability:", error);
				toast.error("Error", "Failed to update availability");
				setLoading(false);
				return;
			}

			toast.success("Availability Updated", "Your availability has been updated successfully");
			setIsEditOpen(false);
			setEditingAvailabilityId(null);
			loadData();
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("Error", "An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}

	function getAvailabilityForMemberDate(memberId: string, date: Date): CalendarAvailability[] {
		const ymd = toYmdLocal(date);
		return availabilityData.filter(a => a.user_id === memberId && a.date === ymd);
	}

	function getAvailabilityTypeColor(type: string): string {
		// Deprecated: kept for back-compat if referenced elsewhere
		return '';
	}

	function getAvailabilityStyle(type: 'available' | 'busy' | 'tentative' | string): { container: string; title: string } {
		switch (type) {
			case 'available':
				return { container: 'border-emerald-500', title: 'text-emerald-600' };
			case 'busy':
				return { container: 'border-red-500', title: 'text-red-600' };
			case 'tentative':
				return { container: 'border-yellow-500', title: 'text-yellow-600' };
			default:
				return { container: 'border-muted', title: 'text-foreground' };
		}
	}

	function getTypeBadgeClass(type: 'available' | 'busy' | 'tentative' | string): string {
		switch (type) {
			case 'available':
				return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
			case 'busy':
				return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-red-200 dark:border-red-500/30';
			case 'tentative':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30';
			default:
				return '';
		}
	}

	function formatTime12(time: string): string {
		// Accepts "HH:MM" or "HH:MM:SS"
		const parts = time.split(":");
		let hour = parseInt(parts[0], 10);
		const minute = parts[1] ? parts[1] : "00";
		const ampm = hour >= 12 ? "PM" : "AM";
		hour = hour % 12;
		if (hour === 0) hour = 12;
		return `${hour}:${minute} ${ampm}`;
	}

	// Local date helpers to avoid UTC off-by-one issues
	function toYmdLocal(date: Date): string {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}
	function parseYmdToLocalDate(ymd: string): Date {
		const [y, m, d] = ymd.split('-').map((n) => parseInt(n, 10));
		return new Date(y, (m || 1) - 1, d || 1);
	}

	function isPastDate(date: Date): boolean {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const test = new Date(date);
		test.setHours(0, 0, 0, 0);
		return test < today;
	}

	// Track selected date per member
	const [selectedDateByMember, setSelectedDateByMember] = useState<Record<string, Date>>({});

	useEffect(() => {
		const defaults: Record<string, Date> = {};
		teamMembers.forEach((member) => {
			// Default to today or first day with availability
			let picked = new Date();
			const memberAvailability = availabilityData.filter(a => a.user_id === member.id);
			if (memberAvailability.length > 0) {
				picked = new Date(memberAvailability[0].date);
			}
			defaults[member.id] = picked;
		});
		setSelectedDateByMember(defaults);
	}, [teamMembers, availabilityData]);

	function renderMemberCard(member: TeamMember) {
		const selectedDate = selectedDateByMember[member.id] ?? new Date();
		const memberAvailability = getAvailabilityForMemberDate(member.id, selectedDate);

		// Build per-day status to color dates in the mini calendar
		const statusByDate: Record<string, 'available' | 'busy' | 'tentative' | 'mixed'> = {};
		availabilityData.filter(a => a.user_id === member.id).forEach(a => {
			const key = a.date; // already y-m-d
			const cur = statusByDate[key];
			if (!cur) {
				statusByDate[key] = a.availability_type;
			} else if (cur !== a.availability_type) {
				statusByDate[key] = 'mixed';
			}
		});
		const availableMarkedDates = Object.entries(statusByDate).filter(([, v]) => v === 'available').map(([d]) => parseYmdToLocalDate(d));
		const busyMarkedDates = Object.entries(statusByDate).filter(([, v]) => v === 'busy').map(([d]) => parseYmdToLocalDate(d));
		const tentativeMarkedDates = Object.entries(statusByDate).filter(([, v]) => v === 'tentative').map(([d]) => parseYmdToLocalDate(d));
		const mixedMarkedDates = Object.entries(statusByDate).filter(([, v]) => v === 'mixed').map(([d]) => parseYmdToLocalDate(d));

		const calendarBlock = (
			<div className="rounded-lg p-1 sm:p-2 md:p-3 overflow-x-hidden">
				<UiCalendar
					mode="single"
					numberOfMonths={1}
					selected={selectedDate}
					onSelect={(date) => { if (date) setSelectedDateByMember((prev) => ({ ...prev, [member.id]: date })); }}
					month={calendarMonth}
					onMonthChange={(d) => {
						setCalendarMonth(d);
						// keep the same day-of-month when month changes
						const currentDay = selectedDate.getDate();
						const candidate = new Date(d.getFullYear(), d.getMonth(), Math.min(currentDay, 28));
						setSelectedDateByMember((prev) => ({ ...prev, [member.id]: candidate }));
					}}
					showOutsideDays={false}
					className="w-full p-2 sm:p-3 [--cell-size:clamp(28px,calc((100vw-2.5rem-48px)/7),40px)] sm:[--cell-size:28px] md:[--cell-size:36px]"
					modifiers={{
						availableMarked: availableMarkedDates,
						busyMarked: busyMarkedDates,
						tentativeMarked: tentativeMarkedDates,
						mixedMarked: mixedMarkedDates,
					}}
					modifiersClassNames={{
						availableMarked: "ring-1 ring-offset-0 ring-emerald-500 rounded-sm",
						busyMarked: "ring-1 ring-offset-0 ring-red-500 rounded-sm",
						tentativeMarked: "ring-1 ring-offset-0 ring-yellow-500 rounded-sm",
						mixedMarked: "ring-1 ring-offset-0 ring-blue-500 rounded-sm",
					}}
				/>
			</div>
		);

		const detailsBlock = (
			<div className="space-y-3">
				<div className="text-sm font-medium">
					{selectedDate.toLocaleDateString('en-US', {
						weekday: 'long',
						month: 'short',
						day: 'numeric'
					})}
				</div>
				
				{memberAvailability.length > 0 && (
					<div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
						<span>{memberAvailability.length} {memberAvailability.length === 1 ? 'block' : 'blocks'}</span>
						<span>
							Total {
								(
									memberAvailability.reduce((sum, a) => {
										const sh = parseInt(a.start_time.slice(0, 2));
										const sm = parseInt(a.start_time.slice(3, 5));
										const eh = parseInt(a.end_time.slice(0, 2));
										const em = parseInt(a.end_time.slice(3, 5));
										return sum + (eh + em / 60 - (sh + sm / 60));
									}, 0)
									).toFixed(1)
							}
							h
						</span>
					</div>
				)}

				<div className="space-y-3">
					{memberAvailability.length === 0 ? (
						<div className="text-center py-8">
							<Clock className="h-12 w-12 mx-auto mb-3 opacity-40" />
							<div className="text-sm text-muted-foreground mb-2">No availability logged</div>
							<div className="text-xs text-muted-foreground mb-4">Click the + button to add your first availability</div>
							{member.id === currentUserId && (
								<Button
									size="sm"
									variant="outline"
									onClick={() => {
										setNewAvailabilityDate(selectedDate);
										setIsAddAvailabilityOpen(true);
									}}
								>
									<Plus className="h-4 w-4 mr-2" />
									Add Availability
								</Button>
							)}
						</div>
					) : (
						memberAvailability.map((availability) => {
							const startTime = availability.start_time.slice(0, 5);
							const endTime = availability.end_time.slice(0, 5);
							const duration = ((parseInt(availability.end_time.slice(0, 2)) + parseInt(availability.end_time.slice(3, 5)) / 60) -
									(parseInt(availability.start_time.slice(0, 2)) + parseInt(availability.start_time.slice(3, 5)) / 60)).toFixed(1);

							return (
								<div key={availability.id} className="rounded-lg bg-background border p-4 space-y-3 transition-colors hover:bg-accent/40">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0 flex-1 space-y-2">
											<div className="flex items-center gap-2">
												<Badge className={`${getTypeBadgeClass(availability.availability_type)} shadow-sm` }>
													{availability.availability_type.charAt(0).toUpperCase() + availability.availability_type.slice(1)}
												</Badge>
											</div>
											<div className={`font-medium ${getAvailabilityStyle(availability.availability_type).title}`}>
												{availability.title || 'Untitled'}
											</div>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<Clock className="h-4 w-4" />
												<span>{formatTime12(startTime)} – {formatTime12(endTime)}</span>
												<span className="text-xs opacity-60">({duration}h)</span>
											</div>
											{availability.notes && (
												<div className="text-sm text-muted-foreground">
													{availability.notes}
												</div>
											)}
										</div>
										{member.id === currentUserId && (
											<div className="flex gap-1">
												<Button
													size="sm"
													variant="ghost"
													onClick={() => openEditDialog(availability)}
													className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground shrink-0"
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													size="sm"
													variant="ghost"
													onClick={() => deleteAvailability(availability.id)}
													className="h-9 w-9 p-0 text-red-500 hover:text-red-700 shrink-0"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										)}
									</div>
								</div>
							);
						})
					)}
				</div>

				{member.id === currentUserId && (
					<div className="pt-2">
						<Button
							size="default"
							variant="outline"
							className="w-full h-12"
							disabled={isPastDate(selectedDate)}
							onClick={() => {
								setNewAvailabilityDate(selectedDate);
								setIsAddAvailabilityOpen(true);
							}}
						>
							<Plus className="h-5 w-5 mr-2" />
							{isPastDate(selectedDate) ? "Cannot add to past" : "Add Availability"}
						</Button>
					</div>
				)}
			</div>
		);

		return (
			<div key={member.id} className="rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
				<div className="p-4 border-b bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
							<span className="text-sm font-medium">{member.full_name?.[0]?.toUpperCase() || "?"}</span>
						</div>
						<div className="min-w-0">
							<div className="font-medium truncate">{member.full_name}</div>
							<div className="text-xs text-muted-foreground">{formatDate(calendarMonth.toISOString())}</div>
						</div>
					</div>
				</div>

				{/* Mobile: stacked calendar then details */}
				<div className="p-4 md:hidden space-y-6">
					{calendarBlock}
					<div className="h-px bg-border" />
					<div className="space-y-4">
						{detailsBlock}
					</div>
				</div>

				{/* Desktop: two-column layout */}
				<div className="hidden md:grid grid-cols-2 gap-8 p-6">
					{calendarBlock}
					<div className="space-y-4">
						{detailsBlock}
					</div>
				</div>
			</div>
		);
	}

	function renderAllAvailabilityByDate() {
		const ymd = toYmdLocal(allViewDate);
		const byMember: Record<string, CalendarAvailability[]> = {};
		for (const a of availabilityData) {
			if (a.date === ymd) {
				(byMember[a.user_id] ||= []).push(a);
			}
		}
		const memberById = new Map(teamMembers.map((m) => [m.id, m] as const));

		const membersWithData = Object.keys(byMember)
			.map((id) => ({ member: memberById.get(id), items: byMember[id] }))
			.filter((x) => x.member) as { member: TeamMember; items: CalendarAvailability[] }[];

		return (
			<Card className="mb-4 sm:mb-6 rounded-lg sm:rounded-xl overflow-hidden">
				<CardHeader className="pb-3 px-4 sm:px-6">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg flex items-center gap-2">
							<Users className="h-5 w-5" />
							All Availability (Date)
						</CardTitle>
						<div className="flex items-center gap-2">
							<Button size="sm" variant={showAllByDate ? "default" : "outline"} onClick={() => setShowAllByDate((v) => !v)}>
								{showAllByDate ? "Hide" : "Show"}
							</Button>
						</div>
					</div>
				</CardHeader>
				{showAllByDate ? (
					<CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
						<div className="grid md:grid-cols-2 gap-4 sm:gap-6">
							<div className="rounded-lg p-1 sm:p-2 md:p-3">
								<UiCalendar
									mode="single"
									numberOfMonths={1}
									selected={allViewDate}
									onSelect={(date) => date && setAllViewDate(date)}
									month={calendarMonth}
									onMonthChange={setCalendarMonth}
									showOutsideDays={false}
									className="w-full p-2 sm:p-3 [--cell-size:clamp(28px,calc((100vw-2.5rem-48px)/7),40px)] sm:[--cell-size:28px] md:[--cell-size:36px]"
								/>
							</div>
							<div className="space-y-4">
								<div>
									<div className="text-sm text-muted-foreground">Selected date</div>
									<div className="font-medium">
										{allViewDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
									</div>
								</div>
								{membersWithData.length === 0 ? (
									<div className="text-sm text-muted-foreground">No availability logged</div>
								) : (
									<div className="space-y-4">
										{membersWithData.map(({ member, items }) => {
											return (
												<div key={member.id} className="rounded-lg border p-3">
													<div className="flex items-center gap-2 mb-2">
														<div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
															{member.full_name?.[0]?.toUpperCase() || "?"}
														</div>
														<div className="text-sm font-medium truncate">{member.full_name}</div>
													</div>
													<div className="space-y-2">
														{items.map((a) => {
															const startTime = a.start_time.slice(0, 5);
															const endTime = a.end_time.slice(0, 5);
															return (
																<div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2">
																	<div className="text-sm">
																		<span className="font-medium">{formatTime12(startTime)} – {formatTime12(endTime)}</span>
																		{a.title ? <span className="text-muted-foreground"> — {a.title}</span> : null}
																	</div>
																	<Badge className={getTypeBadgeClass(a.availability_type)}>
																		{a.availability_type.charAt(0).toUpperCase() + a.availability_type.slice(1)}
																	</Badge>
																</div>
															);
														})}
													</div>
												</div>
											);
										})}
									</div>
								) /* end list */ }
							</div>
						</div>
					</CardContent>
				) : null}
			</Card>
		);
	}

	function renderAllAvailabilityByMember() {
		const selectedMember = teamMembers.find((m) => m.id === memberFilterId);
		const items = availabilityData
			.filter((a) => a.user_id === memberFilterId)
			.sort((a, b) => (a.date === b.date ? a.start_time.localeCompare(b.start_time) : a.date.localeCompare(b.date)));

		const byDate: Record<string, CalendarAvailability[]> = {};
		for (const a of items) (byDate[a.date] ||= []).push(a);
		const dates = Object.keys(byDate).sort();

		return (
			<Card className="mb-4 sm:mb-6 rounded-lg sm:rounded-xl overflow-hidden">
				<CardHeader className="pb-3 px-4 sm:px-6">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg">All Availability (Member)</CardTitle>
						<div className="flex items-center gap-2">
							<Button size="sm" variant={showAllByMember ? "default" : "outline"} onClick={() => setShowAllByMember((v) => !v)}>
								{showAllByMember ? "Hide" : "Show"}
							</Button>
						</div>
					</div>
				</CardHeader>
				{showAllByMember ? (
					<CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
						<div className="grid sm:grid-cols-[260px_1fr] gap-3 sm:gap-4 items-start">
							<div>
								<div className="text-sm text-muted-foreground mb-1">Member</div>
								<Select value={memberFilterId} onValueChange={setMemberFilterId}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{teamMembers.map((m) => (
											<SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="text-sm text-muted-foreground">
								{selectedMember ? `Showing availability for ${selectedMember.full_name}` : "Select a member"}
							</div>
						</div>

						{!selectedMember ? (
							<div className="text-sm text-muted-foreground">No member selected.</div>
						) : items.length === 0 ? (
							<div className="text-sm text-muted-foreground">No availability logged for this member.</div>
						) : (
							<div className="space-y-4">
								{dates.map((d) => (
									<div key={d} className="rounded-lg border p-3">
										<div className="text-sm font-medium mb-2">
											{new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
										</div>
										<div className="space-y-2">
											{byDate[d].map((a) => {
												const startTime = a.start_time.slice(0, 5);
												const endTime = a.end_time.slice(0, 5);
												return (
													<div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2">
														<div className="text-sm">
															<span className="font-medium">{formatTime12(startTime)} – {formatTime12(endTime)}</span>
															{a.title ? <span className="text-muted-foreground"> — {a.title}</span> : null}
														</div>
														<Badge className={getTypeBadgeClass(a.availability_type)}>
															{a.availability_type.charAt(0).toUpperCase() + a.availability_type.slice(1)}
														</Badge>
													</div>
												);
											})}
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				) : null}
			</Card>
		);
	}

	// Compute selected member for the simplified view
	const selectedMember = teamMembers.find((m) => m.id === memberFilterId);
	
	// All members are now loaded from the database, so we can use teamMembers directly
	const allMembers = teamMembers;

	// Only show skeleton on initial load when we have no data at all
	if (loading && availabilityData.length === 0 && teamMembers.length === 0) {
		return <HoursSkeleton />;
	}

	return (
		<div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
			{/* Header */}
			{/*
			<Card className="mb-6">
				<CardHeader className="pb-4">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<CardTitle className="flex items-center gap-2 text-2xl">
								<Calendar className="h-6 w-6" />
								Team Calendar & Availability
							</CardTitle>
							<CardDescription>
								Track team availability with specific time blocks and calendar events.
							</CardDescription>
						</div>
						<div className="flex gap-2">
							<Button onClick={() => setIsAddAvailabilityOpen(true)} className="w-full sm:w-auto">
										<Plus className="h-4 w-4 mr-2" />
								Add Availability
										</Button>
						</div>
					</div>
				</CardHeader>
			</Card>
			*/}

			{/* Month Navigation */}
			{/*
			<Card className="mb-6">
				<CardContent className="p-6">
					<div className="flex items-center justify-between">
						<Button 
							variant="outline" 
							onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
							disabled={loading}
						>
							<ChevronLeft className="h-4 w-4 mr-2" />
							Previous Month
						</Button>
						
						<div className="text-center">
							<h3 className="text-lg font-semibold">
								{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
							</h3>
							<p className="text-sm text-muted-foreground">
								Team availability calendar
							</p>
						</div>
						
						<Button 
							variant="outline" 
							onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
							disabled={loading}
						>
							Next Month
							<ChevronRight className="h-4 w-4 ml-2" />
						</Button>
					</div>
				</CardContent>
			</Card>
			*/}

			{/* Team Availability - Simplified view with member dropdown */}
			<Card className="rounded-lg sm:rounded-xl overflow-hidden">
				<CardHeader className="pb-3 px-4 sm:px-6">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg flex items-center gap-2">
							<Users className="h-5 w-5" />
							Team Availability
						</CardTitle>
						<div className="flex items-center gap-2">
							<Button size="sm" variant="outline" onClick={() => setCalendarMonth(new Date())}>Today</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
					{/* Member dropdown */}
					<div className="grid sm:grid-cols-[260px_1fr] gap-3 sm:gap-4 items-start mb-4">
						<div>
							<div className="text-sm text-muted-foreground mb-1">Member</div>
							<Select value={memberFilterId} onValueChange={setMemberFilterId}>
								<SelectTrigger>
									<SelectValue placeholder="Select a member" />
								</SelectTrigger>
								<SelectContent>
									{allMembers.map((m) => (
										<SelectItem key={m.id} value={m.id}>
											{m.id === currentUserId ? "👤 " : ""}{m.full_name}
											{m.id === currentUserId ? " (You)" : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="text-sm text-muted-foreground">
							{selectedMember ? `Showing availability for ${selectedMember.full_name}` : "Select a member"}
						</div>
					</div>

					{/* Always show calendar - either for selected member or current user */}
					<div className="space-y-4 sm:space-y-6">
						{loading && availabilityData.length === 0 ? (
							// Show loading state with calendar
							<div className="rounded-lg border bg-card shadow-sm">
								<div className="p-4 border-b bg-card/60">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
											<Calendar className="h-5 w-5" />
										</div>
										<div>
											<div className="font-medium">Loading...</div>
											<div className="text-xs text-muted-foreground">Fetching availability data</div>
										</div>
									</div>
								</div>
								<div className="p-6">
									<div className="animate-pulse space-y-4">
										<div className="h-64 bg-muted/50 rounded-lg"></div>
										<div className="h-32 bg-muted/30 rounded-lg"></div>
									</div>
								</div>
							</div>
						) : selectedMember ? (
							renderMemberCard(selectedMember)
						) : currentUserId ? (
							// Show current user's calendar even if not in team members list
							renderMemberCard({ id: currentUserId, full_name: "You" } as TeamMember)
						) : (
							// Fallback: Show a generic calendar view
							<div className="rounded-lg border bg-card shadow-sm">
								<div className="p-4 border-b bg-card/60">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
											<Calendar className="h-5 w-5" />
										</div>
										<div>
											<div className="font-medium">Calendar View</div>
											<div className="text-xs text-muted-foreground">Select a member to view their availability</div>
										</div>
									</div>
								</div>
								
								{/* Mobile: stacked calendar then details */}
								<div className="p-4 md:hidden space-y-6">
									<div className="rounded-lg p-1 sm:p-2 md:p-3 overflow-x-hidden">
										<UiCalendar
											mode="single"
											numberOfMonths={1}
											selected={new Date()}
											onSelect={() => {}}
											month={calendarMonth}
											onMonthChange={setCalendarMonth}
											showOutsideDays={false}
											className="w-full p-2 sm:p-3 [--cell-size:clamp(28px,calc((100vw-2.5rem-48px)/7),40px)] sm:[--cell-size:28px] md:[--cell-size:36px]"
										/>
									</div>
									<div className="h-px bg-border" />
									<div className="text-center py-8">
										<Calendar className="h-12 w-12 mx-auto mb-4 opacity-40" />
										<div className="text-sm text-muted-foreground mb-2">No member selected</div>
										<div className="text-xs text-muted-foreground mb-4">Select a member from the dropdown above to view their availability</div>
										<Button
											size="sm"
											variant="outline"
											onClick={() => {
												setNewAvailabilityDate(new Date());
												setIsAddAvailabilityOpen(true);
											}}
										>
											<Plus className="h-4 w-4 mr-2" />
											Add Availability
										</Button>
									</div>
								</div>

								{/* Desktop: two-column layout */}
								<div className="hidden md:grid grid-cols-2 gap-8 p-6">
									<div className="rounded-lg p-1 sm:p-2 md:p-3 overflow-x-hidden">
										<UiCalendar
											mode="single"
											numberOfMonths={1}
											selected={new Date()}
											onSelect={() => {}}
											month={calendarMonth}
											onMonthChange={setCalendarMonth}
											showOutsideDays={false}
											className="w-full p-2 sm:p-3 [--cell-size:clamp(28px,calc((100vw-2.5rem-48px)/7),40px)] sm:[--cell-size:28px] md:[--cell-size:36px]"
										/>
									</div>
									<div className="space-y-4">
										<div className="text-center py-8">
											<Calendar className="h-12 w-12 mx-auto mb-4 opacity-40" />
											<div className="text-sm text-muted-foreground mb-2">No member selected</div>
											<div className="text-xs text-muted-foreground mb-4">Select a member from the dropdown above to view their availability</div>
											<Button
												size="sm"
												variant="outline"
												onClick={() => {
													setNewAvailabilityDate(new Date());
													setIsAddAvailabilityOpen(true);
												}}
											>
												<Plus className="h-4 w-4 mr-2" />
												Add Availability
											</Button>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
					{/* Other elements removed per request */}
					{/**
					{renderAllAvailabilityByDate()}
					{renderAllAvailabilityByMember()}
					*/}
				</CardContent>
			</Card>

 
			{/* Add Availability Dialog */}
			<Dialog open={isAddAvailabilityOpen} onOpenChange={setIsAddAvailabilityOpen}>
				<DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
					<div className="grid md:grid-cols-2">
						{/* Left: Date selector and summary */}
						<div className="p-5 border-b md:border-b-0 md:border-r bg-muted/40">
							<DialogHeader className="p-0">
								<DialogTitle className="text-base">Select a date</DialogTitle>
								<DialogDescription>Choose the day for this time block.</DialogDescription>
							</DialogHeader>
							<div className="mt-4 rounded-md border bg-background p-2 sm:p-3 [--cell-size:24px] sm:[--cell-size:32px] md:[--cell-size:36px]">
								<UiCalendar mode="single" selected={newAvailabilityDate ?? new Date()} onSelect={setNewAvailabilityDate} month={calendarMonth} onMonthChange={setCalendarMonth} showOutsideDays={false} className="w-full" />
							</div>
							{newAvailabilityDate && (
								<div className="mt-3 text-xs text-muted-foreground">Selected: {newAvailabilityDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
							)}
						</div>

						{/* Right: Form */}
						<div className="p-5">
							<DialogHeader className="p-0">
								<DialogTitle className="text-base">Add availability</DialogTitle>
								<DialogDescription>Set the time, type, and optional details.</DialogDescription>
							</DialogHeader>
							<div className="mt-4 space-y-4">
								<div className="grid grid-cols-2 gap-3">
									<div>
										<Label htmlFor="start-time">Start time</Label>
										<Input id="start-time" type="time" value={newAvailabilityStart} onChange={(e) => setNewAvailabilityStart(e.target.value)} />
									</div>
									<div>
										<Label htmlFor="end-time">End time</Label>
										<Input id="end-time" type="time" value={newAvailabilityEnd} onChange={(e) => setNewAvailabilityEnd(e.target.value)} />
									</div>
								</div>
								<div className="text-xs text-muted-foreground">Duration: {getPlannedDurationHours()}</div>

								<div>
									<Label htmlFor="availability-type">Type</Label>
									<Select value={newAvailabilityType} onValueChange={(value: 'available' | 'busy' | 'tentative') => setNewAvailabilityType(value)}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="available">Available</SelectItem>
											<SelectItem value="busy">Busy</SelectItem>
											<SelectItem value="tentative">Tentative</SelectItem>
										</SelectContent>
									</Select>
									<div className="mt-1 text-xs text-muted-foreground">Pick how this block should appear on the calendar.</div>
								</div>

								<div>
									<Label htmlFor="title">Title (optional)</Label>
									<Input id="title" placeholder="e.g. Team Meeting, Focus Time" value={newAvailabilityTitle} onChange={(e) => setNewAvailabilityTitle(e.target.value)} />
								</div>

								<div>
									<Label htmlFor="notes">Notes (optional)</Label>
									<Input id="notes" placeholder="Additional details" value={newAvailabilityNotes} onChange={(e) => setNewAvailabilityNotes(e.target.value)} />
								</div>
							</div>

							<DialogFooter className="mt-6">
								<Button variant="outline" onClick={() => setIsAddAvailabilityOpen(false)}>
									Cancel
								</Button>
								<Button onClick={saveAvailability} disabled={loading}>
									{loading ? "Saving..." : "Save"}
								</Button>
							</DialogFooter>
						</div>
					</div>
					</DialogContent>
				</Dialog>

			{/* Edit Availability Dialog */}
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
					<div className="grid md:grid-cols-2">
						{/* Left: Date selector */}
						<div className="p-5 border-b md:border-b-0 md:border-r bg-muted/40">
							<DialogHeader className="p-0">
								<DialogTitle className="text-base">Edit date</DialogTitle>
								<DialogDescription>Update the day for this time block.</DialogDescription>
							</DialogHeader>
							<div className="mt-4 rounded-md border bg-background p-2 sm:p-3 [--cell-size:24px] sm:[--cell-size:32px] md:[--cell-size:36px]">
								<UiCalendar mode="single" selected={editDate ?? new Date()} onSelect={setEditDate} month={calendarMonth} onMonthChange={setCalendarMonth} showOutsideDays={false} className="w-full" />
							</div>
							{editDate && (
								<div className="mt-3 text-xs text-muted-foreground">Selected: {editDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
							)}
						</div>

						{/* Right: Form */}
						<div className="p-5">
							<DialogHeader className="p-0">
								<DialogTitle className="text-base">Edit availability</DialogTitle>
								<DialogDescription>Change the time, type, and details.</DialogDescription>
							</DialogHeader>
							<div className="mt-4 space-y-4">
								<div className="grid grid-cols-2 gap-3">
									<div>
										<Label htmlFor="edit-start-time">Start time</Label>
										<Input id="edit-start-time" type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
									</div>
									<div>
										<Label htmlFor="edit-end-time">End time</Label>
										<Input id="edit-end-time" type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
									</div>
								</div>
								<div className="text-xs text-muted-foreground">Duration: {getEditDurationHours()}</div>

								<div>
									<Label htmlFor="edit-availability-type">Type</Label>
									<Select value={editType} onValueChange={(value: 'available' | 'busy' | 'tentative') => setEditType(value)}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="available">Available</SelectItem>
											<SelectItem value="busy">Busy</SelectItem>
											<SelectItem value="tentative">Tentative</SelectItem>
										</SelectContent>
									</Select>
									<div className="mt-1 text-xs text-muted-foreground">Pick how this block should appear on the calendar.</div>
								</div>

								<div>
									<Label htmlFor="edit-title">Title (optional)</Label>
									<Input id="edit-title" placeholder="e.g. Team Meeting, Focus Time" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
								</div>

								<div>
									<Label htmlFor="edit-notes">Notes (optional)</Label>
									<Input id="edit-notes" placeholder="Additional details" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
								</div>
							</div>

							<DialogFooter className="mt-6">
								<Button variant="outline" onClick={() => setIsEditOpen(false)}>
									Cancel
								</Button>
								<Button onClick={updateAvailability} disabled={loading || !editingAvailabilityId}>
									{loading ? "Updating..." : "Update"}
								</Button>
							</DialogFooter>
						</div>
					</div>
					</DialogContent>
				</Dialog>

			{/* {renderAllAvailabilityByDate()} */}
		</div>
	);
}


