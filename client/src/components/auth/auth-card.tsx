
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
		<div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
			<Card className="w-full max-w-md mx-auto">
				<CardHeader className="pb-4 sm:pb-6">
					<CardTitle className="text-xl sm:text-2xl text-center">{title}</CardTitle>
					{description ? (
						<p className="text-sm sm:text-base text-muted-foreground text-center mt-2">
							{description}
						</p>
					) : null}
				</CardHeader>
				<CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
					{children}
				</CardContent>
				{footer ? (
					<div className="px-4 sm:px-6 pb-4 sm:pb-6 text-sm text-center text-muted-foreground">
						{footer}
					</div>
				) : null}
			</Card>
		</div>
	);
}
