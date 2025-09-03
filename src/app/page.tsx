import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Clock, BookOpen, FolderKanban } from "lucide-react";
import { FadeIn } from "@/components/transition";

export default function Home() {
	const features = [
		{
			title: "Profile",
			description: "Create and showcase your skills, experience, and portfolio.",
			href: "/dashboard/profile",
			icon: <User className="h-5 w-5" />,
		},
		{
			title: "Hours",
			description: "Log availability and view the team calendar.",
			href: "/dashboard/hours",
			icon: <Clock className="h-5 w-5" />,
		},
		{
			title: "Learnings",
			description: "Track notes and organize learning resources.",
			href: "/dashboard/learnings",
			icon: <BookOpen className="h-5 w-5" />,
		},
		{
			title: "Projects",
			description: "Manage freelance projects, roles, tasks, and chat.",
			href: "/dashboard/projects",
			icon: <FolderKanban className="h-5 w-5" />,
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-black">
			<FadeIn>
			<section className="mx-auto max-w-5xl px-6 py-20 text-center">
				<h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
					<span className="bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent">Solving Club</span>
				</h1>
				<p className="mt-4 text-base sm:text-lg text-muted-foreground">
					Your hub for learning, project collaboration, member profiles, and working hours.
				</p>
				<div className="mt-8 flex items-center justify-center gap-3">
					<Link href="/auth/login">
						<Button size="lg">Login</Button>
					</Link>
					<Link href="/auth/signup">
						<Button size="lg" variant="secondary">Create account</Button>
					</Link>
					<Link href="/dashboard">
						<Button size="lg" variant="outline">Open dashboard</Button>
					</Link>
				</div>
			</section>
			</FadeIn>

			<section className="mx-auto max-w-5xl px-6 pb-20">
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{features.map((f, i) => (
						<Link key={f.href} href={f.href}>
							<FadeIn delay={i * 50}>
								<Card className="h-full transition hover:shadow-md">
									<CardHeader className="flex flex-row items-center gap-2">
										{f.icon}
										<CardTitle className="text-base">{f.title}</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">{f.description}</p>
									</CardContent>
								</Card>
							</FadeIn>
						</Link>
					))}
				</div>
			</section>
		</div>
	);
}
