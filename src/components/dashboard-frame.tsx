"use client";
import { useState } from "react";
import Sidebar from "@/components/sidebar";
import MobileSidebar from "@/components/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { FadeIn } from "@/components/transition";

export default function DashboardFrame({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = useState(true);

	return (
		<div className="min-h-screen grid grid-rows-[auto_1fr] lg:grid-rows-1 transition-colors">
			{/* Top bar visible on all screens */}
			<div className="flex items-center justify-between border-b p-3 lg:col-span-2 transition-colors">
				<div className="flex items-center gap-3">
					{/* Desktop toggle */}
					<Button
						variant="ghost"
						size="icon"
						aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
						onClick={() => setOpen((v) => !v)}
						className="hidden lg:inline-flex"
					>
						{open ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
					</Button>
					{/* Mobile sheet trigger */}
					<div className="lg:hidden">
						<MobileSidebar />
					</div>
					<div className="text-2xl lg:text-3xl font-extrabold tracking-tight">Solving Club</div>
				</div>
			</div>

			<div className="hidden lg:block" style={{ width: open ? 240 : 0, transition: "width 250ms ease" }}>
				{open ? (
					<div className="border-r overflow-hidden h-full">
						<Sidebar />
					</div>
				) : null}
			</div>

			<FadeIn>
				<main className="p-6">{children}</main>
			</FadeIn>
		</div>
	);
}
