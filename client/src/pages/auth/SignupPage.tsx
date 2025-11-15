import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { signupSchema, validateForm, validatePassword } from "@/lib/validation";
import { useLocation } from "wouter";
import AuthCard from "@/components/auth/auth-card";
import { Link } from "wouter";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { initiateGoogleAuth } from "@/lib/api/google-oauth";

export default function SignupPage() {
	const [, setLocation] = useLocation();
	const supabase = getSupabaseClient();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [fullName, setFullName] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [errors, setErrors] = useState<Record<string, string[]>>({});

	const passwordValidation = validatePassword(password);

	async function onSignup(e: React.FormEvent) {
		e.preventDefault();
		setErrors({});
		
		const validation = validateForm(signupSchema, { email, password, confirmPassword, fullName });
		if (!validation.success) {
			setErrors(validation.errors || {});
			return;
		}

		setLoading(true);
		try {
			const { data: authData, error: authError } = await supabase.auth.signUp({ 
				email, 
				password,
				options: {
					data: {
						full_name: fullName
					}
				}
			});
			
			if (authError) {
				toast.error("Signup Failed", authError.message || "An error occurred during signup. Please try again.");
				return;
			}

			if (authData.user) {
				const { error: profileError } = await supabase
					.from("profiles")
					.upsert({
						id: authData.user.id,
						full_name: fullName,
						email: email
					}, {
						onConflict: 'id'
					});

				if (profileError) {
					toast.warning("Profile Setup Incomplete", "Your account was created, but profile setup failed. You can complete it later.");
				}
			}

			toast.success("Account Created!", "Please check your email to confirm your account.");
			setLocation("/auth/login");
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
			toast.error("Signup Failed", errorMessage);
		} finally {
			setLoading(false);
		}
	}

	async function onGoogleSignup() {
		setLoading(true);
		try {
			await initiateGoogleAuth();
			// User will be redirected by Supabase OAuth flow
			// Supabase will automatically create account if it doesn't exist
		} catch (error) {
			toast.error("Google Sign Up Failed", error instanceof Error ? error.message : "Failed to sign up with Google. Please try again.");
			setLoading(false);
		}
	}

	return (
		<AuthCard
			title="Create your account"
			description="Join Solving Club"
			footer={<Link href="/auth/login" className="hover:underline">Already have an account? Login</Link>}
		>
			<form onSubmit={onSignup} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="fullName">Full Name</Label>
					<Input 
						id="fullName" 
						type="text" 
						value={fullName} 
						onChange={(e) => setFullName(e.target.value)} 
						className={errors.fullName ? "border-red-500" : ""}
						placeholder="Enter your full name"
						required 
					/>
					{errors.fullName && (
						<p className="text-sm text-red-600">{errors.fullName[0]}</p>
					)}
				</div>
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input 
						id="email" 
						type="email" 
						value={email} 
						onChange={(e) => setEmail(e.target.value)} 
						className={errors.email ? "border-red-500" : ""}
						placeholder="Enter your email"
						required 
					/>
					{errors.email && (
						<p className="text-sm text-red-600">{errors.email[0]}</p>
					)}
				</div>
				<div className="space-y-2">
					<Label htmlFor="password">Password</Label>
					<div className="relative">
						<Input 
							id="password" 
							type={showPassword ? "text" : "password"} 
							value={password} 
							onChange={(e) => setPassword(e.target.value)} 
							className={errors.password ? "border-red-500 pr-10" : "pr-10"}
							required 
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
						>
							{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>
					{password && (
						<div className="space-y-2">
							<div className="text-sm text-gray-600">Password requirements:</div>
							<div className="space-y-1">
								{passwordValidation.errors.map((error, index) => (
									<div key={index} className="flex items-center gap-2 text-sm">
										<X className="h-3 w-3 text-red-500" />
										<span className="text-red-600">{error}</span>
									</div>
								))}
								{passwordValidation.isValid && (
									<div className="flex items-center gap-2 text-sm">
										<Check className="h-3 w-3 text-green-500" />
										<span className="text-green-600">Password meets all requirements</span>
									</div>
								)}
							</div>
						</div>
					)}
					{errors.password && (
						<p className="text-sm text-red-600">{errors.password[0]}</p>
					)}
				</div>
				<div className="space-y-2">
					<Label htmlFor="confirmPassword">Confirm Password</Label>
					<div className="relative">
						<Input 
							id="confirmPassword" 
							type={showConfirmPassword ? "text" : "password"} 
							value={confirmPassword} 
							onChange={(e) => setConfirmPassword(e.target.value)} 
							className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
							required 
						/>
						<button
							type="button"
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
						>
							{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>
					{confirmPassword && password !== confirmPassword && (
						<p className="text-sm text-red-600">Passwords don&apos;t match</p>
					)}
					{errors.confirmPassword && (
						<p className="text-sm text-red-600">{errors.confirmPassword[0]}</p>
					)}
				</div>
				<Button type="submit" disabled={loading || !passwordValidation.isValid} className="w-full">
					{loading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Creating...
						</>
					) : (
						"Create account"
					)}
				</Button>

				<div className="relative my-4">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">Or continue with</span>
					</div>
				</div>

				<Button
					type="button"
					variant="outline"
					onClick={onGoogleSignup}
					disabled={loading}
					className="w-full"
				>
					<svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
						<path
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							fill="#4285F4"
						/>
						<path
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							fill="#34A853"
						/>
						<path
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							fill="#FBBC05"
						/>
						<path
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							fill="#EA4335"
						/>
					</svg>
					Sign up with Google
				</Button>
			</form>
		</AuthCard>
	);
}
