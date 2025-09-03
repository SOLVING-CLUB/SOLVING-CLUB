"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

	useEffect(() => {
		(async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;
			const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
			if (error) {
				toast.error(error.message);
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
		<div className="max-w-3xl space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Your Profile</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSave} className="space-y-4">
						<div className="flex items-center gap-4">
							<Avatar className="h-16 w-16">
								<AvatarImage src={profile?.avatar_url ?? undefined} />
								<AvatarFallback>
									{profile?.full_name?.[0]?.toUpperCase() ?? "?"}
								</AvatarFallback>
							</Avatar>
							<div className="space-y-1">
								<Label htmlFor="full_name">Name</Label>
								<Input
									id="full_name"
									value={profile?.full_name ?? ""}
									onChange={(e) => setProfile((p) => (p ? { ...p, full_name: e.target.value } : p))}
								/>
							</div>
						</div>

						<div>
							<Label htmlFor="career_focus">Career Focus</Label>
							<Input
								id="career_focus"
								value={profile?.career_focus ?? ""}
								onChange={(e) => setProfile((p) => (p ? { ...p, career_focus: e.target.value } : p))}
							/>
						</div>

						<div>
							<Label htmlFor="skills">Skills (comma separated)</Label>
							<Input
								id="skills"
								value={(profile?.skills ?? []).join(", ")}
								onChange={(e) =>
									setProfile((p) => (p ? { ...p, skills: e.target.value.split(/\s*,\s*/) } : p))
								}
							/>
						</div>

						<div>
							<Label htmlFor="experience">Experience</Label>
							<Textarea
								id="experience"
								value={profile?.experience ?? ""}
								onChange={(e) => setProfile((p) => (p ? { ...p, experience: e.target.value } : p))}
							/>
						</div>

						<div>
							<Label htmlFor="current_status">Current Status</Label>
							<Input
								id="current_status"
								value={profile?.current_status ?? ""}
								onChange={(e) => setProfile((p) => (p ? { ...p, current_status: e.target.value } : p))}
							/>
						</div>

						<div>
							<Label htmlFor="portfolio">Portfolio URL</Label>
							<Input
								id="portfolio"
								type="url"
								value={profile?.portfolio ?? ""}
								onChange={(e) => setProfile((p) => (p ? { ...p, portfolio: e.target.value } : p))}
							/>
						</div>

						<div className="flex justify-end">
							<Button type="submit" disabled={loading}>
								{loading ? "Saving..." : "Save Profile"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
