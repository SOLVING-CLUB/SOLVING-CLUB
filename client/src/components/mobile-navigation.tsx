

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
	Menu, 
	Home, 
	User, 
	Clock, 
	BookOpen, 
	FolderOpen, 
	Settings, 
	LogOut,
	Search,
	DollarSign
} from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase";
import ThemeToggle from "@/components/theme-toggle";

const navigation = [
	{ name: "Dashboard", href: "/dashboard", icon: Home },
	{ name: "Profile", href: "/dashboard/profile", icon: User },
	{ name: "Hours", href: "/dashboard/hours", icon: Clock },
	{ name: "Learnings", href: "/dashboard/learnings", icon: BookOpen },
	{ name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
	{ name: "Financial", href: "/dashboard/financial", icon: DollarSign },
];

export function MobileNavigation() {
	const [isOpen, setIsOpen] = useState(false);
	const [location, setLocation] = useLocation();
	const supabase = getSupabaseClient();

	const handleLogout = async () => {
		await supabase.auth.signOut();
		setLocation("/auth/login");
		setIsOpen(false);
	};

	return (
		<>
			{/* Mobile Header */}
			<div className="lg:hidden bg-background border-b px-4 py-3 sticky top-0 z-50">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Sheet open={isOpen} onOpenChange={setIsOpen}>
							<SheetTrigger asChild>
								<Button variant="ghost" size="icon" className="md:hidden">
									<Menu className="h-5 w-5" />
									<span className="sr-only">Open menu</span>
								</Button>
							</SheetTrigger>
							<SheetContent side="left" className="w-72 p-0">
								<div className="flex flex-col h-full">
									{/* Header */}
									<div className="p-4 border-b">
										<h2 className="text-lg font-semibold">Solving Club</h2>
									</div>

									{/* Navigation */}
									<nav className="flex-1 p-4 space-y-2">
										{navigation.map((item) => {
											const isActive = location === item.href || 
												(item.href !== "/dashboard" && location?.startsWith(item.href));
											
											return (
												<Link
													key={item.name}
													href={item.href}
													onClick={() => setIsOpen(false)}
													className={cn(
														"flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
														isActive
															? "bg-primary text-primary-foreground"
															: "text-muted-foreground hover:text-foreground hover:bg-muted"
													)}
												>
													<item.icon className="h-4 w-4" />
													{item.name}
												</Link>
											);
										})}
									</nav>

									{/* Footer */}
									<div className="p-4 border-t space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-sm text-muted-foreground">Theme</span>
											<ThemeToggle />
										</div>
										<Button
											variant="outline"
											onClick={handleLogout}
											className="w-full justify-start"
										>
											<LogOut className="h-4 w-4 mr-2" />
											Sign out
										</Button>
									</div>
								</div>
							</SheetContent>
						</Sheet>
						
						<div>
							<h1 className="text-lg font-semibold">Solving Club</h1>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" className="md:hidden">
							<Search className="h-4 w-4" />
							<span className="sr-only">Search</span>
						</Button>
						<div className="md:hidden">
							<NotificationBell />
						</div>
					</div>
				</div>
			</div>

			{/* Mobile Bottom Navigation */}
			<div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
				<div className="grid grid-cols-6 h-16">
					{navigation.map((item) => {
						const isActive = location === item.href || 
							(item.href !== "/dashboard" && location?.startsWith(item.href));
						
						return (
							<Link
								key={item.name}
								href={item.href}
								className={cn(
									"flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
									isActive
										? "text-primary"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								<item.icon className="h-4 w-4" />
								<span className="truncate">{item.name}</span>
							</Link>
						);
					})}
				</div>
			</div>
		</>
	);
}

interface MobilePageHeaderProps {
	title: string;
	description?: string;
	actions?: React.ReactNode;
	className?: string;
}

export function MobilePageHeader({ 
	title, 
	description, 
	actions, 
	className 
}: MobilePageHeaderProps) {
	return (
		<div className={cn("px-4 py-4 sm:px-6", className)}>
			<div className="flex items-center justify-between">
				<div className="min-w-0 flex-1">
					<h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
						{title}
					</h1>
					{description && (
						<p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-2">
							{description}
						</p>
					)}
				</div>
				{actions && (
					<div className="flex-shrink-0 ml-4">
						{actions}
					</div>
				)}
			</div>
		</div>
	);
}

interface MobileSearchBarProps {
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

export function MobileSearchBar({ 
	placeholder = "Search...", 
	value, 
	onChange, 
	className 
}: MobileSearchBarProps) {
	return (
		<div className={cn("px-4 py-3", className)}>
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<input
					type="text"
					placeholder={placeholder}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
				/>
			</div>
		</div>
	);
}
