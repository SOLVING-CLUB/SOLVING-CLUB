
import Sidebar from "@/components/sidebar";
import { MobileNavigation } from "@/components/mobile-navigation";
import { FadeIn } from "@/components/transition";
import { GlobalHeader } from "@/components/global-header";

function TopBar() {
	return (
		<header className="sticky top-0 z-50 flex h-12 sm:h-14 items-center justify-between border-b bg-background/80 px-4 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/70">
			<div className="flex items-center gap-3">
				<span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-[10px] font-bold tracking-[0.2em] text-background">
					SC
				</span>
				<span className="text-sm sm:text-base font-semibold tracking-[0.18em] uppercase text-foreground/90">
					Solving Club
				</span>
			</div>
			<GlobalHeader />
		</header>
	);
}

export default function DashboardFrame({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative min-h-screen">
			{/* Mobile Navigation */}
			<MobileNavigation />

			{/* Desktop Layout */}
			<div className="hidden lg:block">
				<TopBar />
				<div className="grid grid-cols-[64px_1fr] min-h-[calc(100vh-theme(spacing.14))]">
					{/* Desktop Sidebar */}
					<div className="sticky top-14 h-[calc(100vh-theme(spacing.14))] overflow-visible relative z-40">
						<Sidebar />
					</div>

					{/* Desktop Main Content */}
					<FadeIn>
						<main className="relative z-10 p-4 sm:p-6">{children}</main>
					</FadeIn>
				</div>
			</div>

			{/* Mobile Main Content */}
			<div className="lg:hidden">
				<TopBar />
				<FadeIn>
					<main className="pb-20 relative z-10">{children}</main>
				</FadeIn>
			</div>
		</div>
	);
}
