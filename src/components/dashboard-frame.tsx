"use client";
import Sidebar from "@/components/sidebar";
import MobileSidebar from "@/components/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { FadeIn } from "@/components/transition";

export default function DashboardFrame({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative min-h-screen grid lg:grid-rows-[auto_1fr] transition-colors" style={{ gridTemplateColumns: "64px 1fr" }}>
			{/* Top bar visible on all screens */}
			<div className="flex items-center justify-between border-b p-3 col-span-2 transition-colors">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="icon" aria-label="Toggle sidebar" className="hidden lg:inline-flex pointer-events-none opacity-50">
						<PanelLeft className="h-5 w-5" />
					</Button>
					{/* Mobile sheet trigger */}
					<div className="lg:hidden">
						<MobileSidebar />
					</div>
					<div className="text-2xl lg:text-3xl font-extrabold tracking-tight">Solving Club</div>
				</div>
			</div>

			<div className="hidden lg:block h-full overflow-visible relative z-40">
				<Sidebar />
			</div>

			<FadeIn>
				<main className="p-6 relative z-10">{children}</main>
			</FadeIn>
		</div>
	);
}
