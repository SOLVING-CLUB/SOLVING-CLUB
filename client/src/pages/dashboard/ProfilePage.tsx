
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileSkeleton } from "@/components/ui/loading-states";
import { toast } from "@/lib/toast";
import { User2, Briefcase, Sparkles, Link as LinkIcon, FileText, Pencil, Plus } from "lucide-react";
import ChipInput from "@/components/chip-input";

interface Profile {
	id: string;
	full_name: string | null;
	avatar_url: string | null;
	career_focus: string | null;
	skills: string[] | null;
	experience: string | null;
	current_status: string | null;
	portfolio: string | null;
}

interface ProfileSection {
	id: string;
	key: string;
	title: string;
	type: string;
	position: number;
	content: Record<string, unknown>;
}

type PersonalContent = {
	shortGoals?: string | string[];
	longGoals?: string | string[];
	hobbies?: string[];
};

type SkillsContent = {
	topicsKnown?: string[];
	topicsToLearn?: string[];
};

type ProjectLink = { label?: string; url: string };
type Project = {
	name?: string;
	description?: string;
	technologies?: string[];
	status?: "completed" | "in-progress" | "planned" | "on-hold" | string;
	links?: ProjectLink[];
};

type ProjectsContent = { projects?: Project[] };

function formatLabel(labelKey: string): string {
	const withSpaces = labelKey
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[\-_]+/g, " ")
		.trim();
	return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function renderValue(value: unknown): React.ReactNode {
	if (value == null) return <span className="text-muted-foreground">—</span>;
	if (Array.isArray(value)) {
		if (value.length === 0) return <span className="text-muted-foreground">—</span>;
		return (
			<div className="flex flex-wrap gap-2 pt-1">
				{value.map((item: unknown, idx: number) => (
					<Badge key={`${String(item)}-${idx}`} variant="secondary">{String(item)}</Badge>
				))}
			</div>
		);
	}
	if (typeof value === "object") {
		const items = (value as Record<string, unknown>).items;
		if (Array.isArray(items)) return renderValue(items);
		return (
			<pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(value, null, 2)}</pre>
		);
	}
	const text = String(value).trim();
	return text.length > 0 ? <span className="font-medium">{text}</span> : <span className="text-muted-foreground">—</span>;
}

function renderSectionContent(content: Record<string, unknown>): React.ReactNode {
	if (content == null) return <span className="text-muted-foreground">—</span>;
	if (typeof content === "string" || Array.isArray(content)) {
		return renderValue(content);
	}
	if (typeof content === "object") {
		const entries = Object.entries(content);
		if (entries.length === 0) return <span className="text-muted-foreground">—</span>;
		return (
			<div className="grid md:grid-cols-2 gap-4">
				{entries.map(([k, v]) => (
					<div key={k}>
						<div className="text-sm text-muted-foreground">{formatLabel(k)}</div>
						<div className="mt-0.5">{renderValue(v)}</div>
					</div>
				))}
			</div>
		);
	}
	return <span className="text-muted-foreground">—</span>;
}

export default function ProfilePage() {
	const supabase = getSupabaseClient();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(false);
	const [initialLoading, setInitialLoading] = useState(true);
	const [sections, setSections] = useState<ProfileSection[]>([]);
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const [isEditMode, setIsEditMode] = useState(false);

	function getSection<T = Record<string, unknown>>(key: string): (Omit<ProfileSection, 'content'> & { content: T }) | undefined {
		const found = sections.find((s) => s.key === key);
		if (!found) return undefined;
		const { content, ...rest } = found;
		return { ...rest, content: (content as unknown as T) };
	}

	function valueToCSV(value: unknown): string {
		if (Array.isArray(value)) return value.map(String).filter(Boolean).join(", ");
		if (typeof value === "string") return value;
		return "";
	}

	function ensureStringArray(value: unknown): string[] {
		if (Array.isArray(value)) return value.map(String).filter(Boolean);
		if (typeof value === "string") return value.split(/\s*,\s*/).filter(Boolean);
		return [];
	}

	useEffect(() => {
		(async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;
			const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
			if (error) {
				toast.error("Error", error.message);
				setInitialLoading(false);
				return;
			}
			setProfile(
				data ?? {
					id: user.id,
					full_name: user.user_metadata?.full_name ?? null,
					avatar_url: user.user_metadata?.avatar_url ?? null,
					career_focus: null,
					skills: [],
					experience: null,
					current_status: null,
					portfolio: null,
				}
			);
			const { data: secs } = await supabase
				.from("profile_sections")
				.select("id, key, title, type, position, content")
				.eq("user_id", user.id)
				.order("position", { ascending: true });
			if (secs) setSections(secs as ProfileSection[]);
			setInitialLoading(false);
		})();
	}, [supabase]);

	async function onSave(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!profile) return;
		setLoading(true);
		const { error } = await supabase.from("profiles").upsert(profile, { onConflict: "id" });
		setLoading(false);
		if (error) return toast.error("Error", error.message);
		toast.success("Profile saved", "Your profile has been updated successfully.");
	}

	async function upsertSection(next: ProfileSection) {
		setLoading(true);
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return setLoading(false);
		const payload = {
			id: next.id || undefined,
			user_id: user.id,
			key: next.key,
			title: next.title,
			type: next.type,
			position: next.position ?? 0,
			content: next.content ?? {},
		};
		const { data, error } = await supabase
			.from("profile_sections")
							.upsert(payload, { onConflict: "user_id,key" })
			.select();
		setLoading(false);
		if (error) return toast.error("Error", error.message);
		if (data && data[0]) {
			setSections((prev) => {
				const others = prev.filter((s) => s.key !== data[0].key);
				return [...others, data[0]].sort((a, b) => a.position - b.position);
			});
			setEditingKey(null);
			toast.success("Section updated", `${next.title} has been updated successfully.`);
		}
	}

	if (initialLoading) {
		return <ProfileSkeleton />;
	}

	return (
		<div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
									{/* Header */}
			<Card className="mb-6">
				<CardHeader className="pb-4">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<CardTitle className="flex items-center gap-2 text-2xl">
								<User2 className="h-6 w-6" />
								Your Profile
							</CardTitle>
					<CardDescription>Manage your personal information and career details.</CardDescription>
						</div>
						<Button 
							size="sm" 
							variant={isEditMode ? "default" : "outline"} 
							onClick={() => { setIsEditMode((v) => !v); if (isEditMode) setEditingKey(null); }}
							className="w-full sm:w-auto"
						>
							{isEditMode ? "Done" : "Edit Profile"}
						</Button>
					</div>
				</CardHeader>
			</Card>

			{/* Profile Header */}
			<Card className="mb-6">
				<CardContent className="p-6">
					<div className="flex flex-col md:flex-row md:items-center gap-6">
						{initialLoading ? (
							<Skeleton className="h-20 w-20 rounded-full" />
						) : (
							<Avatar className="h-20 w-20">
								<AvatarImage src={profile?.avatar_url ?? undefined} />
								<AvatarFallback className="text-xl">
									{profile?.full_name?.[0]?.toUpperCase() ?? "?"}
								</AvatarFallback>
							</Avatar>
						)}
						<div className="grid gap-4 flex-1 max-w-md">
							<div className="grid gap-2">
								<Label htmlFor="full_name" className="flex items-center gap-2">
									<User2 className="h-4 w-4" />
									Full Name
								</Label>
								{initialLoading ? (
									<Skeleton className="h-10 w-full" />
								) : (
									isEditMode ? (
										<ChipInput
											name="full_name_field"
											defaultValue={profile?.full_name ?? ""}
											placeholder="Your full name"
											onTextChange={(val) => setProfile((p) => (p ? { ...p, full_name: val } : p))}
											allowToggle={true}
										/>
									) : (
										<div className="min-h-10 rounded-md border bg-background px-3 py-2 text-sm">
											{profile?.full_name || "—"}
										</div>
									)
								)}
							</div>
							<div className="grid gap-2">
								<Label htmlFor="career_focus" className="flex items-center gap-2">
									<Briefcase className="h-4 w-4" />
									Career Focus
								</Label>
								{initialLoading ? (
									<Skeleton className="h-10 w-full" />
								) : (
									isEditMode ? (
										<ChipInput
											name="career_focus_field"
											defaultValue={profile?.career_focus ?? ""}
											placeholder="e.g. Frontend Development, Mobile Apps"
											onTextChange={(val) => setProfile((p) => (p ? { ...p, career_focus: val } : p))}
											allowToggle={true}
										/>
									) : (
										<div className="min-h-10 rounded-md border bg-background px-3 py-2 text-sm">
											{profile?.career_focus || "—"}
										</div>
									)
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Profile Sections Grid */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Personal Details & Goals */}
				<Card>
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg flex items-center gap-2">
								<User2 className="h-5 w-5" />
								Personal Details & Goals
							</CardTitle>
							{isEditMode && (
								<Button size="sm" variant="outline" onClick={() => setEditingKey(editingKey === "personal" ? null : "personal")}>
									<Pencil className="h-4 w-4 mr-1" /> {editingKey === "personal" ? "Close" : "Edit"}
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid md:grid-cols-2 gap-4">
							<div>
								<div className="text-sm text-muted-foreground mb-1">Full Name</div>
								<div className="font-medium">{profile?.full_name || "—"}</div>
							</div>
							<div>
								<div className="text-sm text-muted-foreground mb-1">Career Focus</div>
								<div className="font-medium">{profile?.career_focus || "—"}</div>
							</div>
						</div>
						<div className="grid md:grid-cols-2 gap-4">
							<div>
								<div className="text-sm text-muted-foreground mb-1">Short Term Goals</div>
								<div className="font-medium">
									{valueToCSV(getSection<PersonalContent>("personal")?.content?.shortGoals) || "—"}
								</div>
							</div>
							<div>
								<div className="text-sm text-muted-foreground mb-1">Long Term Goals</div>
								<div className="font-medium">
									{valueToCSV(getSection<PersonalContent>("personal")?.content?.longGoals) || "—"}
								</div>
							</div>
						</div>
						<div>
							<div className="text-sm text-muted-foreground mb-1">Hobbies & Interests</div>
							<div className="font-medium">
								{ensureStringArray(getSection<PersonalContent>("personal")?.content?.hobbies).join(", ") || "—"}
							</div>
						</div>

						{editingKey === "personal" && isEditMode && (
							<form
								onSubmit={async (e) => {
									e.preventDefault();
									const fd = new FormData(e.currentTarget);
									await upsertSection({
										id: sections.find(s=>s.key==="personal")?.id || "",
										key: "personal",
										title: "Personal Details & Goals",
										type: "personal",
										position: 0,
										content: {
											shortGoals: String(fd.get("shortGoals") || ""),
											longGoals: String(fd.get("longGoals") || ""),
											hobbies: String(fd.get("hobbies") || "").split(/\s*,\s*/).filter(Boolean),
										},
									});
								}}
								className="space-y-4 border-t pt-4"
							>
								<Label htmlFor="shortGoals">Short Term Goals</Label>
								<ChipInput name="shortGoals" defaultValue={valueToCSV(getSection<PersonalContent>("personal")?.content?.shortGoals)} placeholder="Enter your short term goals" defaultModeChips={true} />
								<Label htmlFor="longGoals">Long Term Goals</Label>
								<ChipInput name="longGoals" defaultValue={valueToCSV(getSection<PersonalContent>("personal")?.content?.longGoals)} placeholder="Enter your long term goals" defaultModeChips={true} />
								<Label htmlFor="hobbies">Hobbies & Interests</Label>
								<ChipInput name="hobbies" defaultValue={ensureStringArray(getSection<PersonalContent>("personal")?.content?.hobbies).join(", ")} placeholder="Add your hobbies and interests" defaultModeChips={true} />
								<div className="flex justify-end gap-2">
									<Button type="button" variant="ghost" onClick={() => setEditingKey(null)}>Cancel</Button>
									<Button type="submit">Save</Button>
								</div>
							</form>
						)}
					</CardContent>
				</Card>

				{/* Skills & Learning */}
				<Card>
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg flex items-center gap-2">
								<Sparkles className="h-5 w-5" />
								Skills & Learning
							</CardTitle>
							{isEditMode && (
								<Button size="sm" variant="outline" onClick={() => setEditingKey(editingKey === "skills" ? null : "skills")}>
									<Pencil className="h-4 w-4 mr-1" /> {editingKey === "skills" ? "Close" : "Edit"}
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<div className="text-sm text-muted-foreground mb-2">Core Skills</div>
							<div className="flex flex-wrap gap-2">
								{(profile?.skills || []).length === 0 ? (
									<span className="text-muted-foreground">No skills added yet</span>
								) : (
									profile?.skills?.map((s, i) => (
										<Badge key={`${s}-${i}`} variant="secondary">
											{s}
										</Badge>
									))
								)}
							</div>
						</div>
						<div className="grid md:grid-cols-2 gap-4">
							<div>
								<div className="text-sm text-muted-foreground mb-1">Topics Known</div>
								<div className="font-medium">
									{ensureStringArray(getSection<SkillsContent>("skills")?.content?.topicsKnown).join(", ") || "—"}
								</div>
							</div>
							<div>
								<div className="text-sm text-muted-foreground mb-1">Topics To Learn</div>
								<div className="font-medium">
									{ensureStringArray(getSection<SkillsContent>("skills")?.content?.topicsToLearn).join(", ") || "—"}
								</div>
							</div>
						</div>

						{editingKey === "skills" && isEditMode && (
							<form
								onSubmit={async (e) => {
									e.preventDefault();
									const fd = new FormData(e.currentTarget);
									await upsertSection({
										id: sections.find(s=>s.key==="skills")?.id || "",
										key: "skills",
										title: "Skills & Learning",
										type: "skills",
										position: 1,
										content: {
											topicsKnown: String(fd.get("topicsKnown") || "").split(/\s*,\s*/).filter(Boolean),
											topicsToLearn: String(fd.get("topicsToLearn") || "").split(/\s*,\s*/).filter(Boolean),
										},
									});
								}}
								className="space-y-4 border-t pt-4"
							>
								<Label htmlFor="topicsKnown">Topics Known</Label>
								<ChipInput name="topicsKnown" defaultValue={ensureStringArray(getSection<SkillsContent>("skills")?.content?.topicsKnown).join(", ")} placeholder="Enter topics you're proficient in" defaultModeChips={true} />
								<Label htmlFor="topicsToLearn">Topics To Learn</Label>
								<ChipInput name="topicsToLearn" defaultValue={ensureStringArray(getSection<SkillsContent>("skills")?.content?.topicsToLearn).join(", ")} placeholder="Enter topics you want to learn" defaultModeChips={true} />
								<div className="flex justify-end gap-2">
									<Button type="button" variant="ghost" onClick={() => setEditingKey(null)}>Cancel</Button>
									<Button type="submit">Save</Button>
								</div>
							</form>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Full Width Sections */}
			<div className="mt-6 space-y-6">
				{/* Professional Details */}
				<Card>
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg flex items-center gap-2">
								<Briefcase className="h-5 w-5" />
								Professional Details
							</CardTitle>
							{isEditMode && (
								<Button size="sm" variant="outline" onClick={() => setEditingKey(editingKey === "professional" ? null : "professional")}>
									<Pencil className="h-4 w-4 mr-1" /> {editingKey === "professional" ? "Close" : "Edit"}
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid md:grid-cols-2 gap-4">
							<div>
								<div className="text-sm text-muted-foreground mb-1">Current Status</div>
								<div className="font-medium">{profile?.current_status || "—"}</div>
							</div>
							<div>
								<div className="text-sm text-muted-foreground mb-1">Portfolio</div>
								<div className="font-medium">
									{profile?.portfolio ? (
										<a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
											{profile.portfolio}
										</a>
									) : "—"}
								</div>
							</div>
						</div>
						<div>
							<div className="text-sm text-muted-foreground mb-1">Experience</div>
							<div className="font-medium whitespace-pre-wrap">{profile?.experience || "—"}</div>
						</div>

						{editingKey === "professional" && isEditMode && (
							<form
								onSubmit={async (e) => {
									e.preventDefault();
									
									
									await onSave(e);
									setEditingKey(null);
								}}
								className="space-y-4 border-t pt-4"
							>
								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="current_status">Current Status</Label>
										<ChipInput
											name="current_status"
											defaultValue={profile?.current_status ?? ""}
											placeholder="e.g. Looking for opportunities, Freelancing"
											onTextChange={(val) => setProfile((p) => (p ? { ...p, current_status: val } : p))}
											allowToggle={true}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="portfolio">Portfolio URL</Label>
										<ChipInput
											name="portfolio"
											defaultValue={profile?.portfolio ?? ""}
											placeholder="https://your-portfolio.com"
											onTextChange={(val) => setProfile((p) => (p ? { ...p, portfolio: val } : p))}
											allowToggle={true}
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="experience">Experience</Label>
									<Textarea
										id="experience"
										placeholder="Briefly describe your experience, roles, and achievements"
										value={profile?.experience ?? ""}
										onChange={(e) => setProfile((p) => (p ? { ...p, experience: e.target.value } : p))}
										rows={3}
									/>
								</div>
								<div className="flex justify-end gap-2">
									<Button type="button" variant="ghost" onClick={() => setEditingKey(null)}>Cancel</Button>
									<Button type="submit" disabled={loading}>Save</Button>
								</div>
							</form>
						)}
					</CardContent>
				</Card>

				{/* Projects Section */}
				<Card>
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg flex items-center gap-2">
								<FileText className="h-5 w-5" />
								Projects
							</CardTitle>
							{isEditMode && (
								<Button size="sm" variant="outline" onClick={() => setEditingKey(editingKey === "projects" ? null : "projects")}>
									<Pencil className="h-4 w-4 mr-1" /> {editingKey === "projects" ? "Close" : "Edit"}
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent>
						{((getSection<ProjectsContent>("projects")?.content?.projects ?? []) as Project[]).length > 0 ? (
							<div className="space-y-4">
								{(getSection<ProjectsContent>("projects")?.content?.projects ?? []).map((projectRaw: Record<string, unknown>, index: number) => {
									const project = projectRaw as Project;
									const technologies = project.technologies ?? [];
									const links = project.links ?? [];
									return (
										<div key={index} className="border rounded-lg p-4 bg-muted/30">
											<div className="flex items-start justify-between gap-3">
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-2">
														<h4 className="font-semibold text-lg">{String(project.name ?? "")}</h4>
														{project.status && (
															<Badge variant={project.status === 'completed' ? 'default' : project.status === 'in-progress' ? 'secondary' : 'outline'}>
																{project.status === 'completed' ? 'Completed' : project.status === 'in-progress' ? 'In Progress' : String(project.status)}
															</Badge>
														)}
													</div>
													{project.description && (
														<p className="text-muted-foreground mb-3">{String(project.description)}</p>
													)}
													{technologies && technologies.length > 0 && (
														<div className="flex flex-wrap gap-2 mb-3">
															{technologies.map((tech: string, techIndex: number) => (
																<Badge key={techIndex} variant="secondary" className="text-xs">
																	{tech}
																</Badge>
															))}
														</div>
													)}
													{links && links.length > 0 && (
														<div className="flex flex-wrap gap-2">
															{links.map((link: ProjectLink, linkIndex: number) => (
																<a
																	key={linkIndex}
																	href={String(link.url)}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
																>
																	<LinkIcon className="h-3 w-3" />
																	{link.label || 'View Project'}
																</a>
															))}
														</div>
													)}
												</div>
												{isEditMode && (
													<Button
														size="sm"
														variant="ghost"
														onClick={() => {
															const projects = (getSection<ProjectsContent>("projects")?.content?.projects ?? []) as Project[];
															const updatedProjects = projects.filter((_: unknown, i: number) => i !== index);
															upsertSection({
																id: sections.find(s => s.key === "projects")?.id || "",
																key: "projects",
																title: "Projects",
																type: "projects",
																position: 2,
																content: { projects: updatedProjects }
															});
														}}
														className="text-destructive hover:text-destructive"
													>
														×
													</Button>
												)}
											</div>
										</div>
									);
								})}
							</div>
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
								<p>No projects added yet</p>
								{isEditMode && (
									<p className="text-sm mt-1">Click Edit to add your first project</p>
								)}
							</div>
						)}

						{/* Add new project form */}
						{editingKey === "projects" && isEditMode && (
							<form
								onSubmit={async (e) => {
									e.preventDefault();
									
									
									
									const fd = new FormData(e.currentTarget);
									const newProject = {
										name: String(fd.get("project_name") || ""),
										description: String(fd.get("project_description") || ""),
										technologies: String(fd.get("project_technologies") || "").split(/\s*,\s*/).filter(Boolean),
										status: String(fd.get("project_status") || ""),
										links: [
											{
												label: String(fd.get("project_link_label") || "Live Demo"),
												url: String(fd.get("project_link_url") || "")
											}
										].filter(link => link.url)
									};

									const existingProjects = (getSection<ProjectsContent>("projects")?.content?.projects ?? []) as Project[];
									const updatedProjects = [...existingProjects, newProject];

									await upsertSection({
										id: sections.find(s => s.key === "projects")?.id || "",
										key: "projects",
										title: "Projects",
										type: "projects",
										position: 2,
										content: { projects: updatedProjects }
									});

									e.currentTarget.reset();
								}}
								className="border-t pt-4 space-y-4"
							>
								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="project_name">Project Name *</Label>
										<Input
											id="project_name"
											name="project_name"
											placeholder="e.g. E-commerce Platform"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="project_status">Status</Label>
										<select
											id="project_status"
											name="project_status"
											className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
										>
											<option value="">Select Status</option>
											<option value="completed">Completed</option>
											<option value="in-progress">In Progress</option>
											<option value="planned">Planned</option>
											<option value="on-hold">On Hold</option>
										</select>
									</div>
								</div>
								
								<div className="space-y-2">
									<Label htmlFor="project_description">Description</Label>
									<Textarea
										id="project_description"
										name="project_description"
										placeholder="Describe your project, what it does, and your role..."
										rows={3}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="project_technologies">Technologies (comma separated)</Label>
									<Input
										id="project_technologies"
										name="project_technologies"
										placeholder="e.g. React, Node.js, PostgreSQL"
									/>
								</div>

								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="project_link_label">Link Label</Label>
										<Input
											id="project_link_label"
											name="project_link_label"
											placeholder="e.g. Live Demo, GitHub, Website"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="project_link_url">Link URL</Label>
										<Input
											id="project_link_url"
											name="project_link_url"
											placeholder="https://..."
											type="url"
										/>
									</div>
								</div>

								<div className="flex justify-end gap-2">
									<Button type="button" variant="ghost" onClick={() => setEditingKey(null)}>
										Cancel
									</Button>
									<Button type="submit">
										Add Project
									</Button>
								</div>
							</form>
						)}
					</CardContent>
				</Card>

				{/* Custom Sections */}
				{sections
					.filter((s) => s.key !== "personal" && s.key !== "skills" && s.key !== "professional" && s.key !== "projects")
					.sort((a, b) => a.position - b.position)
					.map((s) => (
						<Card key={s.key}>
							<CardHeader className="pb-4">
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">{s.title}</CardTitle>
									{isEditMode && (
										<div className="flex gap-2">
											<Button size="sm" variant="outline" onClick={() => setEditingKey(editingKey === s.key ? null : s.key)}>
												<Pencil className="h-4 w-4 mr-1" /> {editingKey === s.key ? "Close" : "Edit"}
											</Button>
											<Button 
												size="sm" 
												variant="destructive" 
												onClick={async () => {
													if (confirm(`Are you sure you want to delete "${s.title}"?`)) {
														setLoading(true);
														const { error } = await supabase
															.from("profile_sections")
															.delete()
															.eq("id", s.id);
														setLoading(false);
														if (error) {
															toast.error("Error", error.message);
														} else {
															setSections(prev => prev.filter(sec => sec.id !== s.id));
															toast.success("Section deleted", `${s.title} has been deleted successfully`);
														}
													}
												}}
											>
												Delete
											</Button>
										</div>
									)}
								</div>
							</CardHeader>
							<CardContent>
								{renderSectionContent(s.content)}
								{editingKey === s.key && isEditMode && (
									<form
										onSubmit={async (e) => {
											e.preventDefault();
											
											
											const fd = new FormData(e.currentTarget);
											let parsed: unknown;
											try {
												parsed = JSON.parse(String(fd.get("content") || "{}"));
											} catch {
												parsed = { value: String(fd.get("content") || "") };
											}
											const content: Record<string, unknown> = (parsed && typeof parsed === "object") ? (parsed as Record<string, unknown>) : { value: String(parsed ?? "") };
											await upsertSection({ id: s.id, key: s.key, title: s.title, type: s.type, position: s.position, content });
										}}
										className="border-t pt-4 space-y-4"
									>
										<Label htmlFor="content">Section Content</Label>
										<Textarea 
											id="content" 
											name="content" 
											defaultValue={typeof s.content === "string" ? s.content : JSON.stringify(s.content, null, 2)} 
											placeholder="Enter your content here..." 
										/>
										<div className="flex justify-end gap-2">
											<Button type="button" variant="ghost" onClick={() => setEditingKey(null)}>Cancel</Button>
											<Button type="submit">Save</Button>
										</div>
									</form>
								)}
							</CardContent>
						</Card>
					))}

				{/* Create New Section */}
				{isEditMode && (
					<Card>
						<CardHeader className="pb-4">
							<div className="flex items-center gap-2">
								<Plus className="h-5 w-5" />
								<CardTitle className="text-lg">Create New Section</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							<form
								onSubmit={async (e) => {
									e.preventDefault();
									
									
									const fd = new FormData(e.currentTarget);
									const key = String(fd.get("new_key") || "").trim() || `custom_${Date.now()}`;
									const title = String(fd.get("new_title") || "Untitled");
									const position = sections.length + 1;
									let parsed: unknown;
									try {
										parsed = JSON.parse(String(fd.get("new_content") || "{}"));
									} catch {
										parsed = { value: String(fd.get("new_content") || "") };
									}
									const content: Record<string, unknown> = (parsed && typeof parsed === "object") ? (parsed as Record<string, unknown>) : { value: String(parsed ?? "") };
									await upsertSection({ id: "", key, title, type: "custom", position, content });
									e.currentTarget.reset();
								}}
								className="space-y-4"
							>
								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="new_key">Section Key</Label>
										<Input 
											id="new_key" 
											name="new_key" 
											placeholder="e.g. achievements, projects, education" 
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="new_title">Section Title</Label>
										<Input 
											id="new_title" 
											name="new_title" 
											placeholder="e.g. Achievements, Projects, Education" 
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new_content">Content</Label>
									<Textarea 
										id="new_content" 
										name="new_content" 
										placeholder='{"items":["First achievement", "Second achievement"]}' 
									/>
								</div>
								<div className="flex justify-end">
									<Button type="submit" size="sm">
										Create Section
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Skills Management */}
			{isEditMode && (
				<Card className="mt-6">
					<CardHeader className="pb-4">
						<CardTitle className="text-lg flex items-center gap-2">
							<Sparkles className="h-5 w-5" />
							Skills Management
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="max-w-2xl mx-auto">
							<Label htmlFor="skills" className="text-base font-medium mb-3 block">Core Skills</Label>
						{initialLoading ? (
								<div className="space-y-3">
									<Skeleton className="h-10 w-full" />
								<div className="flex gap-2 flex-wrap">
										<Skeleton className="h-6 w-16" />
										<Skeleton className="h-6 w-12" />
										<Skeleton className="h-6 w-20" />
								</div>
							</div>
						) : (
							<>
									<ChipInput
										name="skills_field"
										defaultValue={(profile?.skills ?? []).join(", ")}
										placeholder="Enter your skills and press Enter"
										onArrayChange={(arr) => setProfile((p) => (p ? { ...p, skills: arr } : p))}
										defaultModeChips={true}
								/>
								{(profile?.skills && profile.skills.length > 0) && (
										<div className="flex flex-wrap gap-2 pt-3 justify-center">
										{profile.skills.filter(Boolean).map((skill, idx) => (
											<Badge key={`${skill}-${idx}`} variant="secondary">
												{skill}
											</Badge>
										))}
									</div>
								)}
							</>
						)}
					</div>
				</CardContent>
			</Card>
			)}
		</div>
	);
}
