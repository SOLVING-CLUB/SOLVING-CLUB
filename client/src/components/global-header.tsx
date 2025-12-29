import { NotificationBell } from "@/components/notification-bell";
import ThemeToggle from "@/components/theme-toggle";

export function GlobalHeader() {
	return (
		<div className="fixed top-3 right-3 lg:top-4 lg:right-4 z-[60] flex items-center gap-2">
			<NotificationBell />
			<div className="hidden lg:block">
				<ThemeToggle />
			</div>
		</div>
	);
}

