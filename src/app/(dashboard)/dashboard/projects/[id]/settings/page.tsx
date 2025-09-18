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
		full_name?: string;
		avatar_url?: string;
		email?: string;
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
				.select('id, full_name, avatar_url, email')
				.in('id', ids);
			const map = ((profiles ?? []) as Array<{ id: string; full_name?: string; avatar_url?: string; email?: string }>).reduce((acc, p) => {
				acc[p.id] = p;
				return acc;
			}, {} as Record<string, { id: string; full_name?: string; avatar_url?: string; email?: string }>);
			membersEnriched = memberList.map(m => ({
				id: m.id,
				user_id: m.user_id,
				role: m.role,
				joined_at: m.joined_at,
				user: { full_name: map[m.user_id]?.full_name, avatar_url: map[m.user_id]?.avatar_url, email: map[m.user_id]?.email },
			}));
		}
		setMembers(membersEnriched);

		// Load invite candidates (all profiles excluding current members)
		const { data: profilesData } = await supabase
			.from("profiles")
			.select("id, full_name, email")
			.order("full_name", { ascending: true });
		const memberIds: string[] = ((membersData ?? []) as Array<{ user_id: string }>).map((m) => m.user_id);
		const candidates = ((profilesData ?? []) as Array<{ id: string; full_name: string; email: string }>).filter((p) => !memberIds.includes(p.id));
		setInviteCandidates(candidates);
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
			const channel = supabase
				.channel(`project-settings-${projectId}`)
				.on('postgres_changes', { event: '*', schema: 'public', table: 'project_members', filter: `project_id=eq.${projectId}` }, () => loadProjectData())
				.on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` }, () => loadProjectData())
				.subscribe();
			return () => {
				supabase.removeChannel(channel);
			};
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

	async function updateMemberRole(memberId: string, newRole: Member['role']) {
		setLoading(true);
		const { error } = await supabase
			.from('project_members')
			.update({ role: newRole })
			.eq('id', memberId);
		if (error) {
			toast.error('Failed to update role');
			setLoading(false);
			return;
		}
		toast.success('Role updated');
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
														<option key={u.id} value={u.id}>
															{u.full_name || u.email}{u.full_name && u.email ? ` — ${u.email}` : ""}
														</option>
													))}
												</select>
											</div>
											<DialogFooter>
												<Button type="button" variant="secondary" onClick={inviteMember} disabled={loading || !inviteEmail.trim()}>
													Invite by Email
												</Button>
												<Button type="button" onClick={inviteExistingUser} disabled={loading || !selectedInviteUserId}>
													Add Selected
												</Button>
											</DialogFooter>
										</div>
									</DialogContent>
								</Dialog>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{members.length === 0 ? (
									<p className="text-sm text-muted-foreground">No members yet.</p>
								) : (
									members.map((m) => (
										<div key={m.id} className="flex items-center justify-between rounded-md border p-3">
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
													{m.user.full_name?.[0]?.toUpperCase() || "?"}
												</div>
												<div>
													<div className="flex items-center gap-2">
														<span className="font-medium">{m.user.full_name || m.user.email}</span>
														<select
															className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm"
															value={m.role}
															onChange={(e) => updateMemberRole(m.id, e.target.value as Member['role'])}
															disabled={loading || m.role === 'owner'}
														>
															<option value="owner">owner</option>
															<option value="admin">admin</option>
															<option value="member">member</option>
														</select>
													</div>
													<p className="text-xs text-muted-foreground">Joined {new Date(m.joined_at).toLocaleDateString()}</p>
												</div>
											</div>
											<Button variant="outline" size="sm" onClick={() => removeMember(m.id)} disabled={loading || m.role === 'owner'}>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									))
								)}
							</div>
						</CardContent>
					</Card>

				</div>
			</div>
		);
}