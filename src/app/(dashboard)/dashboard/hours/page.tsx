"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
	Plus, 
	Calendar, 
	Users, 
	ChevronLeft,
	ChevronRight,
	Edit,
	Save,
	X
} from "lucide-react";
import { Calendar as UiCalendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface WeeklyHours {
	id: string;
	user_id: string;
	week_start: string; // Monday of the week
	monday_hours: number;
	tuesday_hours: number;
	wednesday_hours: number;
	thursday_hours: number;
	friday_hours: number;
	saturday_hours: number;
	sunday_hours: number;
	notes?: string;
	created_at: string;
	updated_at: string;
	user: {
		full_name: string;
		avatar_url?: string;
	};
}

interface TeamMember {
	id: string;
	full_name: string;
	avatar_url?: string;
}

interface AvailabilityBlock {
	id: string;
	user_id: string;
	date: string; // ISO date yyyy-mm-dd
	start_time: string; // HH:MM or HH:MM:SS
	end_time: string; // HH:MM or HH:MM:SS
	created_at: string;
	updated_at: string;
}

export default function HoursPage() {
	const supabase = getSupabaseBrowserClient();
	const [weeklyHours, setWeeklyHours] = useState<WeeklyHours[]>([]);
	const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
	const [loading, setLoading] = useState(false);
	const [currentWeek, setCurrentWeek] = useState(getWeekStart(new Date()));
	const [editingHours, setEditingHours] = useState<string | null>(null);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [newHours, setNewHours] = useState({
		monday_hours: 8,
		tuesday_hours: 8,
		wednesday_hours: 8,
		thursday_hours: 8,
		friday_hours: 8,
		saturday_hours: 0,
		sunday_hours: 0,
		notes: ""
	});

	// Availability blocks for exact time ranges
	const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
	const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
	const [currentUserId, setCurrentUserId] = useState<string>("");

	// Add availability dialog state (for current user)
	const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
	const [newBlockDate, setNewBlockDate] = useState<Date | undefined>(undefined);
	const [newBlockStart, setNewBlockStart] = useState<string>("09:00");
	const [newBlockEnd, setNewBlockEnd] = useState<string>("17:00");

	// Helper function to get Monday of the week
	function getWeekStart(date: Date): string {
		const d = new Date(date);
		const day = d.getDay();
		const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
		const monday = new Date(d.setDate(diff));
		return monday.toISOString().split('T')[0];
	}

	// Helper function to format date
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', { 
			weekday: 'long', 
			month: 'short', 
			day: 'numeric' 
		});
	}

	// Helper function to get week dates
	function getWeekDates(weekStart: string): string[] {
		const dates = [];
		const start = new Date(weekStart);
		for (let i = 0; i < 7; i++) {
			const date = new Date(start);
			date.setDate(start.getDate() + i);
			dates.push(date.toISOString().split('T')[0]);
		}
		return dates;
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
			// Load weekly hours for current week
			const { data: hoursData, error: hoursError } = await supabase
				.from("weekly_hours")
				.select("*")
				.eq("week_start", currentWeek)
				.order("created_at", { ascending: true });

			if (hoursError) {
				console.error("Error loading weekly hours:", hoursError);
				// Don't show error toast if table doesn't exist yet
				if (hoursError.code !== 'PGRST200') {
					toast.error("Failed to load weekly hours");
				}
			} else {
				setWeeklyHours(hoursData || []);
			}

			// Load team members (start with current user, add others if they have hours)
			const userIds = [user.id];
			if (hoursData && hoursData.length > 0) {
				userIds.push(...hoursData.map((h: WeeklyHours) => h.user_id));
			}
			
			const { data: membersData, error: membersError } = await supabase
				.from("profiles")
				.select("id, full_name, avatar_url")
				.in("id", userIds)
				.order("full_name", { ascending: true });

			if (membersError) {
				console.error("Error loading team members:", membersError);
			} else {
				setTeamMembers(membersData || []);
			}

			// Load availability blocks for the visible month (if table exists)
			await loadBlocksForMonth(calendarMonth);
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}, [currentWeek, calendarMonth, supabase]);

	async function loadBlocksForMonth(monthDate: Date) {
		try {
			const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString().split('T')[0];
			const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString().split('T')[0];
			const { data, error } = await supabase
				.from("availability_blocks")
				.select("*")
				.gte("date", first)
				.lte("date", last)
				.order("date", { ascending: true });
			if (!error) {
				setAvailabilityBlocks(data || []);
			} else if (error.code !== 'PGRST200') {
				console.error("Error loading availability blocks:", error);
			}
		} catch (e) {
			console.warn("availability_blocks not present yet; skipping");
		}
	}

	useEffect(() => {
		// When calendar month changes (via nav), refresh blocks
		loadBlocksForMonth(calendarMonth);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [calendarMonth]);

	async function saveWeeklyHours() {
		setLoading(true);
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			toast.error("You must be logged in");
			setLoading(false);
			return;
		}

		try {
			// Check if weekly_hours table exists by trying a simple query
			const { error: tableCheckError } = await supabase
				.from("weekly_hours")
				.select("id")
				.limit(1);
			
			if (tableCheckError && tableCheckError.code === 'PGRST200') {
				toast.error("Weekly hours table not found. Please apply the database schema first.");
				setLoading(false);
				return;
			}
			// Check if hours already exist for this week
			const existingHours = weeklyHours.find(h => h.user_id === user.id);
			
			if (existingHours) {
				// Update existing hours
				const { error } = await supabase
					.from("weekly_hours")
					.update({
						monday_hours: newHours.monday_hours,
						tuesday_hours: newHours.tuesday_hours,
						wednesday_hours: newHours.wednesday_hours,
						thursday_hours: newHours.thursday_hours,
						friday_hours: newHours.friday_hours,
						saturday_hours: newHours.saturday_hours,
						sunday_hours: newHours.sunday_hours,
						notes: newHours.notes
					})
					.eq("id", existingHours.id);

				if (error) {
					console.error("Error updating weekly hours:", error);
					toast.error("Failed to update weekly hours");
					setLoading(false);
					return;
				}
			} else {
				// Create new hours entry
				const { error } = await supabase
					.from("weekly_hours")
					.insert({
						user_id: user.id,
						week_start: currentWeek,
						monday_hours: newHours.monday_hours,
						tuesday_hours: newHours.tuesday_hours,
						wednesday_hours: newHours.wednesday_hours,
						thursday_hours: newHours.thursday_hours,
						friday_hours: newHours.friday_hours,
						saturday_hours: newHours.saturday_hours,
						sunday_hours: newHours.sunday_hours,
						notes: newHours.notes
					});

				if (error) {
					console.error("Error creating weekly hours:", error);
					toast.error("Failed to create weekly hours");
					setLoading(false);
					return;
				}
			}

			toast.success("Weekly hours saved successfully");
			setIsCreateDialogOpen(false);
			loadData();
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}

	async function editWeeklyHours(hoursId: string) {
		setEditingHours(hoursId);
		const hours = weeklyHours.find(h => h.id === hoursId);
		if (hours) {
			setNewHours({
				monday_hours: hours.monday_hours,
				tuesday_hours: hours.tuesday_hours,
				wednesday_hours: hours.wednesday_hours,
				thursday_hours: hours.thursday_hours,
				friday_hours: hours.friday_hours,
				saturday_hours: hours.saturday_hours,
				sunday_hours: hours.sunday_hours,
				notes: hours.notes || ""
			});
		}
	}

	async function updateWeeklyHours(hoursId: string) {
		setLoading(true);
		try {
			const { error } = await supabase
				.from("weekly_hours")
				.update({
					monday_hours: newHours.monday_hours,
					tuesday_hours: newHours.tuesday_hours,
					wednesday_hours: newHours.wednesday_hours,
					thursday_hours: newHours.thursday_hours,
					friday_hours: newHours.friday_hours,
					saturday_hours: newHours.saturday_hours,
					sunday_hours: newHours.sunday_hours,
					notes: newHours.notes
				})
				.eq("id", hoursId);

			if (error) {
				console.error("Error updating weekly hours:", error);
				toast.error("Failed to update weekly hours");
				setLoading(false);
				return;
			}

			toast.success("Weekly hours updated successfully");
			setEditingHours(null);
			loadData();
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}

	function navigateWeek(direction: 'prev' | 'next') {
		const current = new Date(currentWeek);
		const newDate = new Date(current);
		newDate.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
		setCurrentWeek(getWeekStart(newDate));
	}

	function getTotalWeeklyHours(hours: WeeklyHours): number {
		return hours.monday_hours + hours.tuesday_hours + hours.wednesday_hours + 
			   hours.thursday_hours + hours.friday_hours + hours.saturday_hours + hours.sunday_hours;
	}

	function getDayHours(hours: WeeklyHours | Partial<WeeklyHours>, day: string): number {
		switch (day) {
			case 'monday': return hours.monday_hours || 0;
			case 'tuesday': return hours.tuesday_hours || 0;
			case 'wednesday': return hours.wednesday_hours || 0;
			case 'thursday': return hours.thursday_hours || 0;
			case 'friday': return hours.friday_hours || 0;
			case 'saturday': return hours.saturday_hours || 0;
			case 'sunday': return hours.sunday_hours || 0;
			default: return 0;
		}
	}

	// Compute hours from availability blocks (fallback to weekly_hours if no blocks)
	function computeHoursFromBlocks(memberId: string, dateIso: string): number {
		const blocks = availabilityBlocks.filter(b => b.user_id === memberId && b.date === dateIso);
		if (blocks.length === 0) return 0;
		let sum = 0;
		for (const b of blocks) {
			const [sh, sm = "0"] = b.start_time.split(":");
			const [eh, em = "0"] = b.end_time.split(":");
			const start = parseInt(sh, 10) + parseInt(sm, 10) / 60;
			const end = parseInt(eh, 10) + parseInt(em, 10) / 60;
			sum += Math.max(0, end - start);
		}
		return Math.max(0, Math.round(sum * 100) / 100);
	}

	function getMemberDayHours(memberId: string, dayKey: string): number {
		const idx = days.indexOf(dayKey);
		if (idx === -1) return 0;
		const dateIso = weekDates[idx];
		const blocksHours = computeHoursFromBlocks(memberId, dateIso);
		if (blocksHours > 0) return blocksHours;
		const wh = weeklyHours.find(h => h.user_id === memberId);
		return wh ? getDayHours(wh, dayKey) : 0;
	}

	function getBlocksForMemberDate(memberId: string, date: Date): AvailabilityBlock[] {
		const dateIso = new Date(date).toISOString().split('T')[0];
		return availabilityBlocks.filter(b => b.user_id === memberId && b.date === dateIso);
	}

	const weekDates = getWeekDates(currentWeek);
	const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

	// Track which date is selected per member for showing side details
	const [selectedDateByMember, setSelectedDateByMember] = useState<Record<string, Date>>({});

	useEffect(() => {
		const defaults: Record<string, Date> = {};
		teamMembers.forEach((member) => {
			const hours = weeklyHours.find((h) => h.user_id === member.id);
			let picked = new Date(currentWeek);
			if (hours) {
				for (let i = 0; i < days.length; i++) {
					const dayKey = days[i];
					if (getDayHours(hours, dayKey) > 0) {
						picked = new Date(weekDates[i]);
						break;
					}
				}
			}
			defaults[member.id] = picked;
		});
		setSelectedDateByMember(defaults);
	}, [teamMembers, weeklyHours, currentWeek]);

	return (
		<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
			{/* Header */}
			<Card className="mb-6">
				<CardHeader className="pb-4">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<CardTitle className="flex items-center gap-2 text-2xl">
								<Calendar className="h-6 w-6" />
								Weekly Work Hours
							</CardTitle>
							<CardDescription>Track team availability and working hours for better project planning.</CardDescription>
						</div>
						<div className="flex gap-2">
							<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
								<DialogTrigger asChild>
									<Button className="w-full sm:w-auto">
										<Plus className="h-4 w-4 mr-2" />
										Log Hours
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-2xl">
									<DialogHeader>
										<DialogTitle>Log Weekly Hours</DialogTitle>
										<DialogDescription>
											Set your availability and working hours for the week of {formatDate(currentWeek)}.
										</DialogDescription>
									</DialogHeader>
									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											{days.map((day) => (
												<div key={day} className="space-y-2">
													<Label htmlFor={`${day}-hours`} className="capitalize">
														{day} Hours
													</Label>
													<Input
														id={`${day}-hours`}
														type="number"
														min="0"
														max="24"
														value={newHours[`${day}_hours` as keyof typeof newHours]}
														onChange={(e) => setNewHours(prev => ({ 
															...prev, 
															[`${day}_hours`]: parseInt(e.target.value) || 0 
														}))}
													/>
												</div>
											))}
										</div>
										<div className="space-y-2">
											<Label htmlFor="notes">Notes (Optional)</Label>
											<Input
												id="notes"
												placeholder="e.g. Available for meetings in the morning"
												value={newHours.notes}
												onChange={(e) => setNewHours(prev => ({ ...prev, notes: e.target.value }))}
											/>
										</div>
									</div>
									<DialogFooter>
										<Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
											Cancel
										</Button>
										<Button onClick={saveWeeklyHours} disabled={loading}>
											{loading ? "Saving..." : "Save Hours"}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					</div>
				</CardHeader>
			</Card>

			{/* Week Navigation */}
			<Card className="mb-6">
				<CardContent className="p-6">
					<div className="flex items-center justify-between">
						<Button 
							variant="outline" 
							onClick={() => navigateWeek('prev')}
							disabled={loading}
						>
							<ChevronLeft className="h-4 w-4 mr-2" />
							Previous Week
						</Button>
						
						<div className="text-center">
							<h3 className="text-lg font-semibold">
								Week of {formatDate(currentWeek)}
							</h3>
							<p className="text-sm text-muted-foreground">
								{formatDate(weekDates[0])} - {formatDate(weekDates[6])}
							</p>
						</div>
						
						<Button 
							variant="outline" 
							onClick={() => navigateWeek('next')}
							disabled={loading}
						>
							Next Week
							<ChevronRight className="h-4 w-4 ml-2" />
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Team Calendar View */}
			<Card>
				<CardHeader className="pb-4">
					<CardTitle className="text-lg flex items-center gap-2">
						<Users className="h-5 w-5" />
						Team Availability Calendar
					</CardTitle>
				</CardHeader>
				<CardContent>
					{weeklyHours.length === 0 ? (
						<div className="text-center py-12 text-muted-foreground">
							<Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
							<h3 className="text-lg font-semibold mb-2">No hours logged for this week</h3>
							<p className="mb-4">Be the first to log your weekly availability</p>
							<Button onClick={() => setIsCreateDialogOpen(true)}>
								<Plus className="h-4 w-4 mr-2" />
								Log Your Hours
							</Button>
						</div>
					) : (
						<div className="space-y-6">
							{teamMembers.map((member) => {
								const hours = weeklyHours.find((h) => h.user_id === member.id);
								const availableFull = weekDates
									.map((d, idx) => ({ date: new Date(d), dayKey: days[idx] }))
									.filter(({ dayKey }) => getMemberDayHours(member.id, dayKey) >= 8)
									.map(({ date }) => date);
								const availablePartial = weekDates
									.map((d, idx) => ({ date: new Date(d), dayKey: days[idx] }))
									.filter(({ dayKey }) => {
										const h = getMemberDayHours(member.id, dayKey);
										return h > 0 && h < 8;
									})
									.map(({ date }) => date);
								const selectedDate = selectedDateByMember[member.id] ?? new Date(currentWeek);
								const selectedIdx = weekDates.findIndex((d) => new Date(d).toDateString() === selectedDate.toDateString());
								const selectedDayKey = selectedIdx !== -1 ? days[selectedIdx] : null;
								const selectedHours = selectedDayKey ? getMemberDayHours(member.id, selectedDayKey) : 0;
								return (
									<div key={member.id} className="rounded-lg border p-4">
										<div className="flex items-center gap-3 mb-4">
											<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
												<span className="text-sm font-medium">{member.full_name?.[0]?.toUpperCase() || "?"}</span>
											</div>
											<div>
												<div className="font-medium">{member.full_name}</div>
												<div className="text-xs text-muted-foreground">Week of {formatDate(currentWeek)}</div>
											</div>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div className="[--cell-size:40px] rounded-lg border p-3">
												<UiCalendar
													mode="single"
													numberOfMonths={1}
													selected={selectedDate}
													onSelect={(date) => { if (date) setSelectedDateByMember((prev) => ({ ...prev, [member.id]: date })); }}
													month={calendarMonth}
													onMonthChange={(d) => setCalendarMonth(d)}
													showOutsideDays={false}
													className="w-full"
													modifiers={{ availableFull, availablePartial }}
													modifiersClassNames={{
														availableFull: "after:content-[''] after:block after:mx-auto after:mt-1 after:h-1.5 after:w-1.5 after:rounded-full after:bg-emerald-500",
														availablePartial: "after:content-[''] after:block after:mx-auto after:mt-1 after:h-1.5 after:w-1.5 after:rounded-full after:bg-yellow-500",
													}}
												/>
											</div>
											<div className="space-y-2">
												<div className="text-sm text-muted-foreground">Selected date</div>
												<div className="rounded-md border p-3">
													<div className="text-sm font-medium">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
													<div className="mt-1 text-sm space-y-1">
														{selectedIdx === -1 ? (
															<span className="text-muted-foreground">Outside current week</span>
														) : getBlocksForMemberDate(member.id, selectedDate).length === 0 ? (
															<span className="text-muted-foreground">No availability logged</span>
														) : (
															<div className="space-y-1">
																{getBlocksForMemberDate(member.id, selectedDate).map((b) => {
																	const st = b.start_time.slice(0,5);
																	const et = b.end_time.slice(0,5);
																	const dur = ((parseInt(b.end_time.slice(0,2)) + parseInt(b.end_time.slice(3,5))/60) - (parseInt(b.start_time.slice(0,2)) + parseInt(b.start_time.slice(3,5))/60)).toFixed(1);
																	return (
																		<div key={b.id} className="flex items-center justify-between rounded border bg-muted/40 px-2 py-1">
																			<span className="text-xs">{st} – {et}</span>
																			<span className="text-xs text-muted-foreground">{dur}h</span>
																		</div>
																	);
																})}
																<div className="text-xs text-muted-foreground">Total: {selectedHours}h</div>
															</div>
														)}
													</div>

												{member.id === currentUserId && (
													<div className="pt-2">
														<Dialog open={isAddBlockOpen} onOpenChange={setIsAddBlockOpen}>
															<DialogTrigger asChild>
																<Button size="sm" variant="outline">Add availability</Button>
															</DialogTrigger>
															<DialogContent className="sm:max-w-md">
																<DialogHeader>
																	<DialogTitle>Add availability block</DialogTitle>
																	<DialogDescription>Select a date and time range you are available to work.</DialogDescription>
																</DialogHeader>
																<div className="space-y-4">
																	<UiCalendar mode="single" selected={newBlockDate ?? selectedDate} onSelect={setNewBlockDate} month={calendarMonth} onMonthChange={setCalendarMonth} showOutsideDays={false} />
																	<div className="grid grid-cols-2 gap-3">
																		<div>
																			<Label htmlFor="start-time">Start</Label>
																			<Input id="start-time" type="time" value={newBlockStart} onChange={(e) => setNewBlockStart(e.target.value)} />
																		</div>
																		<div>
																			<Label htmlFor="end-time">End</Label>
																			<Input id="end-time" type="time" value={newBlockEnd} onChange={(e) => setNewBlockEnd(e.target.value)} />
																		</div>
																	</div>
																</div>
																<DialogFooter>
																	<Button variant="outline" onClick={() => setIsAddBlockOpen(false)}>Cancel</Button>
																	<Button onClick={async () => {
																		try {
																			if (!newBlockDate) return;
																			const iso = newBlockDate.toISOString().split('T')[0];
																			if (newBlockEnd <= newBlockStart) { toast.error("End must be after start"); return; }
																			const { error } = await supabase.from("availability_blocks").insert({ user_id: currentUserId, date: iso, start_time: newBlockStart + ":00", end_time: newBlockEnd + ":00" });
																			if (error) { toast.error("Failed to add block"); return; }
																			toast.success("Availability added");
																			setIsAddBlockOpen(false);
																			await loadBlocksForMonth(calendarMonth);
																		} catch (e) { toast.error("Unexpected error"); }
																	}}>Save</Button>
																</DialogFooter>
															</DialogContent>
														</Dialog>
													</div>
												)}
											</div>
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
