"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { loginSchema, validateForm } from "@/lib/validation";
import AuthCard from "@/components/auth/auth-card";
import { MobileForm, MobileFormField, MobileInput, MobileFormActions } from "@/components/mobile-form";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
	const router = useRouter();
	const supabase = getSupabaseBrowserClient();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [errors, setErrors] = useState<Record<string, string[]>>({});

	async function onLogin(e: React.FormEvent) {
		e.preventDefault();
		setErrors({});
		
		// Validate form data
		const validation = validateForm(loginSchema, { email, password });
		if (!validation.success) {
			setErrors(validation.errors || {});
			return;
		}

		setLoading(true);
		try {
			const { error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) {
				toast.error("Login Failed", error.message);
				return;
			}
			toast.success("Welcome back!", "You've been successfully logged in.");
			router.replace("/dashboard");
	} catch {
		toast.error("Login Failed", "An unexpected error occurred. Please try again.");
	} finally {
			setLoading(false);
		}
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
			<MobileForm onSubmit={onLogin}>
				<MobileFormField
					label="Email"
					error={errors.email?.[0]}
					required
				>
					<MobileInput
						type="email"
						placeholder="Enter your email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={loading}
						error={!!errors.email}
					/>
				</MobileFormField>

				<MobileFormField
					label="Password"
					error={errors.password?.[0]}
					required
				>
					<div className="relative">
						<MobileInput
							type={showPassword ? "text" : "password"}
							placeholder="Enter your password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={loading}
							error={!!errors.password}
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
						>
							{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>
				</MobileFormField>

				<MobileFormActions>
					<Button type="submit" disabled={loading} className="w-full">
						{loading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Logging in...
							</>
						) : (
							"Login"
						)}
					</Button>
				</MobileFormActions>
			</MobileForm>
		</AuthCard>
	);
}
