

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MobileOptimizedCardProps {
	title: string;
	description?: string;
	children: React.ReactNode;
	className?: string;
	headerClassName?: string;
	contentClassName?: string;
	actions?: React.ReactNode;
}

export function MobileOptimizedCard({
	title,
	description,
	children,
	className,
	headerClassName,
	contentClassName,
	actions
}: MobileOptimizedCardProps) {
	return (
		<Card className={cn("w-full", className)}>
			<CardHeader className={cn("pb-3 sm:pb-4", headerClassName)}>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
					<div className="min-w-0 flex-1">
						<CardTitle className="text-lg sm:text-xl lg:text-2xl truncate">
							{title}
						</CardTitle>
						{description && (
							<CardDescription className="text-sm sm:text-base mt-1 line-clamp-2">
								{description}
							</CardDescription>
						)}
					</div>
					{actions && (
						<div className="flex-shrink-0">
							{actions}
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent className={cn("space-y-3 sm:space-y-4", contentClassName)}>
				{children}
			</CardContent>
		</Card>
	);
}

interface MobileStatsCardProps {
	title: string;
	value: string | number;
	description?: string;
	icon?: React.ReactNode;
	trend?: {
		value: number;
		label: string;
		positive?: boolean;
	};
	className?: string;
}

export function MobileStatsCard({
	title,
	value,
	description,
	icon,
	trend,
	className
}: MobileStatsCardProps) {
	return (
		<Card className={cn("p-4 sm:p-6", className)}>
			<div className="flex items-center justify-between">
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium text-muted-foreground truncate">
						{title}
					</p>
					<div className="flex items-baseline gap-2 mt-1">
						<p className="text-2xl sm:text-3xl font-bold">
							{value}
						</p>
						{trend && (
							<span className={cn(
								"text-xs font-medium",
								trend.positive ? "text-green-600" : "text-red-600"
							)}>
								{trend.positive ? "+" : ""}{trend.value}% {trend.label}
							</span>
						)}
					</div>
					{description && (
						<p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
							{description}
						</p>
					)}
				</div>
				{icon && (
					<div className="flex-shrink-0 ml-4">
						{icon}
					</div>
				)}
			</div>
		</Card>
	);
}

interface MobileActionButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
	size?: "default" | "sm" | "lg" | "icon";
	className?: string;
	disabled?: boolean;
	loading?: boolean;
	fullWidth?: boolean;
}

export function MobileActionButton({
	children,
	onClick,
	variant = "default",
	size = "default",
	className,
	disabled,
	loading,
	fullWidth = true
}: MobileActionButtonProps) {
	return (
		<button
			onClick={onClick}
			disabled={disabled || loading}
			className={cn(
				"inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				"disabled:pointer-events-none disabled:opacity-50",
				{
					"bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
					"border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
					"bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
					"hover:bg-accent hover:text-accent-foreground": variant === "ghost",
					"text-primary underline-offset-4 hover:underline": variant === "link",
					"bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
				},
				{
					"h-10 px-4 py-2": size === "default",
					"h-9 rounded-md px-3": size === "sm",
					"h-11 rounded-md px-8": size === "lg",
					"h-10 w-10": size === "icon",
				},
				fullWidth && "w-full",
				className
			)}
		>
			{loading ? (
				<>
					<svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
					Loading...
				</>
			) : (
				children
			)}
		</button>
	);
}
