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
import { 
	Settings, 
	UserPlus, 
	Trash2, 
	Save, 
	ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Project {
	id: string;
	name: string;
	description: string;
	    status: 'planning' | 'active' | 'completed' | 'on-hold';
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
		full_name: string;
		avatar_url: string;
		email: string;
	};
}

export default function ProjectSettingsPage() {
	const params = useParams();
	const projectId = params.id as string;
	const supabase = getSupabaseBrowserClient();
	
	const [project, setProject] = useState<Project | null>(null);
	const [members, setMembers] = useState<Member[]>([]);
	const [loading, setLoading] = useState(false);
	const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteCandidates, setInviteCandidates] = useState<{ id: string; full_name: string; email: string }[]>([]);
	const [selectedInviteUserId, setSelectedInviteUserId] = useState("");
	const [inviteSearch, setInviteSearch] = useState("");
	
	// Project settings form
	type ProjectStatus = 'planning' | 'active' | 'completed' | 'on-hold';
	type ProjectSettings = { name: string; description: string; status: ProjectStatus; client_name?: string; client_email?: string; client_company?: string; client_phone?: string; client_notes?: string };
	const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
		name: "",
		description: "",
		status: "planning",
		client_name: "",
		client_email: "",
		client_company: "",
		client_phone: "",
		client_notes: "",
	});

	useEffect(() => {
		// defer to the effect declared after loadProjectData
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
		setProjectSettings({
			name: projectData.name,
			description: projectData.description || "",
			status: projectData.status as ProjectStatus,
			client_name: projectData.client_name || "",
			client_email: projectData.client_email || "",
			client_company: projectData.client_company || "",
			client_phone: projectData.client_phone || "",
			client_notes: projectData.client_notes || "",
		});

		// Load members
		const { data: membersData } = await supabase
			.from("project_members")
			.select(`
				*,
				user:profiles(full_name, avatar_url, email)
			`)
			.eq("project_id", projectId);

		        setMembers(membersData || []);

		// Load invite candidates (all profiles excluding current members)
		const { data: profilesData } = await supabase
			.from("profiles")
			.select("id, full_name, email")
			.order("full_name", { ascending: true });
		const memberIds = (membersData || []).map((m: any) => m.user_id);
		const candidates = (profilesData || []).filter((p: any) => !memberIds.includes(p.id));
		setInviteCandidates(candidates as { id: string; full_name: string; email: string }[]);
        setLoading(false);
    }, [projectId, supabase]);

	useEffect(() => {
		if (isInviteDialogOpen) {
			setInviteSearch("");
			setSelectedInviteUserId("");
		}
	}, [isInviteDialogOpen]);

	useEffect(() => {
		if (projectId) {
			loadProjectData();
		}
	}, [projectId, loadProjectData]);

	async function updateProject() {
		if (!projectSettings.name.trim()) {
			toast.error("Project name is required");
			return;
		}

		setLoading(true);
		const { error } = await supabase
			.from("projects")
			.update({
				name: projectSettings.name,
				description: projectSettings.description,
				status: projectSettings.status,
				client_name: projectSettings.client_name || null,
				client_email: projectSettings.client_email || null,
				client_company: projectSettings.client_company || null,
				client_phone: projectSettings.client_phone || null,
				client_notes: projectSettings.client_notes || null,
			})
			.eq("id", projectId);

		if (error) {
			toast.error("Failed to update project");
			setLoading(false);
			return;
		}

		toast.success("Project updated successfully");
		loadProjectData();
	}

	async function inviteMember() {
		if (!inviteEmail.trim()) {
			toast.error("Email is required");
			return;
		}

		setLoading(true);
		
		// First, find the user by email
		const { data: userData, error: userError } = await supabase
			.from("profiles")
			.select("id")
			.eq("email", inviteEmail)
			.single();

		if (userError || !userData) {
			toast.error("User not found with this email");
			setLoading(false);
			return;
		}

		// Check if user is already a member
		const { data: existingMember } = await supabase
			.from("project_members")
			.select("id")
			.eq("project_id", projectId)
			.eq("user_id", userData.id)
			.single();

		if (existingMember) {
			toast.error("User is already a member of this project");
			setLoading(false);
			return;
		}

		// Add user as member
		const { error } = await supabase
			.from("project_members")
			.insert({
				project_id: projectId,
				user_id: userData.id,
				role: "member"
			});

		if (error) {
			toast.error("Failed to invite member");
			setLoading(false);
			return;
		}

		toast.success("Member invited successfully");
		setInviteEmail("");
		setIsInviteDialogOpen(false);
		loadProjectData();
	}

	async function inviteExistingUser() {
		if (!selectedInviteUserId) {
			toast.error("Please select a user to add");
			return;
		}

		setLoading(true);
		// Check if already a member
		const { data: existingMember } = await supabase
			.from("project_members")
			.select("id")
			.eq("project_id", projectId)
			.eq("user_id", selectedInviteUserId)
			.single();

		if (existingMember) {
			toast.error("User is already a member of this project");
			setLoading(false);
			return;
		}

		const { error } = await supabase
			.from("project_members")
			.insert({ project_id: projectId, user_id: selectedInviteUserId, role: "member" });

		if (error) {
			toast.error("Failed to add member");
			setLoading(false);
			return;
		}

		toast.success("Member added successfully");
		setIsInviteDialogOpen(false);
		setSelectedInviteUserId("");
		setInviteSearch("");
		loadProjectData();
	}

	async function removeMember(memberId: string) {
		if (!confirm("Are you sure you want to remove this member?")) {
			return;
		}

		setLoading(true);
		const { error } = await supabase
			.from("project_members")
			.delete()
			.eq("id", memberId);

		if (error) {
			toast.error("Failed to remove member");
			setLoading(false);
			return;
		}

		toast.success("Member removed successfully");
		loadProjectData();
	}

	async function deleteProject() {
		if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
			return;
		}

		setLoading(true);
		const { error } = await supabase
			.from("projects")
			.delete()
			.eq("id", projectId);

		if (error) {
			toast.error("Failed to delete project");
			setLoading(false);
			return;
		}

		toast.success("Project deleted successfully");
		window.location.href = "/dashboard/projects";
	}

	// getStatusColor was unused; removed to satisfy linter

	if (loading && !project) {
		return (
			<div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				<Card>
					<CardContent className="p-12 text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
						<p className="mt-4 text-muted-foreground">Loading project settings...</p>
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
						<Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
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
					<div className="flex items-center gap-3">
						<Link href={`/dashboard/projects/${projectId}`}>
							<Button variant="outline" size="sm">
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Project
							</Button>
						</Link>
						<div>
							<CardTitle className="flex items-center gap-2 text-2xl">
								<Settings className="h-6 w-6" />
								Project Settings
							</CardTitle>
							<CardDescription>Manage your project settings and team members.</CardDescription>
						</div>
					</div>
				</CardHeader>
			</Card>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Project Settings */}
				<Card>
					<CardHeader className="pb-4">
						<CardTitle className="text-lg">Project Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="project-name">Project Name</Label>
							<Input
								id="project-name"
								value={projectSettings.name}
								onChange={(e) => setProjectSettings(prev => ({ ...prev, name: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="project-description">Description</Label>
							<Textarea
								id="project-description"
								value={projectSettings.description}
								onChange={(e) => setProjectSettings(prev => ({ ...prev, description: e.target.value }))}
								rows={4}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="project-status">Status</Label>
							<select
								id="project-status"
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								value={projectSettings.status}
								onChange={(e) => setProjectSettings(prev => ({ ...prev, status: e.target.value as ProjectStatus }))}
							>
								<option value="planning">Planning</option>
								<option value="active">Active</option>
								<option value="completed">Completed</option>
								<option value="on-hold">On Hold</option>
							</select>
						</div>
						<Button onClick={updateProject} disabled={loading} className="w-full">
							<Save className="h-4 w-4 mr-2" />
							{loading ? "Saving..." : "Save Changes"}
						</Button>
					</CardContent>
				</Card>

				{/* Team Management */}
				<Card>
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg">Team Members</CardTitle>
							<Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
								<DialogTrigger asChild>
									<Button size="sm">
										<UserPlus className="h-4 w-4 mr-2" />
										Invite Member
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-md">
									<DialogHeader>
										<DialogTitle>Invite Team Member</DialogTitle>
										<DialogDescription>
											Invite a new member to join this project by their email address, or add an existing Solving Club member.
										</DialogDescription>
									</DialogHeader>
									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="invite-email">Email Address</Label>
											<Input
												id="invite-email"
												type="email"
												placeholder="member@example.com"
												value={inviteEmail}
												onChange={(e) => setInviteEmail(e.target.value)}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="invite-search">Or add existing member</Label>
											<Input
												id="invite-search"
												placeholder="Search by name or email"
												value={inviteSearch}
												onChange={(e) => setInviteSearch(e.target.value)}
											/>
											<select
												className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
												value={selectedInviteUserId}
												onChange={(e) => setSelectedInviteUserId(e.target.value)}
											>
												<option value="">Select a user...</option>
												{inviteCandidates
													.filter(u => (u.full_name || "").toLowerCase().includes(inviteSearch.toLowerCase()) || (u.email || "").toLowerCase().includes(inviteSearch.toLowerCase()))
													.map(u => (
														<option key={u.id} value={u.id}>{u.full_name || u.email} {u.email ? `— ${u.email}` : ""}</option>
													))}
											</select>
										</div>
									</div>
									<DialogFooter>
										<Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
											Cancel
										</Button>
										<Button onClick={inviteMember} disabled={loading}>
											{loading ? "Inviting..." : "Send Invite"}
										</Button>
										<Button onClick={inviteExistingUser} disabled={loading || !selectedInviteUserId}>
											{loading ? "Adding..." : "Add Existing"}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{members.map((member) => (
								<div key={member.id} className="flex items-center gap-4 p-3 border rounded-lg">
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
										<p className="text-sm text-muted-foreground">{member.user.email}</p>
									</div>
									{member.role !== 'owner' && (
										<Button 
											variant="outline" 
											size="sm"
											onClick={() => removeMember(member.id)}
											className="text-destructive hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									)}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Danger Zone */}
			<Card className="mt-6 border-destructive/20">
				<CardHeader className="pb-4">
					<CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
					<CardDescription>
						Irreversible and destructive actions for this project.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
						<div>
							<h4 className="font-medium text-destructive">Delete Project</h4>
							<p className="text-sm text-muted-foreground">
								Permanently delete this project and all its data. This action cannot be undone.
							</p>
						</div>
						<Button 
							variant="destructive" 
							onClick={deleteProject}
							disabled={loading}
						>
							<Trash2 className="h-4 w-4 mr-2" />
							Delete Project
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Client Details */}
			<Card>
				<CardHeader className="pb-4">
					<CardTitle className="text-lg">Client Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="client-name">Client Name</Label>
							<Input
								id="client-name"
								value={projectSettings.client_name}
								onChange={(e) => setProjectSettings(prev => ({ ...prev, client_name: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="client-email">Client Email</Label>
							<Input
								id="client-email"
								type="email"
								value={projectSettings.client_email}
								onChange={(e) => setProjectSettings(prev => ({ ...prev, client_email: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="client-company">Client Company</Label>
							<Input
								id="client-company"
								value={projectSettings.client_company}
								onChange={(e) => setProjectSettings(prev => ({ ...prev, client_company: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="client-phone">Client Phone</Label>
							<Input
								id="client-phone"
								type="tel"
								value={projectSettings.client_phone}
								onChange={(e) => setProjectSettings(prev => ({ ...prev, client_phone: e.target.value }))}
							/>
						</div>
						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="client-notes">Client Notes</Label>
							<Textarea
								id="client-notes"
								rows={4}
								value={projectSettings.client_notes}
								onChange={(e) => setProjectSettings(prev => ({ ...prev, client_notes: e.target.value }))}
							/>
						</div>
					</div>
					<Button onClick={updateProject} disabled={loading} className="w-full">
						<Save className="h-4 w-4 mr-2" />
						{loading ? "Saving..." : "Save Changes"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
