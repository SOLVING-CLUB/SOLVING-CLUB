"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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

export default function ProfilePage() {
	const supabase = getSupabaseBrowserClient();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(false);
	const [initialLoading, setInitialLoading] = useState(true);

	useEffect(() => {
		(async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;
			const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
			if (error) {
				toast.error(error.message);
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
			setInitialLoading(false);
		})();
	}, [supabase]);

	async function onSave(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!profile) return;
		setLoading(true);
		const { error } = await supabase.from("profiles").upsert(profile, { onConflict: "id" });
		setLoading(false);
		if (error) return toast.error(error.message);
		toast.success("Profile saved.");
	}

	return (
		<div className="w-full max-w-3xl py-10 md:py-16">
			<Card>
				<div className="h-1.5 bg-gradient-to-r from-primary/70 via-primary to-primary/70" />
				<CardHeader className="border-b">
					<CardTitle>Your Profile</CardTitle>
					<CardDescription>Manage your personal information and career details.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6 px-0 md:px-6">
					{/* Header: Avatar + Name + Quick info */}
					<div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 text-left">
						{initialLoading ? (
							<Skeleton className="h-16 w-16 rounded-full" />
						) : (
							<Avatar className="h-16 w-16">
								<AvatarImage src={profile?.avatar_url ?? undefined} />
								<AvatarFallback>
									{profile?.full_name?.[0]?.toUpperCase() ?? "?"}
								</AvatarFallback>
							</Avatar>
						)}
						<div className="grid gap-3 w-full max-w-md">
							<div className="grid gap-1">
								<Label htmlFor="full_name">Name</Label>
								{initialLoading ? (
									<Skeleton className="h-9 w-full" />
								) : (
									<Input
										id="full_name"
										value={profile?.full_name ?? ""}
										onChange={(e) => setProfile((p) => (p ? { ...p, full_name: e.target.value } : p))}
									/>
								)}
							</div>
							<div className="grid gap-1">
								<Label htmlFor="career_focus">Career Focus</Label>
								{initialLoading ? (
									<Skeleton className="h-9 w-full" />
								) : (
									<Input
										id="career_focus"
										value={profile?.career_focus ?? ""}
										onChange={(e) => setProfile((p) => (p ? { ...p, career_focus: e.target.value } : p))}
									/>
								)}
							</div>
						</div>
					</div>

					<Separator />

					{/* Skills */}
					<div className="grid gap-2 max-w-2xl mx-auto">
						<Label htmlFor="skills">Skills</Label>
						{initialLoading ? (
							<div className="grid gap-2">
								<Skeleton className="h-9 w-full" />
								<div className="flex gap-2 flex-wrap">
									<Skeleton className="h-5 w-16" />
									<Skeleton className="h-5 w-12" />
									<Skeleton className="h-5 w-20" />
								</div>
							</div>
						) : (
							<>
								<Input
									id="skills"
									placeholder="e.g. React, TypeScript, Tailwind"
									value={(profile?.skills ?? []).join(", ")}
									onChange={(e) =>
										setProfile((p) => (p ? { ...p, skills: e.target.value.split(/\s*,\s*/) } : p))
									}
								/>
								{(profile?.skills && profile.skills.length > 0) && (
									<div className="flex flex-wrap gap-2 pt-1 justify-center">
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

					<Separator />

					{/* Two-column details */}
					<form onSubmit={onSave} className="grid gap-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="grid gap-2">
								<Label htmlFor="current_status">Current Status</Label>
								{initialLoading ? (
									<Skeleton className="h-9 w-full" />
								) : (
									<Input
										id="current_status"
										value={profile?.current_status ?? ""}
										onChange={(e) => setProfile((p) => (p ? { ...p, current_status: e.target.value } : p))}
									/>
								)}
							</div>
							<div className="grid gap-2">
								<Label htmlFor="portfolio">Portfolio URL</Label>
								{initialLoading ? (
									<Skeleton className="h-9 w-full" />
								) : (
									<Input
										id="portfolio"
										type="url"
										placeholder="https://your-portfolio.com"
										value={profile?.portfolio ?? ""}
										onChange={(e) => setProfile((p) => (p ? { ...p, portfolio: e.target.value } : p))}
									/>
								)}
							</div>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="experience">Experience</Label>
							{initialLoading ? (
								<Skeleton className="h-32 w-full" />
							) : (
								<Textarea
									id="experience"
									placeholder="Briefly describe your experience, roles, and achievements"
									value={profile?.experience ?? ""}
									onChange={(e) => setProfile((p) => (p ? { ...p, experience: e.target.value } : p))}
								/>
							)}
						</div>

						<div className="flex justify-center">
							<Button type="submit" disabled={loading || initialLoading}>
								{loading ? "Saving..." : "Save Profile"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
