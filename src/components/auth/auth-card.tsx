"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthCard({
	title,
	description,
	children,
	footer,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
}) {
	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl">{title}</CardTitle>
					{description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
				</CardHeader>
				<CardContent className="space-y-4">{children}</CardContent>
				{footer ? <div className="p-6 pt-0 text-sm text-center text-muted-foreground">{footer}</div> : null}
			</Card>
		</div>
	);
}
