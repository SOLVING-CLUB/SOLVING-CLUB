"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthCard from "@/components/auth/auth-card";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
	const supabase = getSupabaseBrowserClient();
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${window.location.origin}/auth/update-password`,
		});
		setLoading(false);
		if (error) return toast.error(error.message);
		toast.success("Password reset link sent. Check your email.");
	}

	return (
		<AuthCard title="Forgot password" description="We'll send you a reset link">
			<form onSubmit={onSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
				</div>
				<Button type="submit" disabled={loading} className="w-full">
					{loading ? "Sending..." : "Send reset link"}
				</Button>
			</form>
		</AuthCard>
	);
}
