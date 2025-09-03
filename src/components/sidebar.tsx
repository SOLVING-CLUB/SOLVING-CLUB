"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import ThemeToggle from "@/components/theme-toggle";

export const nav = [
	{ href: "/dashboard/learnings", label: "Learnings" },
	{ href: "/dashboard/projects", label: "Projects" },
	{ href: "/dashboard/profile", label: "Profile" },
	{ href: "/dashboard/hours", label: "Hours" },
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
		<aside className="h-full border-r w-full max-w-[240px] p-4 flex flex-col">
			<nav className="flex flex-col gap-1">
				{nav.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							"rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900",
							pathname?.startsWith(item.href) && "bg-neutral-100 dark:bg-neutral-900"
						)}
					>
						{item.label}
					</Link>
				))}
			</nav>
			<div className="mt-auto pt-4 space-y-2">
				<div>
					<ThemeToggle />
				</div>
				<Button variant="outline" className="w-full" onClick={onLogout}>Logout</Button>
			</div>
		</aside>
	);
}
