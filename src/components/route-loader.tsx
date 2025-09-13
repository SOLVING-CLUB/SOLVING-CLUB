"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function RouteLoaderOverlay() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState(false);
	const timerRef = useRef<number | null>(null);
	const lastKeyRef = useRef<string>("");

	useEffect(() => {
		// Start a short delay to avoid flicker on very fast transitions
		setLoading(false);
		if (timerRef.current) window.clearTimeout(timerRef.current);
		timerRef.current = window.setTimeout(() => setLoading(true), 120);
		lastKeyRef.current = `${pathname}?${searchParams?.toString() ?? ""}`;
		return () => {
			if (timerRef.current) window.clearTimeout(timerRef.current);
		};
	}, [pathname, searchParams]);

	useEffect(() => {
		// When the route becomes stable (first paint), turn off after a tiny delay
		const done = window.requestAnimationFrame(() => {
			if (loading) {
				setLoading(false);
			}
		});
		return () => window.cancelAnimationFrame(done);
	}, [loading, pathname, searchParams]);

	if (!loading) return null;

	return (
		<div className="fixed inset-0 z-[100] grid place-items-center bg-background/40 backdrop-blur-sm">
			<div className="flex items-center gap-3 text-muted-foreground rounded-md border bg-card px-4 py-2 shadow-sm">
				<span className="inline-block h-5 w-5 rounded-full border-2 border-muted-foreground/40 border-t-muted-foreground animate-spin" />
				<span>Loading…</span>
			</div>
		</div>
	);
}


