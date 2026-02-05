
import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { ProjectsSkeleton } from "@/components/ui/loading-states";
import { Plus, Search, Users, Calendar, FileText, MessageSquare, Settings, Eye, Loader2, LayoutTemplate } from "lucide-react";
import { Link } from "wouter";
import { ProjectTemplateSelector } from "@/components/project-template-selector";
import { ProjectTemplate } from "@/lib/project-templates";
import { usePermissions } from "@/hooks/usePermissions";
import { withRetry } from "@/lib/utils/retry";
import { getCache, setCache } from "@/lib/utils/cache";

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
	member_count?: number;
	task_count?: number;
}

type MemberProjectsRow = {
	project_id: string;
	projects: Project | null;
};

type NewProject = {
	name: string;
	description: string;
	status: Project['status'];
	client_name?: string;
	client_email?: string;
	client_company?: string;
	client_phone?: string;
	client_notes?: string;
};

type Client = {
	id: string;
	name: string;
	email: string | null;
	company: string | null;
	phone: string | null;
	notes: string | null;
};

type InsertProjectPayload = {
	name: string;
	description: string;
	status: Project['status'];
	owner_id: string;
	client_id: string | null;
	client_name: string | null;
	client_email: string | null;
	client_company: string | null;
	client_phone: string | null;
	client_notes: string | null;
};

export default function ProjectsPage() {
	const supabase = getSupabaseClient();
	const { has, loading: permissionsLoading } = usePermissions();
	const [projects, setProjects] = useState<Project[]>([]);
	const [clients, setClients] = useState<Client[]>([]);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(10);
	const [totalCount, setTotalCount] = useState<number | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
	const [useExistingClient, setUseExistingClient] = useState(true);
	const loadInFlight = useRef<Promise<void> | null>(null);
	const [selectedClientId, setSelectedClientId] = useState<string>("");
	const [newProject, setNewProject] = useState<NewProject>({
		name: "",
		description: "",
		status: "planning",
		client_name: "",
		client_email: "",
		client_company: "",
		client_phone: "",
		client_notes: "",
	});

	const loadProjects = useCallback(async () => {
		if (loadInFlight.current) return;
		const run = (async () => {
		if (permissionsLoading) return;
		setLoading(true);
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			setLoading(false);
			return;
		}

		try {
			const canViewAll = has("projects.view") || has("projects.manage");
			const cacheKey = canViewAll
				? `projects:all:${page}`
				: `projects:own:${user.id}:${page}`;
			const cached = getCache<Project[]>(cacheKey);
			if (cached && cached.length >= 0) {
				setProjects(
					cached.map((project) => ({
						...project,
						member_count: project.member_count ?? null,
						task_count: project.task_count ?? null,
					}))
				);
			}
			let uniqueProjects: Project[] = [];

			if (canViewAll) {
				const { count: total } = await supabase
					.from("projects")
					.select("*", { count: "exact", head: true });
				setTotalCount(total ?? null);

				const { data: pageData, error: pageError } = await supabase
					.from("projects")
					.select("*")
					.order("updated_at", { ascending: false })
					.range((page - 1) * pageSize, page * pageSize - 1);
				if (pageError) throw pageError;

				uniqueProjects = (pageData as Project[] | null) ?? [];
			} else {
				// First, get all projects where user is owner
				const { count: ownedCount } = await supabase
					.from("projects")
					.select("*", { count: "exact", head: true })
					.eq("owner_id", user.id);

				const ownedProjects = await withRetry(async () => {
					const { data, error } = await supabase
						.from("projects")
						.select("*")
						.eq("owner_id", user.id)
						.order("updated_at", { ascending: false })
						.range((page - 1) * pageSize, page * pageSize - 1);
					if (error) throw error;
					return data;
				});

				// Then, get all projects where user is a member
				const { count: memberCount } = await supabase
					.from("project_members")
					.select("*", { count: "exact", head: true })
					.eq("user_id", user.id)
					.neq("role", "owner");

				setTotalCount((ownedCount ?? 0) + (memberCount ?? 0));

				const memberProjects = await withRetry(async () => {
					const { data, error } = await supabase
						.from("project_members")
						.select(`project_id, projects(*)`)
						.eq("user_id", user.id)
						.neq("role", "owner")
						.range((page - 1) * pageSize, page * pageSize - 1);
					if (error) throw error;
					return data;
				});

				// Combine and deduplicate projects
				const ownedList: Project[] = (ownedProjects as Project[] | null) ?? [];
				const memberList: MemberProjectsRow[] = Array.isArray(memberProjects)
					? (memberProjects as unknown as MemberProjectsRow[])
					: [];
				const memberProjectItems: Project[] = memberList
					.map((mp) => mp.projects)
					.filter((p): p is Project => Boolean(p));
				const allProjects: Project[] = [...ownedList, ...memberProjectItems];

				// Remove duplicates based on project ID
				uniqueProjects = allProjects.filter((project, index, self) => 
					index === self.findIndex((p) => p.id === project.id)
				);
			}

			setCache(cacheKey, uniqueProjects, 60_000);

			// Defer counts to reduce fan-out
			const projectsWithCounts = uniqueProjects.map((project) => ({
				...project,
				member_count: project.member_count ?? null,
				task_count: project.task_count ?? null
			}));

			setProjects(projectsWithCounts);

			// Lazy-load counts in small batches
			const batchSize = 5;
			for (let i = 0; i < uniqueProjects.length; i += batchSize) {
				const batch = uniqueProjects.slice(i, i + batchSize);
				await Promise.all(
					batch.map(async (project) => {
						const { count: memberCount } = await supabase
							.from("project_members")
							.select("*", { count: "exact", head: true })
							.eq("project_id", project.id);

						const { count: taskCount } = await supabase
							.from("project_tasks")
							.select("*", { count: "exact", head: true })
							.eq("project_id", project.id);

						setProjects((prev) =>
							prev.map((p) =>
								p.id === project.id
									? {
											...p,
											member_count: memberCount ?? 0,
											task_count: taskCount ?? 0
									  }
									: p
							)
						);
					})
				);
			}
		} catch (error) {
			console.error("Unexpected error loading projects:", error);
			toast.error("Error", "An unexpected error occurred while loading projects");
		} finally {
			setLoading(false);
		}
		})();
		loadInFlight.current = run;
		await run.finally(() => {
			loadInFlight.current = null;
		});
	}, [supabase, has, permissionsLoading, page, pageSize]);

	const loadClients = useCallback(async () => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;
		const clientsCacheKey = `clients:${user.id}`;
		const cachedClients = getCache<Client[]>(clientsCacheKey);
		if (cachedClients) {
			setClients(cachedClients);
		}
		const { data, error } = await supabase
			.from("clients")
			.select("*")
			.eq("owner_id", user.id)
			.order("name", { ascending: true });
		if (!error && Array.isArray(data)) {
			const nextClients = data as unknown as Client[];
			setClients(nextClients);
			setCache(clientsCacheKey, nextClients, 60_000);
		}
	}, [supabase]);

	useEffect(() => {
		loadProjects();
		loadClients();
	}, [loadProjects, loadClients]);

	useEffect(() => {
		setPage(1);
	}, [searchTerm]);

	function handleTemplateSelect(template: ProjectTemplate, customData: { name: string; description: string; status: 'planning' | 'active' | 'completed' | 'on-hold'; client_name?: string; client_email?: string; client_company?: string; client_phone?: string; client_notes?: string }) {
		setNewProject({
			name: customData.name,
			description: customData.description,
			status: "planning", // Default status for template-based projects
			client_name: customData.client_name || "",
			client_email: customData.client_email || "",
			client_company: customData.client_company || "",
			client_phone: customData.client_phone || "",
			client_notes: customData.client_notes || ""
		});
		setIsCreateDialogOpen(true);
	}

	async function createProject() {
		if (!newProject.name.trim()) {
			toast.error("Validation Error", "Project name is required");
			return;
		}

		setLoading(true);
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			toast.error("Authentication Error", "You must be logged in to create a project");
			setLoading(false);
			return;
		}

		try {
			let clientIdToUse: string | null = null;
			if (useExistingClient && selectedClientId) {
				clientIdToUse = selectedClientId;
			} else if (!useExistingClient && newProject.client_name?.trim()) {
				// Create a new client first
				const { data: newClient, error: clientError } = await supabase
					.from("clients")
					.insert({
						owner_id: user.id,
						name: newProject.client_name!,
						email: newProject.client_email || null,
						company: newProject.client_company || null,
						phone: newProject.client_phone || null,
						notes: newProject.client_notes || null,
					})
					.select()
					.single();
				if (clientError) {
					toast.error("Error", "Failed to create client");
					setLoading(false);
					return;
				}
				clientIdToUse = newClient.id as string;
			}

			const payload: InsertProjectPayload = {
				name: newProject.name,
				description: newProject.description,
				status: newProject.status,
				owner_id: user.id,
				client_id: clientIdToUse,
				client_name: clientIdToUse ? null : (newProject.client_name || null),
				client_email: clientIdToUse ? null : (newProject.client_email || null),
				client_company: clientIdToUse ? null : (newProject.client_company || null),
				client_phone: clientIdToUse ? null : (newProject.client_phone || null),
				client_notes: clientIdToUse ? null : (newProject.client_notes || null),
			};

			const { data, error } = await supabase
				.from("projects")
				.insert(payload)
				.select()
				.single();

			if (error) {
				console.error("Project creation error:", error);
				toast.error("Error", `Failed to create project: ${error.message}`);
				setLoading(false);
				return;
			}

			// Add owner as member
			const { error: memberError } = await supabase
				.from("project_members")
				.insert({
					project_id: data.id,
					user_id: user.id,
					role: "owner"
				});

			if (memberError) {
				console.error("Member creation error:", memberError);
				toast.error("Warning", "Project created but failed to add you as a member");
			}

			toast.success("Project Created", "Your project has been created successfully");
			setNewProject({ 
				name: "", 
				description: "", 
				status: "planning",
				client_name: "",
				client_email: "",
				client_company: "",
				client_phone: "",
				client_notes: "",
			});
			setIsCreateDialogOpen(false);
			setLoading(false);
			loadProjects();
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("Error", "An unexpected error occurred");
			setLoading(false);
		}
	}

	const filteredProjects = projects.filter(project =>
		project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		(project.description || "").toLowerCase().includes(searchTerm.toLowerCase())
	);
	const totalPages = totalCount ? Math.max(1, Math.ceil(totalCount / pageSize)) : null;

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'planning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
			case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
			case 'on-hold': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
			default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	};

	if (loading && projects.length === 0) {
		return <ProjectsSkeleton />;
	}

	return (
		<div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
			{/* Header */}
			<Card className="mb-6">
				<CardHeader className="pb-4">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<CardTitle className="flex items-center gap-2 text-2xl">
								<FileText className="h-6 w-6" />
								Project Management
							</CardTitle>
							<CardDescription>Manage your freelance projects, collaborate with team members, and track progress.</CardDescription>
						</div>

						<div className="flex flex-col sm:flex-row gap-3">
							<Button 
								variant="outline" 
								onClick={() => setIsTemplateSelectorOpen(true)}
								className="w-full sm:w-auto"
							>
								<LayoutTemplate className="h-4 w-4 mr-2" />
								Use Template
							</Button>
							
							<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
								<DialogTrigger asChild>
									<Button className="w-full sm:w-auto">
										<Plus className="h-4 w-4 mr-2" />
										Create Project
									</Button>
								</DialogTrigger>
							<DialogContent className="sm:max-w-md">
								<DialogHeader>
									<DialogTitle>Create New Project</DialogTitle>
									<DialogDescription>
										Start a new freelance project and invite team members to collaborate.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="project-name">Project Name *</Label>
										<Input
											id="project-name"
											placeholder="e.g. E-commerce Website"
											value={newProject.name}
											onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="project-description">Description</Label>
										<Textarea
											id="project-description"
											placeholder="Describe your project goals and requirements..."
											value={newProject.description}
											onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
											rows={3}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="project-status">Status</Label>
										<select
											id="project-status"
											className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
											value={newProject.status}
											onChange={(e) => setNewProject(prev => ({ ...prev, status: e.target.value as NewProject['status'] }))}
										>
											<option value="planning">Planning</option>
											<option value="active">Active</option>
											<option value="completed">Completed</option>
											<option value="on-hold">On Hold</option>
										</select>
									</div>
									{/* Client selection */}
									<div className="space-y-2 pt-2">
										<Label>Client</Label>
										<div className="flex items-center gap-3 text-sm">
											<label className="flex items-center gap-2">
												<input type="radio" checked={useExistingClient} onChange={() => setUseExistingClient(true)} />
												<span>Attach existing</span>
											</label>
											<label className="flex items-center gap-2">
												<input type="radio" checked={!useExistingClient} onChange={() => setUseExistingClient(false)} />
												<span>New client</span>
											</label>
										</div>
										{useExistingClient ? (
											<div className="mt-3">
												<select
													className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
													value={selectedClientId}
													onChange={(e) => setSelectedClientId(e.target.value)}
												>
													<option value="">Select a client...</option>
													{clients.map((c) => (
														<option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
													))}
												</select>
											</div>
										) : (
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
												<div className="space-y-2">
													<Label htmlFor="client-name">Client Name</Label>
													<Input
														id="client-name"
														placeholder="e.g. Jane Doe"
														value={newProject.client_name}
														onChange={(e) => setNewProject(prev => ({ ...prev, client_name: e.target.value }))}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="client-email">Client Email</Label>
													<Input
														id="client-email"
														type="email"
														placeholder="client@example.com"
														value={newProject.client_email}
														onChange={(e) => setNewProject(prev => ({ ...prev, client_email: e.target.value }))}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="client-company">Client Company</Label>
													<Input
														id="client-company"
														placeholder="e.g. Acme Inc."
														value={newProject.client_company}
														onChange={(e) => setNewProject(prev => ({ ...prev, client_company: e.target.value }))}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="client-phone">Client Phone</Label>
													<Input
														id="client-phone"
														type="tel"
														placeholder="e.g. +1 555 123 4567"
														value={newProject.client_phone}
														onChange={(e) => setNewProject(prev => ({ ...prev, client_phone: e.target.value }))}
													/>
												</div>
												<div className="space-y-2 sm:col-span-2">
													<Label htmlFor="client-notes">Client Notes</Label>
													<Textarea
														id="client-notes"
														placeholder="Additional context about the client..."
														rows={3}
														value={newProject.client_notes}
														onChange={(e) => setNewProject(prev => ({ ...prev, client_notes: e.target.value }))}
													/>
												</div>
											</div>
										)}
									</div>
								</div>
								<DialogFooter>
									<Button 
										variant="outline" 
										onClick={() => setIsCreateDialogOpen(false)}
										disabled={loading}
									>
										Cancel
									</Button>
									<Button 
										onClick={createProject} 
										disabled={loading || !newProject.name.trim()}
									>
										{loading ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Creating...
											</>
										) : (
											"Create Project"
										)}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
						</div>
					</div>
				</CardHeader>
			</Card>

			{/* Search and Stats */}
			<Card className="mb-6">
				<CardContent className="p-6">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
								<Input
									placeholder="Search projects..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
							<div className="flex items-center gap-1">
								<FileText className="h-4 w-4" />
								{totalCount ?? projects.length} Projects
							</div>
							<div className="flex items-center gap-1">
								<Users className="h-4 w-4" />
								{projects.reduce((sum, p) => sum + (p.member_count || 0), 0)} Members
							</div>
							{totalPages && (
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={page <= 1 || loading}
										onClick={() => setPage((p) => Math.max(1, p - 1))}
									>
										Prev
									</Button>
									<span className="text-xs">
										Page {page} of {totalPages}
									</span>
									<Button
										variant="outline"
										size="sm"
										disabled={page >= totalPages || loading}
										onClick={() => setPage((p) => p + 1)}
									>
										Next
									</Button>
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Projects Grid */}
			{filteredProjects.length === 0 ? (
				<Card>
					<CardContent className="p-12 text-center">
						<FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
						<h3 className="text-lg font-semibold mb-2">
							{searchTerm ? "No projects found" : "No projects yet"}
						</h3>
						<p className="text-muted-foreground mb-4">
							{searchTerm 
								? "Try adjusting your search terms"
								: "Create your first project to get started with freelance project management"
							}
						</p>
						{!searchTerm && (
							<Button onClick={() => setIsCreateDialogOpen(true)}>
								<Plus className="h-4 w-4 mr-2" />
								Create Your First Project
							</Button>
						)}
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{filteredProjects.map((project) => (
						<Card key={project.id} className="hover:shadow-lg transition-shadow duration-200">
							<CardHeader className="pb-4">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<CardTitle className="text-lg mb-2">{project.name}</CardTitle>
										<Badge className={getStatusColor(project.status)}>
											{project.status.charAt(0).toUpperCase() + project.status.slice(1)}
										</Badge>
									</div>
									<Link href={`/dashboard/projects/${project.id}`}>
										<Button variant="outline" size="sm">
											<Eye className="h-4 w-4" />
										</Button>
									</Link>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								{project.description && (
									<p className="text-sm text-muted-foreground line-clamp-3">
										{project.description}
									</p>
								)}

								
								<div className="flex items-center justify-between text-sm text-muted-foreground">
									<div className="flex items-center gap-4">
										<div className="flex items-center gap-1">
											<Users className="h-4 w-4" />
											{project.member_count || 0}
										</div>
										<div className="flex items-center gap-1">
											<FileText className="h-4 w-4" />
											{project.task_count || 0}
										</div>
									</div>
									<div className="flex items-center gap-1">
										<Calendar className="h-4 w-4" />
										{new Date(project.updated_at).toLocaleDateString()}
									</div>
								</div>

								<div className="flex gap-2">
									<Link href={`/dashboard/projects/${project.id}`} className="flex-1">
										<Button variant="outline" size="sm" className="w-full">
											<MessageSquare className="h-4 w-4 mr-2" />
											View Project
									</Button>
								</Link>
									<Link href={`/dashboard/projects/${project.id}/settings`}>
										<Button variant="outline" size="sm">
											<Settings className="h-4 w-4" />
										</Button>
									</Link>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Template Selector */}
			<ProjectTemplateSelector
				isOpen={isTemplateSelectorOpen}
				onClose={() => setIsTemplateSelectorOpen(false)}
				onSelectTemplate={handleTemplateSelect}
			/>
		</div>
	);
}
