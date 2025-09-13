"use client";

import * as React from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
	visible: boolean;
	label?: string;
	blur?: boolean;
	className?: string;
}

export function LoadingOverlay({ visible, label = "Loading", blur = true, className }: LoadingOverlayProps) {
	if (!visible) return null;

	return (
		<div
			className={cn(
				"fixed inset-0 z-50 flex items-center justify-center",
				"bg-background/60",
				blur ? "backdrop-blur-sm" : undefined,
				className
			)}
			aria-busy="true"
			aria-live="polite"
		>
			<div className="pointer-events-none select-none">
				<Spinner size={36} label={label} />
			</div>
		</div>
	);
}

export default LoadingOverlay;


