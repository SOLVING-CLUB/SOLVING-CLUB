"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
	Plus, 
	Calendar, 
	Users, 
	ChevronLeft,
	ChevronRight,
	Trash2,
	Clock
} from "lucide-react";
import { Calendar as UiCalendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
					toast.error("Failed to load calendar availability");
				}
			} else {
				setAvailabilityData(availabilityData || []);
			}

			// Load team members
			const userIds = [user.id];
			if (availabilityData && availabilityData.length > 0) {
				userIds.push(...availabilityData.map((a: CalendarAvailability) => a.user_id));
			}
			
			const uniqueUserIds = [...new Set(userIds)];
			
			const { data: membersData, error: membersError } = await supabase
				.from("profiles")
				.select("id, full_name, avatar_url")
				.in("id", uniqueUserIds)
				.order("full_name", { ascending: true });

			if (membersError) {
				console.error("Error loading team members:", membersError);
			} else {
				setTeamMembers(membersData || []);
			}
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("An unexpected error occurred");
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

	function getPlannedDurationHours(): string {
		const [sh, sm = "0"] = newAvailabilityStart.split(":");
		const [eh, em = "0"] = newAvailabilityEnd.split(":");
		const start = parseInt(sh, 10) + parseInt(sm, 10) / 60;
		const end = parseInt(eh, 10) + parseInt(em, 10) / 60;
		const dur = Math.max(0, end - start);
		return `${Math.round(dur * 10) / 10}h`;
	}

	async function saveAvailability() {
		setLoading(true);
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			toast.error("You must be logged in");
			setLoading(false);
			return;
		}

		try {
			if (!newAvailabilityDate) {
				toast.error("Please select a date");
				setLoading(false);
				return;
			}

			if (newAvailabilityEnd <= newAvailabilityStart) {
				toast.error("End time must be after start time");
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
				toast.error("Failed to save availability");
					setLoading(false);
					return;
			}

			toast.success("Availability saved successfully");
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
			toast.error("An unexpected error occurred");
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
				toast.error("Failed to delete availability");
				setLoading(false);
				return;
			}

			toast.success("Availability deleted successfully");
			loadData();
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("An unexpected error occurred");
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
			<div className="[--cell-size:28px] sm:[--cell-size:32px] md:[--cell-size:36px] rounded-lg border p-3">
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
					className="w-full"
					modifiers={{
						availableMarked: availableMarkedDates,
						busyMarked: busyMarkedDates,
						tentativeMarked: tentativeMarkedDates,
						mixedMarked: mixedMarkedDates,
					}}
					modifiersClassNames={{
						availableMarked: "ring-2 ring-offset-1 ring-offset-background ring-emerald-500 rounded-md",
						busyMarked: "ring-2 ring-offset-1 ring-offset-background ring-red-500 rounded-md",
						tentativeMarked: "ring-2 ring-offset-1 ring-offset-background ring-yellow-500 rounded-md",
						mixedMarked: "ring-2 ring-offset-1 ring-offset-background ring-blue-500 rounded-md",
					}}
				/>
			</div>
		);

		const detailsBlock = (
			<div className="space-y-2">
				<div className="text-sm text-muted-foreground">Selected date</div>
				<div className="rounded-md border p-3">
					<div className="text-sm font-medium">
						{selectedDate.toLocaleDateString('en-US', {
							weekday: 'long',
							month: 'short',
							day: 'numeric'
						})}
					</div>
					<div className="mt-2 space-y-2">
						{memberAvailability.length === 0 ? (
							<span className="text-sm text-muted-foreground">No availability logged</span>
						) : (
							memberAvailability.map((availability) => {
								const startTime = availability.start_time.slice(0, 5);
								const endTime = availability.end_time.slice(0, 5);
								const duration = ((parseInt(availability.end_time.slice(0, 2)) + parseInt(availability.end_time.slice(3, 5)) / 60) -
										(parseInt(availability.start_time.slice(0, 2)) + parseInt(availability.start_time.slice(3, 5)) / 60)).toFixed(1);

								return (
									<div key={availability.id} className={`rounded border px-3 py-2 ${getAvailabilityStyle(availability.availability_type).container}`}>
										<div className="flex items-center justify-between">
											<div>
												<div className={`text-sm font-medium ${getAvailabilityStyle(availability.availability_type).title}`}>
													{availability.title || `${availability.availability_type.charAt(0).toUpperCase() + availability.availability_type.slice(1)}`}
												</div>
												<div className="text-xs">
													{formatTime12(startTime)} – {formatTime12(endTime)} ({duration}h)
												</div>
												{availability.notes && (
													<div className="text-xs mt-1 opacity-75">
														{availability.notes}
													</div>
												)}
											</div>
											{member.id === currentUserId && (
												<Button
													size="sm"
													variant="ghost"
													onClick={() => deleteAvailability(availability.id)}
													className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
												>
													<Trash2 className="h-3 w-3" />
												</Button>
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
								size="sm"
								variant="outline"
								className="w-full"
								onClick={() => {
									setNewAvailabilityDate(selectedDate);
									setIsAddAvailabilityOpen(true);
								}}
							>
								<Plus className="h-4 w-4 mr-2" />
								Add Availability
							</Button>
						</div>
					)}
				</div>
			</div>
		);

		return (
			<div key={member.id} className="rounded-lg border p-4">
				<div className="flex items-center gap-3 mb-4">
					<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
						<span className="text-sm font-medium">{member.full_name?.[0]?.toUpperCase() || "?"}</span>
					</div>
					<div>
						<div className="font-medium">{member.full_name}</div>
						<div className="text-xs text-muted-foreground">{formatDate(calendarMonth.toISOString())}</div>
					</div>
				</div>

				{/* Mobile: Tabs to switch views */}
				<div className="md:hidden">
					<Tabs defaultValue="list" className="w-full">
						<TabsList className="mb-3 w-full grid grid-cols-2">
							<TabsTrigger value="list">List</TabsTrigger>
							<TabsTrigger value="calendar">Calendar</TabsTrigger>
						</TabsList>
						<TabsContent value="list">{detailsBlock}</TabsContent>
						<TabsContent value="calendar">{calendarBlock}</TabsContent>
					</Tabs>
				</div>

				{/* Desktop: two-column layout */}
				<div className="hidden md:grid grid-cols-2 gap-6">
					{calendarBlock}
					{detailsBlock}
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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

			{/* Team Calendar View */}
			<Card>
				<CardHeader className="pb-4">
					<CardTitle className="text-lg flex items-center gap-2">
						<Users className="h-5 w-5" />
						Team Availability
					</CardTitle>
				</CardHeader>
				<CardContent>
					{/* {availabilityData.length === 0 && (
						<div className="text-center py-6 text-muted-foreground">
							<Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
							<p className="mb-3">No availability logged for this month</p>
							<Button onClick={() => setIsAddAvailabilityOpen(true)} size="sm">
								<Plus className="h-4 w-4 mr-2" />
								Add Your Availability
							</Button>
						</div>
					)} */}
					<div className="space-y-6">
						{teamMembers.map(renderMemberCard)}
					</div>
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
							<div className="mt-4 rounded-md border bg-background p-3 [--cell-size:28px] sm:[--cell-size:32px] md:[--cell-size:36px]">
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
		</div>
	);
}


