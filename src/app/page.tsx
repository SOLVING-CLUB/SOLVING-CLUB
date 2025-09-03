import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<div className="min-h-screen flex items-center justify-center p-10">
			<div className="max-w-xl text-center space-y-6">
				<h1 className="text-3xl font-bold">Solving Club</h1>
				<p className="text-muted-foreground">
					Welcome to the Solving Club Dashboard. Sign in to access your profile, hours, learnings, and
					projects.
				</p>
				<div className="flex items-center justify-center gap-3">
					<Link href="/auth/login">
						<Button>Login</Button>
					</Link>
					<Link href="/auth/signup">
						<Button variant="secondary">Create account</Button>
					</Link>
					<Link href="/dashboard">
						<Button variant="outline">Dashboard</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
