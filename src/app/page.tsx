import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Clock, BookOpen, FolderKanban } from "lucide-react";
import { FadeIn } from "@/components/transition";
import Starfield from "@/components/starfield";

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
		<div className="relative min-h-screen overflow-hidden bg-black">
			<Starfield />
			<FadeIn>
			<section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 text-center">
				<h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
					<span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-teal-300 bg-clip-text text-transparent">Solving Club</span>
				</h1>
				<p className="mt-6 text-base sm:text-lg text-neutral-300 dark:text-neutral-300">
					Launch your journey through learnings, projects, profiles, and hours.
				</p>
				<div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
					<Link href="/auth/login">
						<Button size="lg" className="bg-indigo-600 hover:bg-indigo-500">Login</Button>
					</Link>
					<Link href="/auth/signup">
						<Button size="lg" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">Create account</Button>
					</Link>
					<Link href="/dashboard">
						<Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">Open dashboard</Button>
					</Link>
				</div>
			</section>
			</FadeIn>

			<section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20">
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
					{features.map((f, i) => (
						<Link key={f.href} href={f.href}>
							<FadeIn delay={i * 50}>
								<Card className="h-full bg-white/5 text-white border-white/10 backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:shadow-lg">
									<CardHeader className="pb-4">
										<div className="flex items-center gap-3">
											<div className="text-indigo-400">{f.icon}</div>
											<CardTitle className="text-lg">{f.title}</CardTitle>
										</div>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-neutral-300">{f.description}</p>
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
