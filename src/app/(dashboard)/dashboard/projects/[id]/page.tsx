"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
	Plus, 
	Users, 
	Calendar, 
	FileText, 
	Settings, 
	UserPlus,
	Send,
	MoreVertical,
	User
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import FileUpload from "@/components/file-upload";

interface Project {
	id: string;
	name: string;
	description: string;
	    status: 'planning' | 'active' | 'completed' | 'on-hold';
	created_at: string;
	updated_at: string;
	owner_id: string;
	client_name?: string;
	client_email?: string;
	client_company?: string;
	client_phone?: string;
	client_notes?: string;
}

interface Task {
	id: string;
	title: string;
	description: string;
	    status: 'todo' | 'in-progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
	due_date: string;
	assigned_to: string;
	created_at: string;
}

interface Member {
	id: string;
	user_id: string;
	role: 'owner' | 'admin' | 'member';
	joined_at: string;
	user: {
		full_name: string;
		avatar_url: string;
	};
}

interface Message {
	id: string;
	content: string;
	created_at: string;
	user: {
		full_name: string;
		avatar_url: string;
	};
}

type NewTask = {
	title: string;
	description: string;
	priority: 'low' | 'medium' | 'high';
	due_date: string;
	assigned_to: string;
};

export default function ProjectDetailPage() {
	const params = useParams();
	const projectId = params.id as string;
	const supabase = getSupabaseBrowserClient();
	
	const [project, setProject] = useState<Project | null>(null);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [members, setMembers] = useState<Member[]>([]);
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("overview");
	
	// New task form
	const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
	const [newTask, setNewTask] = useState<NewTask>({
		title: "",
		description: "",
		priority: "medium",
		due_date: "",
		assigned_to: ""
	});
	
	// Chat
	const [newMessage, setNewMessage] = useState("");

	useEffect(() => {
		if (projectId) {
			// defer to the effect declared after loadProjectData
		}
	}, [projectId]);

	const loadProjectData = useCallback(async () => {
		setLoading(true);
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;

		// Load project
		const { data: projectData, error: projectError } = await supabase
			.from("projects")
			.select("*")
			.eq("id", projectId)
			.single();

		if (projectError) {
			toast.error("Failed to load project");
			setLoading(false);
			return;
		}

		setProject(projectData);

		// Load tasks
		const { data: tasksData } = await supabase
			.from("project_tasks")
			.select("*")
			.eq("project_id", projectId)
			.order("created_at", { ascending: false });

		setTasks(tasksData || []);

		// Load members
		const { data: membersData } = await supabase
			.from("project_members")
			.select(`
				*,
				user:profiles(full_name, avatar_url)
			`)
			.eq("project_id", projectId);

		setMembers(membersData || []);

		// Load messages
		const { data: messagesData } = await supabase
			.from("project_messages")
			.select(`
				*,
				user:profiles(full_name, avatar_url)
			`)
			.eq("project_id", projectId)
			.order("created_at", { ascending: true });

		        setMessages(messagesData || []);
        setLoading(false);
    }, [projectId, supabase]);

	useEffect(() => {
		if (projectId) {
			loadProjectData();
		}
	}, [projectId, loadProjectData]);

	async function createTask() {
		if (!newTask.title.trim()) {
			toast.error("Task title is required");
			return;
		}

		setLoading(true);
		const { error } = await supabase
			.from("project_tasks")
			.insert({
				project_id: projectId,
				title: newTask.title,
				description: newTask.description,
				priority: newTask.priority,
				due_date: newTask.due_date || null,
				assigned_to: newTask.assigned_to || null,
				status: "todo"
			});

		if (error) {
			toast.error("Failed to create task");
			setLoading(false);
			return;
		}

		toast.success("Task created successfully");
		setNewTask({ title: "", description: "", priority: "medium", due_date: "", assigned_to: "" });
		setIsTaskDialogOpen(false);
		loadProjectData();
	}

	async function sendMessage() {
		if (!newMessage.trim()) {
			toast.error("Message cannot be empty");
			return;
		}

		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;

		const { error } = await supabase
			.from("project_messages")
			.insert({
				project_id: projectId,
				user_id: user.id,
				content: newMessage
			});

		if (error) {
			toast.error("Failed to send message");
			return;
		}

		setNewMessage("");
		loadProjectData();
	}

	const getStatusColor = (status: string) => {
		switch (status) {
					case 'planning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
		case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
		case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
		case 'on-hold': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	};

	const getTaskStatusColor = (status: string) => {
		switch (status) {
					case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
		case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
		default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
					case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
		case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
		case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
		default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	};

	if (loading && !project) {
		return (
			<div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				<Card>
					<CardContent className="p-12 text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
						<p className="mt-4 text-muted-foreground">Loading project...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!project) {
		return (
			<div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				<Card>
					<CardContent className="p-12 text-center">
						<FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
						<h3 className="text-lg font-semibold mb-2">Project not found</h3>
						<p className="text-muted-foreground mb-4">The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
						<Link href="/dashboard/projects">
							<Button>Back to Projects</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
			{/* Header */}
			<Card className="mb-6">
				<CardHeader className="pb-4">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="flex-1">
							<div className="flex items-center gap-3 mb-2">
								<Link href="/dashboard/projects">
									<Button variant="outline" size="sm">
										← Back
									</Button>
								</Link>
								<CardTitle className="text-2xl">{project.name}</CardTitle>
								<Badge className={getStatusColor(project.status)}>
									{project.status.charAt(0).toUpperCase() + project.status.slice(1)}
								</Badge>
							</div>
							<CardDescription>{project.description}</CardDescription>
							{(project.client_name || project.client_company) && (
								<div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
									<User className="h-4 w-4" />
									<span>{project.client_name || 'Client'}</span>
									{project.client_company && (
										<span className="text-muted-foreground/80">— {project.client_company}</span>
									)}
								</div>
							)}
						</div>
						<div className="flex items-center gap-2">
							<Button variant="outline" size="sm">
								<UserPlus className="h-4 w-4 mr-2" />
								Invite Members
							</Button>
							<Link href={`/dashboard/projects/${projectId}/settings`}>
								<Button variant="outline" size="sm">
									<Settings className="h-4 w-4" />
								</Button>
							</Link>
						</div>
					</div>
				</CardHeader>
			</Card>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="tasks">Tasks</TabsTrigger>
					<TabsTrigger value="members">Members</TabsTrigger>
					<TabsTrigger value="files">Files</TabsTrigger>
					<TabsTrigger value="chat">Chat</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" className="space-y-6">
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						<Card>
							<CardHeader className="pb-4">
								<CardTitle className="text-lg flex items-center gap-2">
									<Users className="h-5 w-5" />
									Team Members
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold">{members.length}</div>
								<p className="text-sm text-muted-foreground">Active members</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-4">
								<CardTitle className="text-lg flex items-center gap-2">
									<FileText className="h-5 w-5" />
									Tasks
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold">{tasks.length}</div>
								<p className="text-sm text-muted-foreground">
									{tasks.filter(t => t.status === 'completed').length} completed
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-4">
								<CardTitle className="text-lg flex items-center gap-2">
									<Calendar className="h-5 w-5" />
									Progress
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold">
									{tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%
								</div>
								<p className="text-sm text-muted-foreground">Tasks completed</p>
							</CardContent>
						</Card>
					</div>

					{/* Recent Activity */}
					<Card>
						<CardHeader>
							<CardTitle>Recent Activity</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{messages.slice(-5).map((message) => (
									<div key={message.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
										<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
											<span className="text-sm font-medium">
												{message.user.full_name?.[0]?.toUpperCase() || "?"}
											</span>
										</div>
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<span className="font-medium text-sm">{message.user.full_name}</span>
												<span className="text-xs text-muted-foreground">
													{new Date(message.created_at).toLocaleString()}
												</span>
											</div>
											<p className="text-sm text-muted-foreground">{message.content}</p>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tasks Tab */}
				<TabsContent value="tasks" className="space-y-6">
					<Card>
						<CardHeader className="pb-4">
							<div className="flex items-center justify-between">
								<CardTitle className="text-lg">Tasks</CardTitle>
								<Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
									<DialogTrigger asChild>
										<Button size="sm">
											<Plus className="h-4 w-4 mr-2" />
											Add Task
										</Button>
									</DialogTrigger>
									<DialogContent className="sm:max-w-md">
										<DialogHeader>
											<DialogTitle>Create New Task</DialogTitle>
											<DialogDescription>
												Add a new task to track project progress.
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="task-title">Task Title *</Label>
												<Input
													id="task-title"
													placeholder="e.g. Design homepage mockup"
													value={newTask.title}
													onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="task-description">Description</Label>
												<Textarea
													id="task-description"
													placeholder="Describe the task requirements..."
													value={newTask.description}
													onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
													rows={3}
												/>
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="task-priority">Priority</Label>
													<select
														id="task-priority"
														className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
														value={newTask.priority}
														onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as NewTask['priority'] }))}
													>
														<option value="low">Low</option>
														<option value="medium">Medium</option>
														<option value="high">High</option>
													</select>
												</div>
												<div className="space-y-2">
													<Label htmlFor="task-due-date">Due Date</Label>
													<Input
														id="task-due-date"
														type="date"
														value={newTask.due_date}
														onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
													/>
												</div>
											</div>
										</div>
										<DialogFooter>
											<Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
												Cancel
											</Button>
											<Button onClick={createTask} disabled={loading}>
												{loading ? "Creating..." : "Create Task"}
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{tasks.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground">
										<FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
										<p>No tasks yet</p>
										<p className="text-sm mt-1">Create your first task to get started</p>
									</div>
								) : (
									tasks.map((task) => (
										<div key={task.id} className="flex items-center gap-4 p-4 border rounded-lg">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<h4 className="font-medium">{task.title}</h4>
													<Badge className={getTaskStatusColor(task.status)}>
														{task.status.replace('-', ' ')}
													</Badge>
													<Badge className={getPriorityColor(task.priority)}>
														{task.priority}
													</Badge>
												</div>
												{task.description && (
													<p className="text-sm text-muted-foreground">{task.description}</p>
												)}
												{task.due_date && (
													<div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
														<Calendar className="h-3 w-3" />
														Due: {new Date(task.due_date).toLocaleDateString()}
													</div>
												)}
											</div>
											<Button variant="outline" size="sm">
												<MoreVertical className="h-4 w-4" />
											</Button>
										</div>
									))
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Members Tab */}
				<TabsContent value="members" className="space-y-6">
					<Card>
						<CardHeader className="pb-4">
							<div className="flex items-center justify-between">
								<CardTitle className="text-lg">Team Members</CardTitle>
								<Button size="sm">
									<UserPlus className="h-4 w-4 mr-2" />
									Invite Member
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{members.map((member) => (
									<div key={member.id} className="flex items-center gap-4 p-4 border rounded-lg">
										<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
											<span className="text-sm font-medium">
												{member.user.full_name?.[0]?.toUpperCase() || "?"}
											</span>
										</div>
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<h4 className="font-medium">{member.user.full_name}</h4>
												<Badge variant="outline">
													{member.role}
												</Badge>
											</div>
											<p className="text-sm text-muted-foreground">
												Joined {new Date(member.joined_at).toLocaleDateString()}
											</p>
										</div>
										<Button variant="outline" size="sm">
											<MoreVertical className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Files Tab */}
				<TabsContent value="files" className="space-y-6">
					<FileUpload projectId={projectId} onFileUploaded={loadProjectData} />
				</TabsContent>

				{/* Chat Tab */}
				<TabsContent value="chat" className="space-y-6">
					<Card className="h-[600px] flex flex-col">
						<CardHeader className="pb-4">
							<CardTitle className="text-lg">Project Chat</CardTitle>
						</CardHeader>
						<CardContent className="flex-1 flex flex-col">
							{/* Messages */}
							<div className="flex-1 overflow-y-auto space-y-4 mb-4">
								{messages.map((message) => (
									<div key={message.id} className="flex items-start gap-3">
										<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
											<span className="text-sm font-medium">
												{message.user.full_name?.[0]?.toUpperCase() || "?"}
											</span>
										</div>
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<span className="font-medium text-sm">{message.user.full_name}</span>
												<span className="text-xs text-muted-foreground">
													{new Date(message.created_at).toLocaleString()}
												</span>
											</div>
											<p className="text-sm">{message.content}</p>
										</div>
									</div>
								))}
							</div>
							
							{/* Message Input */}
							<div className="flex gap-2">
								<Input
									placeholder="Type a message..."
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
								/>
								<Button onClick={sendMessage} disabled={!newMessage.trim()}>
									<Send className="h-4 w-4" />
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
