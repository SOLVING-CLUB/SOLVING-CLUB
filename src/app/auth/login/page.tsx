"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AuthCard from "@/components/auth/auth-card";
import Link from "next/link";

export default function LoginPage() {
	const router = useRouter();
	const supabase = getSupabaseBrowserClient();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	async function onLogin(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		setLoading(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		router.replace("/dashboard/profile");
	}

	return (
		<AuthCard
			title="Welcome back"
			description="Sign in to your Solving Club account"
			footer={
				<div className="flex items-center justify-between">
					<Link className="hover:underline" href="/auth/signup">Create account</Link>
					<Link className="hover:underline" href="/auth/forgot-password">Forgot password?</Link>
				</div>
			}
		>
			<form onSubmit={onLogin} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
				</div>
				<div className="space-y-2">
					<Label htmlFor="password">Password</Label>
					<Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
				</div>
				<div>
					<Button type="submit" disabled={loading}>
						{loading ? "Logging in..." : "Login"}
					</Button>
				</div>
			</form>
		</AuthCard>
	);
}
