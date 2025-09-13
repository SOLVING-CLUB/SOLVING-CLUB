"use client";

import { Suspense, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, FileText, MessageSquare, Settings, Eye } from "lucide-react";
import Link from "next/link";
import Spinner from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

export type Project = {
	id: string;
	name: string;
	description: string;
	status: "planning" | "active" | "completed" | "on-hold";
	updated_at: string;
	member_count?: number;
	task_count?: number;
};

export function ProjectListSkeleton() {
	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: 6 }).map((_, i) => (
				<Card key={i} className="overflow-hidden">
					<CardHeader className="pb-4">
						<div className="h-5 w-40 bg-muted/50 rounded mb-3 animate-pulse" />
						<div className="h-6 w-24 bg-muted/50 rounded animate-pulse" />
					</CardHeader>
					<CardContent>
						<div className="h-14 bg-muted/40 rounded mb-4 animate-pulse" />
						<div className="h-5 w-full bg-muted/40 rounded animate-pulse" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export default function ProjectList({ projects }: { projects: Project[] }) {
	const router = useRouter();
	const items = useMemo(() => projects, [projects]);
	return (
		<Suspense fallback={<ProjectListSkeleton />}> 
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{items.map((project) => (
					<Card key={project.id} className="hover:shadow-lg transition-shadow duration-200">
						<CardHeader className="pb-4">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<CardTitle className="text-lg mb-2">{project.name}</CardTitle>
									<Badge>
										{project.status.charAt(0).toUpperCase() + project.status.slice(1)}
									</Badge>
								</div>
								<Link href={`/dashboard/projects/${project.id}`} onMouseEnter={() => router.prefetch(`/dashboard/projects/${project.id}`)}>
									<Button variant="outline" size="sm">
										<Eye className="h-4 w-4" />
									</Button>
								</Link>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{project.description && (
								<p className="text-sm text-muted-foreground line-clamp-3">
									{project.description}
								</p>
							)}
							<div className="flex items-center justify-between text-sm text-muted-foreground">
								<div className="flex items-center gap-4">
									<div className="flex items-center gap-1">
										<Users className="h-4 w-4" />
										{project.member_count || 0}
									</div>
									<div className="flex items-center gap-1">
										<FileText className="h-4 w-4" />
										{project.task_count || 0}
									</div>
								</div>
								<div className="flex items-center gap-1">
									<Calendar className="h-4 w-4" />
									{new Date(project.updated_at).toLocaleDateString()}
								</div>
							</div>
							<div className="flex gap-2">
								<Link href={`/dashboard/projects/${project.id}`} className="flex-1" onMouseEnter={() => router.prefetch(`/dashboard/projects/${project.id}`)}>
									<Button variant="outline" size="sm" className="w-full">
										<MessageSquare className="h-4 w-4 mr-2" />
										View Project
									</Button>
								</Link>
								<Link href={`/dashboard/projects/${project.id}/settings`} onMouseEnter={() => router.prefetch(`/dashboard/projects/${project.id}/settings`)}>
									<Button variant="outline" size="sm">
										<Settings className="h-4 w-4" />
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</Suspense>
	);
}


