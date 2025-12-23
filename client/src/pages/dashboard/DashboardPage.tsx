

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardSkeleton } from "@/components/ui/loading-states";
import { MobileOptimizedCard, MobileStatsCard } from "@/components/mobile-optimized-card";
import { MobilePageHeader } from "@/components/mobile-navigation";
import { toast } from "@/lib/toast";
import { 
	Users, 
	Clock, 
	BookOpen, 
	FolderOpen, 
	User,
	Calendar,
	Activity,
	Bell,
	Settings,
	Plus,
	ArrowRight,
	CheckCircle,
	AlertCircle,
	Star,
	Target,
	Zap
} from "lucide-react";

interface DashboardStats {
	totalHours: number;
	activeProjects: number;
	teamMembers: number;
	completedTasks: number;
}

interface RecentActivity {
	id: string;
	type: string;
	title: string;
	action: string;
	time: string;
	status: string;
}

interface UpcomingEvent {
	id: string;
	title: string;
	time: string;
	type: string;
}

const quickActions = [
	{ title: "Log Hours", href: "/dashboard/hours", icon: Clock, description: "Track your availability" },
	{ title: "Add Learning", href: "/dashboard/learnings", icon: BookOpen, description: "Save new resources" },
	{ title: "New Project", href: "/dashboard/projects", icon: FolderOpen, description: "Create workspace" },
	{ title: "Update Profile", href: "/dashboard/profile", icon: User, description: "Edit your info" }
];

export default function DashboardHome() {
	const supabase = getSupabaseClient();
	const [stats, setStats] = useState<DashboardStats>({
		totalHours: 0,
		activeProjects: 0,
		teamMembers: 0,
		completedTasks: 0,
	});
	const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
	const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadDashboardData();
	}, []);

	async function loadDashboardData() {
		setLoading(true);
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			// Load stats in parallel
			const [
				hoursResult,
				projectsResult,
				tasksResult,
				activityResult
			] = await Promise.all([
				// Total hours from calendar availability
				supabase
					.from("calendar_availability")
					.select("start_time, end_time")
					.eq("user_id", user.id),
				
				// Active projects
				supabase
					.from("projects")
					.select("id, status")
					.eq("owner_id", user.id)
					.in("status", ["planning", "active"]),
				
				// Completed tasks
				supabase
					.from("project_tasks")
					.select("id, status")
					.eq("assigned_to", user.id)
					.eq("status", "completed"),
				
				// Recent activity (simplified for now)
				supabase
					.from("projects")
					.select("id, name, updated_at")
					.eq("owner_id", user.id)
					.order("updated_at", { ascending: false })
					.limit(4)
			]);

			// Calculate total hours
			let totalHours = 0;
			if (hoursResult.data) {
				hoursResult.data.forEach(availability => {
					const start = new Date(`2000-01-01T${availability.start_time}`);
					const end = new Date(`2000-01-01T${availability.end_time}`);
					totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
				});
			}

			// Set stats
			setStats({
				totalHours: Math.round(totalHours * 10) / 10,
				activeProjects: projectsResult.data?.length || 0,
				teamMembers: 1, // For now, just the user
				completedTasks: tasksResult.data?.length || 0,
			});

			// Set recent activity
			if (activityResult.data) {
				const activities: RecentActivity[] = activityResult.data.map((project, index) => ({
					id: project.id,
					type: "project",
					title: project.name,
					action: "updated",
					time: getTimeAgo(project.updated_at),
					status: "info"
				}));
				setRecentActivity(activities);
			}

			// Set upcoming events (placeholder for now)
			setUpcomingEvents([]);

		} catch (error) {
			console.error("Error loading dashboard data:", error);
			toast.error("Error", "Failed to load dashboard data");
		} finally {
			setLoading(false);
		}
	}

	function getTimeAgo(dateString: string): string {
		const now = new Date();
		const date = new Date(dateString);
		const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
		
		if (diffInHours < 1) return "Just now";
		if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
		
		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
		
		const diffInWeeks = Math.floor(diffInDays / 7);
		return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
	}

	if (loading) {
		return <DashboardSkeleton />;
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Mobile Header */}
			<div className="lg:hidden">
				<MobilePageHeader
					title="Dashboard"
					description="Welcome back! Here's what's happening with your projects."
					actions={
						<div className="flex gap-2">
							<Button size="sm" variant="ghost" className="lg:hidden">
								<Bell className="h-4 w-4" />
							</Button>
							<Button size="sm" variant="ghost" className="lg:hidden">
								<Settings className="h-4 w-4" />
							</Button>
						</div>
					}
				/>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 lg:space-y-6">
				{/* Desktop Header */}
				<div className="hidden lg:flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
						<p className="text-muted-foreground">Welcome back! Here&#39;s what&#39;s happening with your projects.</p>
					</div>
					<div className="flex gap-3">
						<Button variant="outline">
							<Settings className="h-4 w-4 mr-2" />
							Settings
						</Button>
						<Button asChild>
							<Link href="/dashboard/projects">
								<Plus className="h-4 w-4 mr-2" />
								New Project
							</Link>
						</Button>
					</div>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
					<Card className="relative overflow-hidden">
						<CardContent className="p-3 lg:p-6">
							<div className="flex items-start justify-between mb-2">
								<div className="min-w-0 flex-1">
									<p className="text-xs lg:text-sm font-medium text-muted-foreground truncate">Total Hours</p>
								</div>
								<Clock className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 shrink-0 ml-1" />
							</div>
							<div className="space-y-1">
								<p className="text-xl lg:text-2xl font-bold">{stats.totalHours}h</p>
								<p className="text-xs text-muted-foreground">This month</p>
							</div>
						</CardContent>
					</Card>

					<Card className="relative overflow-hidden">
						<CardContent className="p-3 lg:p-6">
							<div className="flex items-start justify-between mb-2">
								<div className="min-w-0 flex-1">
									<p className="text-xs lg:text-sm font-medium text-muted-foreground truncate">Active Projects</p>
								</div>
								<FolderOpen className="h-4 w-4 lg:h-5 lg:w-5 text-green-600 shrink-0 ml-1" />
							</div>
							<div className="space-y-1">
								<p className="text-xl lg:text-2xl font-bold">{stats.activeProjects}</p>
								<p className="text-xs text-muted-foreground">In progress</p>
							</div>
						</CardContent>
					</Card>

					<Card className="relative overflow-hidden">
						<CardContent className="p-3 lg:p-6">
							<div className="flex items-start justify-between mb-2">
								<div className="min-w-0 flex-1">
									<p className="text-xs lg:text-sm font-medium text-muted-foreground truncate">Team Members</p>
								</div>
								<Users className="h-4 w-4 lg:h-5 lg:w-5 text-purple-600 shrink-0 ml-1" />
							</div>
							<div className="space-y-1">
								<p className="text-xl lg:text-2xl font-bold">{stats.teamMembers}</p>
								<p className="text-xs text-muted-foreground">Collaborating</p>
							</div>
						</CardContent>
					</Card>

					<Card className="relative overflow-hidden">
						<CardContent className="p-3 lg:p-6">
							<div className="flex items-start justify-between mb-2">
								<div className="min-w-0 flex-1">
									<p className="text-xs lg:text-sm font-medium text-muted-foreground truncate">Completed Tasks</p>
								</div>
								<CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-emerald-600 shrink-0 ml-1" />
							</div>
							<div className="space-y-1">
								<p className="text-xl lg:text-2xl font-bold">{stats.completedTasks}</p>
								<p className="text-xs text-muted-foreground">This month</p>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
					{/* Left Column - Quick Actions & Recent Activity */}
					<div className="lg:col-span-2 space-y-4 lg:space-y-6">
						{/* Quick Actions */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Zap className="h-5 w-5" />
									Quick Actions
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 lg:p-6">
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
									{quickActions.map((action, index) => (
										<Link key={index} href={action.href}>
											<div className="group p-3 lg:p-4 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer h-full">
												<div className="flex items-start gap-3">
													<div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
														<action.icon className="h-4 w-4 text-primary" />
													</div>
													<div className="flex-1 min-w-0">
														<h3 className="font-medium group-hover:text-primary transition-colors text-sm lg:text-base">{action.title}</h3>
														<p className="text-xs lg:text-sm text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
													</div>
													<ArrowRight className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
												</div>
											</div>
										</Link>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Recent Activity */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Activity className="h-5 w-5" />
									Recent Activity
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 lg:p-6">
								<div className="space-y-3 lg:space-y-4">
									{recentActivity.length > 0 ? (
										recentActivity.map((activity) => (
											<div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
												<div className={`p-1.5 lg:p-2 rounded-full shrink-0 ${
													activity.status === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' :
													activity.status === 'pending' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' :
													'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
												}`}> 
													{activity.status === 'success' ? <CheckCircle className="h-3 w-3" /> :
													 activity.status === 'pending' ? <AlertCircle className="h-3 w-3" /> :
													 <Star className="h-3 w-3" />}
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium truncate">{activity.title}</p>
													<p className="text-xs text-muted-foreground">{activity.action} • {activity.time}</p>
												</div>
											</div>
										))
									) : (
										<div className="text-center py-8 text-muted-foreground">
											<Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
											<p>No recent activity</p>
											<p className="text-sm mt-1">Start by creating a project or logging hours</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Right Column - Upcoming Events & Progress */}
					<div className="space-y-4 lg:space-y-6">
						{/* Upcoming Events */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Calendar className="h-5 w-5" />
									Upcoming Events
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 lg:p-6">
								<div className="space-y-3">
									{upcomingEvents.length > 0 ? (
										upcomingEvents.map((event) => (
											<div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
												<div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium truncate">{event.title}</p>
													<p className="text-xs text-muted-foreground mt-1">{event.time}</p>
												</div>
												<Badge variant="outline" className="text-xs shrink-0">
													{event.type}
												</Badge>
											</div>
										))
									) : (
										<div className="text-center py-8 text-muted-foreground">
											<Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
											<p>No upcoming events</p>
											<p className="text-sm mt-1">Set deadlines or create tasks</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Progress Card */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Target className="h-5 w-5" />
									This Week&#39;s Progress
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 lg:p-6">
								<div className="space-y-4 lg:space-y-5">
									<div>
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium">Hours Logged</span>
											<span className="text-sm text-muted-foreground">{stats.totalHours}/40h</span>
										</div>
										<div className="w-full bg-secondary rounded-full h-2.5 lg:h-2">
											<div 
												className="bg-primary h-2.5 lg:h-2 rounded-full transition-all duration-300" 
												style={{ width: `${Math.min((stats.totalHours / 40) * 100, 100)}%` }}
											></div>
										</div>
									</div>
									<div>
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium">Active Projects</span>
											<span className="text-sm text-muted-foreground">{stats.activeProjects}/10</span>
										</div>
										<div className="w-full bg-secondary rounded-full h-2.5 lg:h-2">
											<div 
												className="bg-green-500 h-2.5 lg:h-2 rounded-full transition-all duration-300" 
												style={{ width: `${Math.min((stats.activeProjects / 10) * 100, 100)}%` }}
											></div>
										</div>
									</div>
									<div>
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium">Completed Tasks</span>
											<span className="text-sm text-muted-foreground">{stats.completedTasks}/20</span>
										</div>
										<div className="w-full bg-secondary rounded-full h-2.5 lg:h-2">
											<div 
												className="bg-blue-500 h-2.5 lg:h-2 rounded-full transition-all duration-300" 
												style={{ width: `${Math.min((stats.completedTasks / 20) * 100, 100)}%` }}
											></div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Mobile Quick Actions */}
						<div className="lg:hidden">
							<Card>
								<CardHeader>
									<CardTitle className="text-base">Quick Navigation</CardTitle>
								</CardHeader>
								<CardContent className="p-4">
									<div className="grid grid-cols-2 gap-3">
										{quickActions.map((action, index) => (
											<Link key={index} href={action.href}>
												<Button variant="outline" className="w-full h-20 flex-col gap-2 p-3">
													<action.icon className="h-5 w-5" />
													<span className="text-xs font-medium">{action.title}</span>
												</Button>
											</Link>
										))}
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}