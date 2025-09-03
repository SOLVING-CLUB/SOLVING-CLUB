"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/auth/auth-card";
import Link from "next/link";

export default function SignupPage() {
	const supabase = getSupabaseBrowserClient();
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	async function onSignup(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		const { error } = await supabase.auth.signUp({ email, password });
		setLoading(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("Check your email to confirm your account.");
		router.push("/auth/login");
	}

	return (
		<AuthCard
			title="Create your account"
			description="Join Solving Club"
			footer={<Link className="hover:underline" href="/auth/login">Already have an account? Login</Link>}
		>
			<form onSubmit={onSignup} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
				</div>
				<div className="space-y-2">
					<Label htmlFor="password">Password</Label>
					<Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
				</div>
				<Button type="submit" disabled={loading} className="w-full">
					{loading ? "Creating..." : "Create account"}
				</Button>
			</form>
		</AuthCard>
	);
}
