
import Sidebar from "@/components/sidebar";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { FadeIn } from "@/components/transition";

export default function DashboardFrame({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative min-h-screen">
			{/* Mobile Navigation */}
			<MobileNavigation />

			{/* Desktop Layout */}
			<div className="hidden lg:grid lg:grid-cols-[64px_1fr] lg:grid-rows-[auto_1fr] min-h-screen">
				{/* Desktop Top Bar */}
				<div className="flex items-center justify-between border-b p-3 col-span-2">
					<div className="flex items-center gap-3">
						<Button variant="ghost" size="icon" aria-label="Toggle sidebar" className="pointer-events-none opacity-50">
							<PanelLeft className="h-5 w-5" />
						</Button>
						<div className="text-2xl lg:text-3xl font-extrabold tracking-tight">Solving Club</div>
					</div>
				</div>

				{/* Desktop Sidebar */}
				<div className="h-full overflow-visible relative z-40">
					<Sidebar />
				</div>

				{/* Desktop Main Content */}
				<FadeIn>
					<main className="p-4 sm:p-6 relative z-10">{children}</main>
				</FadeIn>
			</div>

			{/* Mobile Main Content */}
			<div className="lg:hidden">
				<FadeIn>
					<main className="pb-20 relative z-10">{children}</main>
				</FadeIn>
			</div>
		</div>
	);
}
