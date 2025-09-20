"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
	Calendar, 
	Users, 
	Clock, 
	Target, 
	CheckCircle, 
	AlertCircle, 
	TrendingUp,
	FileText,
	MessageSquare,
	Settings,
	BarChart3,
	Activity
} from "lucide-react";

interface ProjectDashboardProps {
	projectId: string;
	project: {
		id: string;
		name: string;
		description: string;
		status: 'planning' | 'active' | 'completed' | 'on-hold';
		created_at: string;
		updated_at: string;
		client_name?: string;
		client_company?: string;
		member_count?: number;
		task_count?: number;
	};
}

interface ProjectPhase {
	id: string;
	name: string;
	description: string;
	status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
	progress: number;
	start_date?: string;
	end_date?: string;
	estimated_days: number;
	actual_days?: number;
	deliverables: string[];
}

interface ProjectTask {
	id: string;
	title: string;
	description: string;
	status: 'todo' | 'in-progress' | 'completed' | 'blocked';
	priority: 'low' | 'medium' | 'high' | 'urgent';
	assignee?: string;
	due_date?: string;
	created_at: string;
	updated_at: string;
}

interface ProjectActivity {
	id: string;
	type: 'task_created' | 'task_completed' | 'phase_started' | 'phase_completed' | 'comment_added' | 'file_uploaded';
	title: string;
	description: string;
	user: string;
	timestamp: string;
}

export function ProjectDashboard({ projectId, project }: ProjectDashboardProps) {
	const [phases, setPhases] = useState<ProjectPhase[]>([]);
	const [tasks, setTasks] = useState<ProjectTask[]>([]);
	const [activities, setActivities] = useState<ProjectActivity[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState('overview');

	// Mock data - in real implementation, this would come from API
	useEffect(() => {
		// Simulate loading
		setTimeout(() => {
			setPhases([
				{
					id: '1',
					name: 'Planning & Design',
					description: 'Requirements gathering, wireframing, and project setup',
					status: 'completed',
					progress: 100,
					start_date: '2024-01-01',
					end_date: '2024-01-05',
					estimated_days: 5,
					actual_days: 4,
					deliverables: ['Project brief', 'Wireframes', 'Technical specification']
				},
				{
					id: '2',
					name: 'Development',
					description: 'Core development and feature implementation',
					status: 'in-progress',
					progress: 65,
					start_date: '2024-01-06',
					estimated_days: 10,
					actual_days: 6,
					deliverables: ['MVP', 'Core features', 'Database setup']
				},
				{
					id: '3',
					name: 'Testing & Deployment',
					description: 'Quality assurance and production deployment',
					status: 'not-started',
					progress: 0,
					estimated_days: 4,
					deliverables: ['Tested application', 'Production deployment', 'Documentation']
				}
			]);

			setTasks([
				{
					id: '1',
					title: 'Set up development environment',
					description: 'Configure local development environment and tools',
					status: 'completed',
					priority: 'high',
					assignee: 'John Doe',
					due_date: '2024-01-02',
					created_at: '2024-01-01T10:00:00Z',
					updated_at: '2024-01-02T15:30:00Z'
				},
				{
					id: '2',
					title: 'Implement user authentication',
					description: 'Create login and registration functionality',
					status: 'in-progress',
					priority: 'high',
					assignee: 'Jane Smith',
					due_date: '2024-01-10',
					created_at: '2024-01-03T09:00:00Z',
					updated_at: '2024-01-08T14:20:00Z'
				},
				{
					id: '3',
					title: 'Design database schema',
					description: 'Create database tables and relationships',
					status: 'completed',
					priority: 'medium',
					assignee: 'Mike Johnson',
					due_date: '2024-01-05',
					created_at: '2024-01-02T11:00:00Z',
					updated_at: '2024-01-04T16:45:00Z'
				},
				{
					id: '4',
					title: 'Implement payment integration',
					description: 'Integrate Stripe payment processing',
					status: 'todo',
					priority: 'high',
					assignee: 'Sarah Wilson',
					due_date: '2024-01-15',
					created_at: '2024-01-05T13:00:00Z',
					updated_at: '2024-01-05T13:00:00Z'
				}
			]);

			setActivities([
				{
					id: '1',
					type: 'task_completed',
					title: 'Task completed',
					description: 'Set up development environment',
					user: 'John Doe',
					timestamp: '2024-01-02T15:30:00Z'
				},
				{
					id: '2',
					type: 'phase_started',
					title: 'Phase started',
					description: 'Development phase has begun',
					user: 'System',
					timestamp: '2024-01-06T09:00:00Z'
				},
				{
					id: '3',
					type: 'task_created',
					title: 'New task created',
					description: 'Implement payment integration',
					user: 'Jane Smith',
					timestamp: '2024-01-05T13:00:00Z'
				}
			]);

			setLoading(false);
		}, 1000);
	}, [projectId]);

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed': return 'bg-green-100 text-green-800';
			case 'in-progress': return 'bg-blue-100 text-blue-800';
			case 'blocked': return 'bg-red-100 text-red-800';
			case 'not-started': return 'bg-gray-100 text-gray-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'urgent': return 'bg-red-100 text-red-800';
			case 'high': return 'bg-orange-100 text-orange-800';
			case 'medium': return 'bg-yellow-100 text-yellow-800';
			case 'low': return 'bg-green-100 text-green-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	};

	const getActivityIcon = (type: string) => {
		switch (type) {
			case 'task_created': return <Target className="h-4 w-4" />;
			case 'task_completed': return <CheckCircle className="h-4 w-4" />;
			case 'phase_started': return <TrendingUp className="h-4 w-4" />;
			case 'phase_completed': return <CheckCircle className="h-4 w-4" />;
			case 'comment_added': return <MessageSquare className="h-4 w-4" />;
			case 'file_uploaded': return <FileText className="h-4 w-4" />;
			default: return <Activity className="h-4 w-4" />;
		}
	};

	const overallProgress = phases.length > 0 
		? Math.round(phases.reduce((sum, phase) => sum + phase.progress, 0) / phases.length)
		: 0;

	const completedTasks = tasks.filter(task => task.status === 'completed').length;
	const totalTasks = tasks.length;
	const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="animate-pulse">
					<div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
					<div className="space-y-4">
						<div className="h-32 bg-gray-200 rounded"></div>
						<div className="h-32 bg-gray-200 rounded"></div>
						<div className="h-32 bg-gray-200 rounded"></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Project Header */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-2xl">{project.name}</CardTitle>
							<CardDescription className="mt-2">
								{project.description}
							</CardDescription>
						</div>
						<div className="flex items-center space-x-4">
							<Badge className={getStatusColor(project.status)}>
								{project.status.replace('-', ' ').toUpperCase()}
							</Badge>
							<Button variant="outline" size="sm">
								<Settings className="h-4 w-4 mr-2" />
								Settings
							</Button>
						</div>
					</div>
					
					{/* Project Stats */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
						<div className="text-center">
							<div className="text-2xl font-bold text-blue-600">{overallProgress}%</div>
							<div className="text-sm text-gray-600">Overall Progress</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-green-600">{completedTasks}/{totalTasks}</div>
							<div className="text-sm text-gray-600">Tasks Completed</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-purple-600">{project.member_count || 0}</div>
							<div className="text-sm text-gray-600">Team Members</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-orange-600">
								{phases.filter(p => p.status === 'completed').length}/{phases.length}
							</div>
							<div className="text-sm text-gray-600">Phases Completed</div>
						</div>
					</div>
				</CardHeader>
			</Card>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="phases">Phases</TabsTrigger>
					<TabsTrigger value="tasks">Tasks</TabsTrigger>
					<TabsTrigger value="activity">Activity</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Progress Overview */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<BarChart3 className="h-5 w-5 mr-2" />
									Progress Overview
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<div className="flex justify-between text-sm mb-2">
										<span>Overall Progress</span>
										<span>{overallProgress}%</span>
									</div>
									<Progress value={overallProgress} className="h-2" />
								</div>
								<div>
									<div className="flex justify-between text-sm mb-2">
										<span>Task Completion</span>
										<span>{taskProgress}%</span>
									</div>
									<Progress value={taskProgress} className="h-2" />
								</div>
							</CardContent>
						</Card>

						{/* Recent Activity */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<Activity className="h-5 w-5 mr-2" />
									Recent Activity
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{activities.slice(0, 5).map((activity) => (
										<div key={activity.id} className="flex items-start space-x-3">
											<div className="flex-shrink-0 mt-1">
												{getActivityIcon(activity.type)}
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium text-gray-900">
													{activity.title}
												</p>
												<p className="text-sm text-gray-600">
													{activity.description}
												</p>
												<p className="text-xs text-gray-500">
													{activity.user} • {new Date(activity.timestamp).toLocaleDateString()}
												</p>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Phases Tab */}
				<TabsContent value="phases" className="space-y-4">
					{phases.map((phase, index) => (
						<Card key={phase.id}>
							<CardContent className="pt-6">
								<div className="flex items-center justify-between mb-4">
									<div className="flex items-center space-x-3">
										<div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
											{index + 1}
										</div>
										<div>
											<h3 className="font-semibold">{phase.name}</h3>
											<p className="text-sm text-gray-600">{phase.description}</p>
										</div>
									</div>
									<Badge className={getStatusColor(phase.status)}>
										{phase.status.replace('-', ' ').toUpperCase()}
									</Badge>
								</div>
								
								<div className="space-y-3">
									<div>
										<div className="flex justify-between text-sm mb-2">
											<span>Progress</span>
											<span>{phase.progress}%</span>
										</div>
										<Progress value={phase.progress} className="h-2" />
									</div>
									
									<div className="grid grid-cols-2 gap-4 text-sm">
										<div>
											<span className="text-gray-600">Estimated:</span> {phase.estimated_days} days
										</div>
										<div>
											<span className="text-gray-600">Actual:</span> {phase.actual_days || 0} days
										</div>
									</div>
									
									<div>
										<div className="text-sm font-medium mb-2">Deliverables:</div>
										<div className="flex flex-wrap gap-2">
											{phase.deliverables.map((deliverable, idx) => (
												<Badge key={idx} variant="outline" className="text-xs">
													{deliverable}
												</Badge>
											))}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</TabsContent>

				{/* Tasks Tab */}
				<TabsContent value="tasks" className="space-y-4">
					{tasks.map((task) => (
						<Card key={task.id}>
							<CardContent className="pt-6">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center space-x-3 mb-2">
											<h3 className="font-semibold">{task.title}</h3>
											<Badge className={getStatusColor(task.status)}>
												{task.status.replace('-', ' ').toUpperCase()}
											</Badge>
											<Badge className={getPriorityColor(task.priority)}>
												{task.priority.toUpperCase()}
											</Badge>
										</div>
										<p className="text-sm text-gray-600 mb-3">{task.description}</p>
										<div className="flex items-center space-x-4 text-sm text-gray-500">
											{task.assignee && (
												<div className="flex items-center">
													<Users className="h-4 w-4 mr-1" />
													{task.assignee}
												</div>
											)}
											{task.due_date && (
												<div className="flex items-center">
													<Calendar className="h-4 w-4 mr-1" />
													Due: {new Date(task.due_date).toLocaleDateString()}
												</div>
											)}
										</div>
									</div>
									<Button variant="outline" size="sm">
										Edit
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</TabsContent>

				{/* Activity Tab */}
				<TabsContent value="activity" className="space-y-4">
					{activities.map((activity) => (
						<Card key={activity.id}>
							<CardContent className="pt-6">
								<div className="flex items-start space-x-3">
									<div className="flex-shrink-0 mt-1">
										{getActivityIcon(activity.type)}
									</div>
									<div className="flex-1">
										<div className="flex items-center justify-between">
											<h3 className="font-semibold">{activity.title}</h3>
											<span className="text-sm text-gray-500">
												{new Date(activity.timestamp).toLocaleDateString()}
											</span>
										</div>
										<p className="text-sm text-gray-600 mt-1">
											{activity.description}
										</p>
										<p className="text-xs text-gray-500 mt-2">
											by {activity.user}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</TabsContent>
			</Tabs>
		</div>
	);
}
