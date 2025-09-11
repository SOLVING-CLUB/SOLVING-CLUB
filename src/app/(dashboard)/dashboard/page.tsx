"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
	Users, 
	Clock, 
	BookOpen, 
	FolderOpen, 
	User,
	TrendingUp,
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

// Sample data
const stats = [
	{ title: "Total Hours", value: "124.5", change: "+12%", icon: Clock, color: "text-blue-600" },
	{ title: "Active Projects", value: "8", change: "+2", icon: FolderOpen, color: "text-green-600" },
	{ title: "Team Members", value: "15", change: "+3", icon: Users, color: "text-purple-600" },
	{ title: "Completed Tasks", value: "47", change: "+8", icon: CheckCircle, color: "text-emerald-600" }
];

const recentActivity = [
	{ id: 1, type: "project", title: "Web Design Project", action: "completed", time: "2 hours ago", status: "success" },
	{ id: 2, type: "meeting", title: "Team Standup", action: "scheduled", time: "4 hours ago", status: "pending" },
	{ id: 3, type: "learning", title: "React Advanced Patterns", action: "added", time: "1 day ago", status: "info" },
	{ id: 4, type: "availability", title: "Updated availability", action: "modified", time: "2 days ago", status: "info" }
];

const upcomingEvents = [
	{ id: 1, title: "Client Meeting", time: "Today, 2:00 PM", type: "meeting" },
	{ id: 2, title: "Project Deadline", time: "Tomorrow", type: "deadline" },
	{ id: 3, title: "Team Workshop", time: "Friday, 10:00 AM", type: "workshop" }
];

const quickActions = [
	{ title: "Log Hours", href: "/dashboard/hours", icon: Clock, description: "Track your availability" },
	{ title: "Add Learning", href: "/dashboard/learnings", icon: BookOpen, description: "Save new resources" },
	{ title: "New Project", href: "/dashboard/projects", icon: FolderOpen, description: "Create workspace" },
	{ title: "Update Profile", href: "/dashboard/profile", icon: User, description: "Edit your info" }
];

export default function DashboardHome() {
	const [selectedTab, setSelectedTab] = useState("overview");

	return (
		<div className="min-h-screen bg-background">
			{/* Mobile Header */}
			<div className="lg:hidden bg-card border-b p-4">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl font-semibold">Dashboard</h1>
						<p className="text-sm text-muted-foreground">Welcome back!</p>
					</div>
					<div className="flex gap-2">
						<Button size="sm" variant="ghost">
							<Bell className="h-4 w-4" />
						</Button>
						<Button size="sm" variant="ghost">
							<Settings className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto p-3 lg:p-6 space-y-4 lg:space-y-6">
				{/* Desktop Header */}
				<div className="hidden lg:flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
						<p className="text-muted-foreground">Welcome back! Here's what's happening with your projects.</p>
					</div>
					<div className="flex gap-3">
						<Button variant="outline">
							<Settings className="h-4 w-4 mr-2" />
							Settings
						</Button>
						<Button>
							<Plus className="h-4 w-4 mr-2" />
							New Project
						</Button>
					</div>
				</div>

		{/* Stats Grid */}
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
			{stats.map((stat, index) => (
				<Card key={index} className="relative overflow-hidden">
					<CardContent className="p-3 lg:p-6">
						<div className="flex items-start justify-between mb-2">
							<div className="min-w-0 flex-1">
								<p className="text-xs lg:text-sm font-medium text-muted-foreground truncate">{stat.title}</p>
							</div>
							<stat.icon className={`h-4 w-4 lg:h-5 lg:w-5 ${stat.color} shrink-0 ml-1`} />
						</div>
						<div className="space-y-1">
							<p className="text-xl lg:text-2xl font-bold">{stat.value}</p>
							<p className="text-xs text-muted-foreground">
								<span className="text-green-600">{stat.change}</span> vs last month
							</p>
						</div>
					</CardContent>
				</Card>
			))}
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
									{recentActivity.map((activity) => (
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
									))}
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
									{upcomingEvents.map((event) => (
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
									))}
								</div>
							</CardContent>
			</Card>

						{/* Progress Card */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Target className="h-5 w-5" />
									This Week's Progress
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 lg:p-6">
								<div className="space-y-4 lg:space-y-5">
									<div>
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium">Hours Logged</span>
											<span className="text-sm text-muted-foreground">32/40</span>
										</div>
										<div className="w-full bg-secondary rounded-full h-2.5 lg:h-2">
											<div className="bg-primary h-2.5 lg:h-2 rounded-full transition-all duration-300" style={{ width: '80%' }}></div>
										</div>
									</div>
									<div>
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium">Projects</span>
											<span className="text-sm text-muted-foreground">6/8</span>
										</div>
										<div className="w-full bg-secondary rounded-full h-2.5 lg:h-2">
											<div className="bg-green-500 h-2.5 lg:h-2 rounded-full transition-all duration-300" style={{ width: '75%' }}></div>
										</div>
									</div>
									<div>
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium">Learning Goals</span>
											<span className="text-sm text-muted-foreground">3/5</span>
										</div>
										<div className="w-full bg-secondary rounded-full h-2.5 lg:h-2">
											<div className="bg-blue-500 h-2.5 lg:h-2 rounded-full transition-all duration-300" style={{ width: '60%' }}></div>
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