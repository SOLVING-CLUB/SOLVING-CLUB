import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Clock, BookOpen, FolderKanban, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/transition";
import Starfield from "@/components/starfield";


export const metadata: Metadata = {
	title: "Solving Club — Collaborate, Learn, and Ship",
	description: "A focused workspace for profiles, hours, learnings, and projects — built with Next.js and Supabase.",
};

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
		<div className="relative min-h-screen overflow-hidden bg-black text-white">
			<Starfield />

			<header className="fixed top-0 inset-x-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
					<Link href="/" className="font-semibold tracking-tight">
						<span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-teal-300 bg-clip-text text-transparent">Solving Club</span>
					</Link>
					<nav className="hidden md:flex items-center gap-6 text-sm text-neutral-300">
						<a href="#features" className="hover:text-white">Features</a>
						<a href="#security" className="hover:text-white">Security</a>
					</nav>
					<div className="flex items-center gap-2">
						<Link href="/auth/login" className="hidden sm:block">
							<Button variant="ghost" className="text-white hover:bg-white/10">Log in</Button>
						</Link>
						<Link href="/auth/signup">
							<Button className="bg-indigo-600 hover:bg-indigo-500">Sign up</Button>
						</Link>
					</div>
				</div>
			</header>

			<main>
				<section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">
					<div className="grid lg:grid-cols-2 gap-10 items-center">
						<FadeIn>
							<div>
								<Badge variant="secondary" className="bg-white/10 text-white border-white/20">
									<Sparkles className="h-3.5 w-3.5 mr-1.5" /> Open beta — free to try
								</Badge>
								<h1 className="mt-4 text-4xl sm:text-6xl font-extrabold tracking-tight">
									<span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-teal-300 bg-clip-text text-transparent">Collaborate, learn, and ship</span>
								</h1>
								<p className="mt-6 text-base sm:text-lg text-neutral-300 max-w-xl">
									A focused workspace for individuals and small teams. Profiles, working hours, learnings, and projects — in one place.
								</p>
								<div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
									<Link href="/auth/signup">
										<Button size="lg" className="bg-indigo-600 hover:bg-indigo-500">Get started</Button>
									</Link>
									<Link href="/dashboard">
										<Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">Live demo</Button>
									</Link>
								</div>
								<div className="mt-8 flex items-center gap-6 text-xs text-neutral-400">
									<div className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-400" /> Fast onboarding</div>
									<div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-sky-400" /> Privacy-friendly</div>
								</div>
							</div>
						</FadeIn>

						<FadeIn delay={80}>
							<Image
								src="/window.svg"
								alt="Solving Club workspace"
								width={1200}
								height={1000}
								className="rounded-xl border border-white/10 shadow-2xl shadow-sky-500/10"
							/>
						</FadeIn>
					</div>
					<div className="mt-12">
						<p className="text-xs uppercase tracking-widest text-neutral-400">Trusted stack</p>
						<div className="mt-3 flex items-center gap-6 opacity-80">
							<Image src="/next.svg" alt="Next.js" width={80} height={20} />
							<Image src="/vercel.svg" alt="Vercel" width={80} height={20} />
							<Image src="/globe.svg" alt="Globe" width={80} height={20} />
						</div>
					</div>
				</section>

				<section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
					<h2 className="sr-only">Features</h2>
					<div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
						{features.map((f, i) => (
							<Link key={f.href} href={f.href}>
								<FadeIn delay={i * 60}>
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

				<section id="security" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
					<div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
							<div>
								<h3 className="text-xl font-semibold tracking-tight">Security & privacy by default</h3>
								<p className="mt-2 text-sm text-neutral-300">Built on Supabase Auth & Postgres. Passwords never touch the client except through secure flows. Session cookies are httpOnly.</p>
							</div>
							<div className="flex items-center gap-4 text-sm text-neutral-300">
								<div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-sky-400" /> Auth</div>
								<Separator orientation="vertical" className="h-6 bg-white/20" />
								<div className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-400" /> SSR</div>
							</div>
						</div>
					</div>
				</section>

				<section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
					<div className="rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-sky-600/20 to-teal-600/20 p-8 text-center">
						<h3 className="text-2xl sm:text-3xl font-semibold">Ready to build?</h3>
						<p className="mt-3 text-sm text-neutral-300">Create your account in seconds. No credit card required.</p>
						<div className="mt-6 flex items-center justify-center gap-3">
							<Link href="/auth/signup">
								<Button size="lg" className="bg-indigo-600 hover:bg-indigo-500">Create account</Button>
							</Link>
							<Link href="/auth/login">
								<Button size="lg" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">Log in</Button>
							</Link>
						</div>
					</div>
				</section>
			</main>

			<footer className="border-t border-white/10 bg-black/60">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between text-sm text-neutral-400">
					<p>
						© {new Date().getFullYear()} Solving Club
					</p>
					<div className="flex items-center gap-4">
						<a href="#features" className="hover:text-white">Features</a>
						<a href="#security" className="hover:text-white">Security</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
