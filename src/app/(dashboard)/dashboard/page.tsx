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
		<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{sections.map((s) => (
				<Link key={s.href} href={s.href}>
					<Card className="h-full">
						<CardHeader>
							<CardTitle>{s.title}</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">{s.description}</p>
						</CardContent>
					</Card>
				</Link>
			))}
		</div>
	);
}
