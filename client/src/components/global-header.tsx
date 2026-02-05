import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/notification-bell";
import ThemeToggle from "@/components/theme-toggle";
import { getSupabaseClient } from "@/lib/supabase";
import { useLocation } from "wouter";

export function GlobalHeader() {
	const supabase = getSupabaseClient();
	const [, setLocation] = useLocation();
	const [name, setName] = useState<string>("Profile");
	const initials = name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word[0])
		.join("")
		.toUpperCase();

	useEffect(() => {
		let isMounted = true;
		async function loadProfile() {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;
			const { data } = await supabase
				.from("profiles")
				.select("full_name, email")
				.eq("id", user.id)
				.maybeSingle();
			if (!isMounted) return;
			const label = data?.full_name?.trim() || data?.email || "Profile";
			setName(label);
		}
		loadProfile();
		const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
			loadProfile();
		});
		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, [supabase]);

	return (
		<div className="flex items-center gap-2">
			<NotificationBell />
			<div className="hidden lg:block">
				<ThemeToggle />
			</div>
			<button
				type="button"
				onClick={() => setLocation("/dashboard/profile")}
				className="ml-2 flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium text-foreground/90 transition hover:bg-accent"
			>
				<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold uppercase text-background">
					{initials || "SC"}
				</span>
				<span className="hidden sm:inline">{name}</span>
			</button>
		</div>
	);
}
