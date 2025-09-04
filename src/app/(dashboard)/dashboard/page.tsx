import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
	{ href: "/dashboard/profile", title: "Profile", description: "Create and edit your member profile." },
	{ href: "/dashboard/hours", title: "Hours", description: "Log and view weekly availability." },
	{ href: "/dashboard/learnings", title: "Learnings", description: "Track notes and resource links." },
	{ href: "/dashboard/projects", title: "Projects", description: "Manage freelance workspaces and chat." },
];

export default function DashboardHome() {
	return (
		<div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
			{/* Header */}
			<Card className="mb-6">
				<CardHeader className="pb-4">
					<CardTitle className="text-2xl">Dashboard</CardTitle>
					<p className="text-muted-foreground">Access all your Solving Club features and tools.</p>
				</CardHeader>
			</Card>

			{/* Features Grid */}
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
				{sections.map((s) => (
					<Link key={s.href} href={s.href}>
						<Card className="h-full hover:shadow-lg transition-shadow duration-200">
							<CardHeader className="pb-4">
								<CardTitle className="text-lg">{s.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">{s.description}</p>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
