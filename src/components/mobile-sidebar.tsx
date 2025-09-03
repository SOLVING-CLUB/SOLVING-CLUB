"use client";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import ThemeToggle from "@/components/theme-toggle";
import { nav } from "@/components/sidebar";

export default function MobileSidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const supabase = getSupabaseBrowserClient();

	async function onLogout() {
		await supabase.auth.signOut();
		router.replace("/auth/login");
	}

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="ghost" size="icon" aria-label="Open menu">
					<Menu className="h-5 w-5" />
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="p-0">
				<SheetHeader className="px-4 py-3">
					<SheetTitle>Solving Club</SheetTitle>
				</SheetHeader>
				<nav className="px-2 py-2 flex flex-col gap-1">
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
				<div className="mt-auto p-4 border-t flex items-center gap-2">
					<ThemeToggle />
					<Button variant="outline" className="w-full" onClick={onLogout}>Logout</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}
