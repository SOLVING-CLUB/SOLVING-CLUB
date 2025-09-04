"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import ThemeToggle from "@/components/theme-toggle";
import { LayoutDashboard, BookOpen, Briefcase, User, Clock } from "lucide-react";

export const nav = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/dashboard/learnings", label: "Learnings", icon: BookOpen },
	{ href: "/dashboard/projects", label: "Projects", icon: Briefcase },
	{ href: "/dashboard/profile", label: "Profile", icon: User },
	{ href: "/dashboard/hours", label: "Hours", icon: Clock },
];

export default function Sidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const supabase = getSupabaseBrowserClient();

	async function onLogout() {
		await supabase.auth.signOut();
		router.replace("/auth/login");
	}

	return (
		<aside className="h-full border-r w-full max-w-[240px] p-4 flex flex-col bg-background">
			<nav className="flex flex-col gap-2">
				{nav.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
							pathname === item.href && "bg-accent text-accent-foreground"
						)}
					>
						<item.icon className="h-4 w-4" />
						{item.label}
					</Link>
				))}
			</nav>
			<div className="mt-4 pt-2 space-y-2 border-t">
				<div className="flex justify-center">
					<ThemeToggle />
				</div>
				<Button variant="outline" className="w-full" onClick={onLogout}>
					Logout
				</Button>
			</div>
		</aside>
	);
}
