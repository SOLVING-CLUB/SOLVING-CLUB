"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
	Plus, 
	Clock, 
	Calendar, 
	Users, 
	ChevronLeft,
	ChevronRight,
	Edit,
	Save,
	X,
	Check,
	AlertCircle
} from "lucide-react";

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

	useEffect(() => {
		loadData();
	}, [currentWeek]);

	async function loadData() {
		setLoading(true);
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			setLoading(false);
			return;
		}

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
				userIds.push(...hoursData.map(h => h.user_id));
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
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}

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

	function getDayHours(hours: WeeklyHours, day: string): number {
		switch (day) {
			case 'monday': return hours.monday_hours;
			case 'tuesday': return hours.tuesday_hours;
			case 'wednesday': return hours.wednesday_hours;
			case 'thursday': return hours.thursday_hours;
			case 'friday': return hours.friday_hours;
			case 'saturday': return hours.saturday_hours;
			case 'sunday': return hours.sunday_hours;
			default: return 0;
		}
	}

	const weekDates = getWeekDates(currentWeek);
	const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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
						<div className="overflow-x-auto">
							<table className="w-full border-collapse">
								<thead>
									<tr className="border-b">
										<th className="text-left p-4 font-medium">Team Member</th>
										{days.map((day, index) => (
											<th key={day} className="text-center p-4 font-medium min-w-[100px]">
												<div className="capitalize">{day}</div>
												<div className="text-xs text-muted-foreground font-normal">
													{formatDate(weekDates[index]).split(',')[0]}
												</div>
											</th>
										))}
										<th className="text-center p-4 font-medium">Total</th>
										<th className="text-center p-4 font-medium">Actions</th>
									</tr>
								</thead>
								<tbody>
									{weeklyHours.map((hours) => {
										const user = teamMembers.find(m => m.id === hours.user_id);
										return (
											<tr key={hours.id} className="border-b hover:bg-muted/30">
												<td className="p-4">
													<div className="flex items-center gap-3">
														<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
															<span className="text-sm font-medium">
																{user?.full_name?.[0]?.toUpperCase() || "?"}
															</span>
														</div>
														<div>
															<div className="font-medium">{user?.full_name || "Unknown User"}</div>
															{hours.notes && (
																<div className="text-xs text-muted-foreground max-w-[200px] truncate">
																	{hours.notes}
																</div>
															)}
														</div>
													</div>
												</td>
											{days.map((day) => (
												<td key={day} className="text-center p-4">
													{editingHours === hours.id ? (
														<Input
															type="number"
															min="0"
															max="24"
															value={getDayHours(newHours, day)}
															onChange={(e) => setNewHours(prev => ({ 
																...prev, 
																[`${day}_hours`]: parseInt(e.target.value) || 0 
															}))}
															className="w-16 text-center"
														/>
													) : (
														<div className={`text-lg font-semibold ${
															getDayHours(hours, day) === 0 ? 'text-muted-foreground' : 
															getDayHours(hours, day) >= 8 ? 'text-green-600' : 'text-yellow-600'
														}`}>
															{getDayHours(hours, day)}h
														</div>
													)}
												</td>
											))}
											<td className="text-center p-4">
												<div className="text-lg font-bold">
													{getTotalWeeklyHours(hours)}h
												</div>
											</td>
											<td className="text-center p-4">
												{editingHours === hours.id ? (
													<div className="flex gap-1">
														<Button 
															size="sm" 
															onClick={() => updateWeeklyHours(hours.id)}
															disabled={loading}
														>
															<Save className="h-4 w-4" />
														</Button>
														<Button 
															size="sm" 
															variant="outline"
															onClick={() => setEditingHours(null)}
														>
															<X className="h-4 w-4" />
														</Button>
													</div>
												) : (
													<Button 
														size="sm" 
														variant="outline"
														onClick={() => editWeeklyHours(hours.id)}
													>
														<Edit className="h-4 w-4" />
													</Button>
												)}
											</td>
										</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
