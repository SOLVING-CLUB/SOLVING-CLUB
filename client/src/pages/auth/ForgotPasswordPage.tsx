import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthCard from "@/components/auth/auth-card";
import { toast } from "@/lib/toast";
import { emailSchema, validateForm } from "@/lib/validation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function ForgotPasswordPage() {
	const supabase = getSupabaseClient();
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);
	const [errors, setErrors] = useState<Record<string, string[]>>({});

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setErrors({});
		
		const validation = validateForm(emailSchema, email);
		if (!validation.success) {
			setErrors(validation.errors || {});
			return;
		}

		setLoading(true);
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/auth/update-password`,
			});
			if (error) {
				toast.error("Reset Failed", error.message);
				return;
			}
			toast.success("Reset Link Sent", "Check your email for password reset instructions.");
			setSent(true);
		} catch {
			toast.error("Reset Failed", "An unexpected error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	if (sent) {
		return (
			<AuthCard 
				title="Check your email" 
				description="We've sent password reset instructions to your email address"
			>
				<div className="space-y-4 text-center">
					<div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
						<p className="text-sm text-green-800 dark:text-green-200">
							If an account with that email exists, you&apos;ll receive password reset instructions shortly.
						</p>
					</div>
					<div className="space-y-2">
						<Button asChild className="w-full">
							<Link href="/auth/login">
								<ArrowLeft className="mr-2 h-4 w-4" />
								Back to Login
							</Link>
						</Button>
						<Button 
							variant="outline" 
							onClick={() => setSent(false)}
							className="w-full"
						>
							Try Different Email
						</Button>
					</div>
				</div>
			</AuthCard>
		);
	}

	return (
		<AuthCard 
			title="Forgot password" 
			description="Enter your email address and we'll send you a reset link"
			footer={
				<Link href="/auth/login" className="hover:underline flex items-center gap-2">
					<ArrowLeft className="h-4 w-4" />
					Back to Login
				</Link>
			}
		>
			<form onSubmit={onSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input 
						id="email" 
						type="email" 
						value={email} 
						onChange={(e) => setEmail(e.target.value)} 
						className={errors.email ? "border-red-500" : ""}
						required 
					/>
					{errors.email && (
						<p className="text-sm text-red-600">{errors.email[0]}</p>
					)}
				</div>
				<Button type="submit" disabled={loading} className="w-full">
					{loading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Sending...
						</>
					) : (
						"Send reset link"
					)}
				</Button>
			</form>
		</AuthCard>
	);
}

