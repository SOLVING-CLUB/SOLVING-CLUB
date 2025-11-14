

import { cn } from "@/lib/utils";
import * as React from "react";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Size in pixels */
	size?: number;
	/** Accessible label text */
	label?: string;
	/** Use a subtle muted color instead of primary */
	muted?: boolean;
}

export function Spinner({
	className,
	size = 28,
	label = "Loading",
	muted = false,
	...props
}: SpinnerProps) {
	const dimension = `${size}px`;
	return (
		<div
			role="status"
			aria-live="polite"
			aria-busy="true"
			className={cn("inline-flex items-center gap-3", className)}
			{...props}
		>
			<span
				className={cn(
					"block rounded-full animate-spin",
					"border-2 border-muted-foreground/20",
					muted ? "border-t-foreground/60" : "border-t-primary"
				)}
				style={{ width: dimension, height: dimension }}
			/>
			<span className="text-sm text-muted-foreground">{label}…</span>
		</div>
	);
}

export default Spinner;


