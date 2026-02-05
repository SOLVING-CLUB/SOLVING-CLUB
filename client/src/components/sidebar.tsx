
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase";
import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionKey } from "@/lib/access/permissions";
import {
	LayoutDashboard,
	BookOpen,
	Briefcase,
	User,
	Clock,
	LogOut,
	DollarSign,
	CheckSquare,
	Shield,
	Calendar,
	Bell,
	FileText,
	FileEdit,
} from "lucide-react";

type NavItem = {
	href: string;
	label: string;
	icon: typeof LayoutDashboard;
	permission?: PermissionKey;
};

export const nav: NavItem[] = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
	{ href: "/dashboard/learnings", label: "Learnings", icon: BookOpen, permission: "learnings.manage" },
	{ href: "/dashboard/projects", label: "Projects", icon: Briefcase, permission: "projects.view" },
	{ href: "/dashboard/global-tasks", label: "Global Tasks", icon: CheckSquare, permission: "global_tasks.manage" },
	{ href: "/dashboard/financial", label: "Financial", icon: DollarSign, permission: "financial.view" },
	{ href: "/dashboard/documents", label: "Documents", icon: FileText, permission: "documents.manage" },
	{ href: "/dashboard/quotations/create", label: "Quotations", icon: FileEdit, permission: "quotations.manage" },
	{ href: "/dashboard/calendar", label: "Calendar", icon: Calendar, permission: "calendar.view" },
	{ href: "/dashboard/notifications", label: "Notifications", icon: Bell, permission: "dashboard.view" },
	{ href: "/dashboard/profile", label: "Profile", icon: User, permission: "profile.manage" },
	{ href: "/dashboard/hours", label: "Hours", icon: Clock, permission: "hours.view" },
	{ href: "/dashboard/admin", label: "Admin", icon: Shield, permission: "admin.access" },
];

export default function Sidebar() {
	const [pathname] = useLocation();
	const [, setLocation] = useLocation();
	const supabase = getSupabaseClient();
	const { has, loading } = usePermissions();
	const visibleNav = nav.filter((item) => !item.permission || (!loading && has(item.permission)));

	async function onLogout() {
		await supabase.auth.signOut();
		setLocation("/auth/login");
	}

	return (
		<aside className="sidebar-scroll relative z-50 group h-full w-[64px] hover:w-[240px] p-4 flex flex-col bg-background overflow-y-auto border-r transition-[width] duration-200 ease-in-out">
			<nav className="flex flex-col gap-2">
				{visibleNav.map((item) => {
					const isActive =
						pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex items-center rounded-lg py-2.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
								"justify-center group-hover:justify-start px-0 group-hover:px-3 gap-0 group-hover:gap-3",
								isActive && "bg-accent text-accent-foreground"
							)}
						>
							<item.icon className="h-4 w-4 shrink-0" />
							<span className="hidden group-hover:inline transition-all duration-200 whitespace-nowrap">
								{item.label}
							</span>
						</Link>
					);
				})}
			</nav>
			<div className="mt-4 pt-2 space-y-2 border-t">
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
