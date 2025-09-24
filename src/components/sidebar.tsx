"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import ThemeToggle from "@/components/theme-toggle";
import { LayoutDashboard, BookOpen, Briefcase, User, Clock, LogOut, DollarSign, CheckSquare } from "lucide-react";

export const nav = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/dashboard/learnings", label: "Learnings", icon: BookOpen },
	{ href: "/dashboard/projects", label: "Projects", icon: Briefcase },
	{ href: "/dashboard/global-tasks", label: "Global Tasks", icon: CheckSquare },
	{ href: "/dashboard/financial", label: "Financial", icon: DollarSign },
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
		<aside className="relative z-50 group h-full w-[64px] hover:w-[240px] p-4 flex flex-col bg-background overflow-visible border-r transition-[width] duration-200 ease-in-out">
			<nav className="flex flex-col gap-2">
				{nav.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							"flex items-center rounded-lg py-2.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
							"justify-center group-hover:justify-start px-0 group-hover:px-3 gap-0 group-hover:gap-3",
							pathname === item.href && "bg-accent text-accent-foreground"
						)}
					>
						<item.icon className="h-4 w-4 shrink-0" />
						<span className="hidden group-hover:inline transition-all duration-200 whitespace-nowrap">
							{item.label}
						</span>
					</Link>
				))}
			</nav>
			<div className="mt-4 pt-2 space-y-2 border-t">
				<div className="flex justify-center">
					<ThemeToggle />
				</div>
				<Button
					variant="outline"
					className="w-full justify-center group-hover:justify-start px-0 group-hover:px-3 gap-0 group-hover:gap-2"
					onClick={onLogout}
				>
					<LogOut className="h-4 w-4 shrink-0" />
					<span className="hidden group-hover:inline transition-all duration-200">Logout</span>
				</Button>
			</div>
		</aside>
	);
}
