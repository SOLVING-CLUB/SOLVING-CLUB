"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface MobileFormFieldProps {
	label: string;
	error?: string;
	required?: boolean;
	children: React.ReactNode;
	className?: string;
}

export function MobileFormField({ 
	label, 
	error, 
	required, 
	children, 
	className 
}: MobileFormFieldProps) {
	return (
		<div className={cn("space-y-2", className)}>
			<Label className="text-sm font-medium">
				{label}
				{required && <span className="text-destructive ml-1">*</span>}
			</Label>
			{children}
			{error && (
				<p className="text-sm text-destructive">{error}</p>
			)}
		</div>
	);
}

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	error?: boolean;
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
	({ className, error, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
					error && "border-destructive focus-visible:ring-destructive",
					className
				)}
				ref={ref}
				{...props}
			/>
		);
	}
);
MobileInput.displayName = "MobileInput";

interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	error?: boolean;
}

export const MobileTextarea = forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
	({ className, error, ...props }, ref) => {
		return (
			<textarea
				className={cn(
					"flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
					error && "border-destructive focus-visible:ring-destructive",
					className
				)}
				ref={ref}
				{...props}
			/>
		);
	}
);
MobileTextarea.displayName = "MobileTextarea";

interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
	error?: boolean;
	children: React.ReactNode;
}

export const MobileSelect = forwardRef<HTMLSelectElement, MobileSelectProps>(
	({ className, error, children, ...props }, ref) => {
		return (
			<select
				className={cn(
					"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
					error && "border-destructive focus-visible:ring-destructive",
					className
				)}
				ref={ref}
				{...props}
			>
				{children}
			</select>
		);
	}
);
MobileSelect.displayName = "MobileSelect";

interface MobileFormGroupProps {
	children: React.ReactNode;
	className?: string;
	columns?: 1 | 2;
}

export function MobileFormGroup({ 
	children, 
	className, 
	columns = 1 
}: MobileFormGroupProps) {
	return (
		<div className={cn(
			"space-y-4",
			columns === 2 && "grid grid-cols-1 sm:grid-cols-2 gap-4",
			className
		)}>
			{children}
		</div>
	);
}

interface MobileFormActionsProps {
	children: React.ReactNode;
	className?: string;
}

export function MobileFormActions({ children, className }: MobileFormActionsProps) {
	return (
		<div className={cn(
			"flex flex-col sm:flex-row gap-3 pt-4",
			className
		)}>
			{children}
		</div>
	);
}

interface MobileFormProps {
	children: React.ReactNode;
	onSubmit: (e: React.FormEvent) => void;
	className?: string;
}

export function MobileForm({ children, onSubmit, className }: MobileFormProps) {
	return (
		<form 
			onSubmit={onSubmit} 
			className={cn("space-y-6", className)}
		>
			{children}
		</form>
	);
}
