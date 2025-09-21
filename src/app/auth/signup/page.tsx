"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { signupSchema, validateForm, validatePassword } from "@/lib/validation";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/auth/auth-card";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";

export default function SignupPage() {
	const supabase = getSupabaseBrowserClient();
	const router = useRouter();
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
		
		// Validate form data
		const validation = validateForm(signupSchema, { email, password, confirmPassword, fullName });
		if (!validation.success) {
			setErrors(validation.errors || {});
			return;
		}

		setLoading(true);
		try {
			// Sign up the user
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
				toast.error("Signup Failed", authError.message);
				return;
			}

			// If user was created successfully, create their profile
			if (authData.user) {
				const { error: profileError } = await supabase
					.from("profiles")
					.insert({
						id: authData.user.id,
						full_name: fullName,
						email: email
					});

				if (profileError) {
					console.error("Error creating profile:", profileError);
					// Don't fail the signup if profile creation fails
					toast.warning("Profile Creation Failed", "Account created but profile setup incomplete. You can complete it later.");
				} else {
					console.log("Profile created successfully for user:", authData.user.id);
				}
			}

			toast.success("Account Created!", "Please check your email to confirm your account.");
			router.push("/auth/login");
		} catch (error) {
			console.error("Signup error:", error);
			toast.error("Signup Failed", "An unexpected error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthCard
			title="Create your account"
			description="Join Solving Club"
			footer={<Link className="hover:underline" href="/auth/login">Already have an account? Login</Link>}
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
			</form>
		</AuthCard>
	);
}
