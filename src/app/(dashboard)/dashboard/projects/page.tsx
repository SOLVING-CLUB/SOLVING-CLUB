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
import { toast } from "sonner";
import { Plus, Search, Users, Calendar, FileText, MessageSquare, Settings, Eye } from "lucide-react";
import Link from "next/link";

interface Project {
	id: string;
	name: string;
	description: string;
	status: 'planning' | 'active' | 'completed' | 'on-hold';
	created_at: string;
	updated_at: string;
	owner_id: string;
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
};

export default function ProjectsPage() {
	const supabase = getSupabaseBrowserClient();
	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [newProject, setNewProject] = useState<NewProject>({
		name: "",
		description: "",
		status: "planning"
	});

	const loadProjects = useCallback(async () => {
		setLoading(true);
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			setLoading(false);
			return;
		}

		try {
			// First, get all projects where user is owner
			const { data: ownedProjects, error: ownedError } = await supabase
				.from("projects")
				.select("*")
				.eq("owner_id", user.id)
				.order("updated_at", { ascending: false });

			if (ownedError) {
				console.error("Error loading owned projects:", ownedError);
				toast.error("Failed to load projects");
				setLoading(false);
				return;
			}

			// Then, get all projects where user is a member
			const { data: memberProjects, error: memberError } = await supabase
				.from("project_members")
				.select(`
					project_id,
					projects(*)
				`)
				.eq("user_id", user.id)
				.neq("role", "owner"); // Exclude owner role since we already got those

			if (memberError) {
				console.error("Error loading member projects:", memberError);
				toast.error("Failed to load projects");
				setLoading(false);
				return;
			}

			// Combine and deduplicate projects
			const ownedList: Project[] = (ownedProjects as Project[] | null) ?? [];
			const memberList: MemberProjectsRow[] = (Array.isArray(memberProjects) ? (memberProjects as unknown as MemberProjectsRow[]) : []) ?? [];
			const memberProjectItems: Project[] = memberList
				.flatMap((mp) => (Array.isArray(mp.projects) ? mp.projects : [mp.projects]))
				.filter((p): p is Project => Boolean(p));
			const allProjects: Project[] = [...ownedList, ...memberProjectItems];

			// Remove duplicates based on project ID
			const uniqueProjects: Project[] = allProjects.filter((project, index, self) => 
				index === self.findIndex((p) => p.id === project.id)
			);

			// Get member and task counts for each project
			const projectsWithCounts = await Promise.all(
				uniqueProjects.map(async (project) => {
					// Get member count
					const { count: memberCount } = await supabase
						.from("project_members")
						.select("*", { count: "exact", head: true })
						.eq("project_id", project.id);

					// Get task count
					const { count: taskCount } = await supabase
						.from("project_tasks")
						.select("*", { count: "exact", head: true })
						.eq("project_id", project.id);

					return {
						...project,
						member_count: memberCount || 0,
						task_count: taskCount || 0
					};
				})
			);

			setProjects(projectsWithCounts);
		} catch (error) {
			console.error("Unexpected error loading projects:", error);
			toast.error("An unexpected error occurred while loading projects");
		} finally {
			setLoading(false);
		}
	}, [supabase]);

	useEffect(() => {
		loadProjects();
	}, [loadProjects]);

	async function createProject() {
		if (!newProject.name.trim()) {
			toast.error("Project name is required");
			return;
		}

		setLoading(true);
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			toast.error("You must be logged in to create a project");
			setLoading(false);
			return;
		}

		try {
			const { data, error } = await supabase
				.from("projects")
				.insert({
					name: newProject.name,
					description: newProject.description,
					status: newProject.status,
					owner_id: user.id
				})
				.select()
				.single();

			if (error) {
				console.error("Project creation error:", error);
				toast.error(`Failed to create project: ${error.message}`);
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
				toast.error("Project created but failed to add you as a member");
			}

			toast.success("Project created successfully");
			setNewProject({ name: "", description: "", status: "planning" });
			setIsCreateDialogOpen(false);
			setLoading(false);
			loadProjects();
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("An unexpected error occurred");
			setLoading(false);
		}
	}

	const filteredProjects = projects.filter(project =>
		project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		project.description.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'planning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
			case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
			case 'on-hold': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
			default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	};

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
										{loading ? "Creating..." : "Create Project"}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
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
						<div className="flex gap-4 text-sm text-muted-foreground">
							<div className="flex items-center gap-1">
								<FileText className="h-4 w-4" />
								{projects.length} Projects
							</div>
							<div className="flex items-center gap-1">
								<Users className="h-4 w-4" />
								{projects.reduce((sum, p) => sum + (p.member_count || 0), 0)} Members
							</div>
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
		</div>
	);
}
