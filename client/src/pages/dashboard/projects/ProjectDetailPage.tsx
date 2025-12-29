
import { useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ProjectMeetingsTab } from "@/components/project-meetings/ProjectMeetingsTab";
import { Link, useParams, useLocation } from "wouter";
import FileUpload from "@/components/file-upload";
import { ProjectFinanceManager } from "@/components/project-finance/project-finance-manager";
import { ProjectTaskTracker } from "@/components/project-tasks/ProjectTaskTracker";

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

interface Member {
	id: string;
	user_id: string;
	role: 'owner' | 'admin' | 'member';
	joined_at: string;
	user: {
		full_name?: string;
		avatar_url?: string;
	};
}

interface Message {
	id: string;
	content: string;
	created_at: string;
	user_id?: string;
	user: {
		full_name?: string;
		avatar_url?: string;
	};
}

export default function ProjectDetailPage() {
	const params = useParams();
	const [location] = useLocation();
	const projectId = params.id as string;
	const supabase = getSupabaseClient();
	
	const [project, setProject] = useState<Project | null>(null);
	const [members, setMembers] = useState<Member[]>([]);
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(false);
	
	// Initialize activeTab from URL hash, default to "overview"
	const getInitialTab = () => {
		const hash = window.location.hash.slice(1); // Remove the '#'
		const validTabs = ['overview', 'tasks', 'members', 'files', 'finance', 'meetings', 'chat'];
		return validTabs.includes(hash) ? hash : 'overview';
	};
	const [activeTab, setActiveTab] = useState(getInitialTab);
	
	// Update tab when hash changes
	useEffect(() => {
		const updateTabFromHash = () => {
			const hash = window.location.hash.slice(1);
			const validTabs = ['overview', 'tasks', 'members', 'files', 'finance', 'meetings', 'chat'];
			if (validTabs.includes(hash)) {
				setActiveTab(hash);
			}
		};
		
		// Update on location change
		updateTabFromHash();
		
		// Also listen for hashchange events (in case hash changes without navigation)
		window.addEventListener('hashchange', updateTabFromHash);
		
		return () => {
			window.removeEventListener('hashchange', updateTabFromHash);
		};
	}, [location]);
	
	
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

		// Load members then enrich with profiles
		const { data: memberRows } = await supabase
			.from("project_members")
			.select("*")
			.eq("project_id", projectId);

		const memberList = (memberRows as Array<{ id: string; user_id: string; role: Member['role']; joined_at: string }> | null) ?? [];
		let membersEnriched: Member[] = [];
		if (memberList.length > 0) {
			const ids = Array.from(new Set(memberList.map(m => m.user_id)));
			const { data: profiles } = await supabase
				.from('profiles')
				.select('id, full_name, avatar_url')
				.in('id', ids);
			const map = ((profiles ?? []) as Array<{ id: string; full_name?: string; avatar_url?: string }>).reduce((acc, p) => {
				acc[p.id] = p;
				return acc;
			}, {} as Record<string, { id: string; full_name?: string; avatar_url?: string }>);
			membersEnriched = memberList.map(m => ({
				id: m.id,
				user_id: m.user_id,
				role: m.role,
				joined_at: m.joined_at,
				user: { full_name: map[m.user_id]?.full_name, avatar_url: map[m.user_id]?.avatar_url },
			}));
		}
		setMembers(membersEnriched);

		// Load messages then enrich with profiles
		const { data: messageRows } = await supabase
			.from("project_messages")
			.select("*")
			.eq("project_id", projectId)
			.order("created_at", { ascending: true });
		const msgList = (messageRows as Array<{ id: string; user_id: string; content: string; created_at: string }> | null) ?? [];
		let messagesEnriched: Message[] = [];
		if (msgList.length > 0) {
			const ids = Array.from(new Set(msgList.map(m => m.user_id)));
			const { data: profiles } = await supabase
				.from('profiles')
				.select('id, full_name, avatar_url')
				.in('id', ids);
			const map = ((profiles ?? []) as Array<{ id: string; full_name?: string; avatar_url?: string }>).reduce((acc, p) => {
				acc[p.id] = p;
				return acc;
			}, {} as Record<string, { id: string; full_name?: string; avatar_url?: string }>);
			messagesEnriched = msgList.map(m => ({
				id: m.id,
				content: m.content,
				created_at: m.created_at,
				user_id: m.user_id,
				user: { full_name: map[m.user_id]?.full_name, avatar_url: map[m.user_id]?.avatar_url },
			}));
		}
		setMessages(messagesEnriched);
        setLoading(false);
    }, [projectId, supabase]);

	useEffect(() => {
		if (projectId) {
			loadProjectData();
			// Realtime subscriptions
			const channel = supabase
				.channel(`project-${projectId}`)
				.on('postgres_changes', { event: '*', schema: 'public', table: 'project_members', filter: `project_id=eq.${projectId}` }, () => loadProjectData())
				.on('postgres_changes', { event: '*', schema: 'public', table: 'project_messages', filter: `project_id=eq.${projectId}` }, () => loadProjectData())
				.on('postgres_changes', { event: '*', schema: 'public', table: 'project_files', filter: `project_id=eq.${projectId}` }, () => loadProjectData())
				.subscribe();

			return () => {
				supabase.removeChannel(channel);
			};
		}
	}, [projectId, loadProjectData, supabase]);


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
				<TabsList className="grid w-full grid-cols-7">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="tasks">Tasks</TabsTrigger>
					<TabsTrigger value="members">Members</TabsTrigger>
					<TabsTrigger value="files">Files</TabsTrigger>
					<TabsTrigger value="finance">Finance</TabsTrigger>
					<TabsTrigger value="meetings">Meetings</TabsTrigger>
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
								<div className="text-3xl font-bold">-</div>
								<p className="text-sm text-muted-foreground">
									View in Tasks tab
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
									-
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
					<ProjectTaskTracker projectId={projectId} members={members} />
				</TabsContent>

				{/* Meetings Tab */}
				<TabsContent value="meetings" className="space-y-6">
					<ProjectMeetingsTab projectId={projectId} />
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

				{/* Finance Tab */}
				<TabsContent value="finance" className="space-y-6">
					<ProjectFinanceManager projectId={projectId} projectName={project?.name || ''} />
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
