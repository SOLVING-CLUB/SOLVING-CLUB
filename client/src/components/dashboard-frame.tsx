
import Sidebar from "@/components/sidebar";
import { MobileNavigation } from "@/components/mobile-navigation";
import { FadeIn } from "@/components/transition";
import { GlobalHeader } from "@/components/global-header";

export default function DashboardFrame({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative min-h-screen">
			{/* Global Header - Fixed top right */}
			<GlobalHeader />

			{/* Mobile Navigation */}
			<MobileNavigation />

			{/* Desktop Layout */}
			<div className="hidden lg:grid lg:grid-cols-[64px_1fr] min-h-screen">
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
