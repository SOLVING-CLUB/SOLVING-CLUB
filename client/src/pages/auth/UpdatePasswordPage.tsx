import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthCard from "@/components/auth/auth-card";
import { toast } from "@/lib/toast";
import { updatePasswordSchema, validateForm, validatePassword } from "@/lib/validation";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Check, X, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function UpdatePasswordPage() {
	const [, setLocation] = useLocation();
	const supabase = getSupabaseClient();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [errors, setErrors] = useState<Record<string, string[]>>({});
	const [isValidSession, setIsValidSession] = useState(false);

	const passwordValidation = validatePassword(password);

	useEffect(() => {
		checkSession();
	}, []);

	async function checkSession() {
		const { data: { session } } = await supabase.auth.getSession();
		if (!session) {
			toast.error("Invalid Session", "Please request a new password reset link.");
			setLocation("/auth/forgot-password");
			return;
		}
		setIsValidSession(true);
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setErrors({});
		
		const validation = validateForm(updatePasswordSchema, { 
			currentPassword: "",
			newPassword: password, 
			confirmPassword 
		});
		if (!validation.success) {
			setErrors(validation.errors || {});
			return;
		}

		setLoading(true);
		try {
			const { error } = await supabase.auth.updateUser({ password });
			if (error) {
				toast.error("Update Failed", error.message);
				return;
			}
			toast.success("Password Updated", "Your password has been successfully updated. Please log in with your new password.");
			setLocation("/auth/login");
		} catch {
			toast.error("Update Failed", "An unexpected error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	if (!isValidSession) {
		return (
			<AuthCard title="Verifying..." description="Please wait while we verify your session">
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-8 w-8 animate-spin" />
				</div>
			</AuthCard>
		);
	}

	return (
		<AuthCard 
			title="Set a new password" 
			description="Choose a strong password for your account"
			footer={
				<Link href="/auth/login" className="hover:underline flex items-center gap-2">
					<ArrowLeft className="h-4 w-4" />
					Back to Login
				</Link>
			}
		>
			<form onSubmit={onSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="password">New Password</Label>
					<div className="relative">
						<Input 
							id="password" 
							type={showPassword ? "text" : "password"} 
							value={password} 
							onChange={(e) => setPassword(e.target.value)} 
							className={errors.newPassword ? "border-red-500 pr-10" : "pr-10"}
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
					{errors.newPassword && (
						<p className="text-sm text-red-600">{errors.newPassword[0]}</p>
					)}
				</div>
				<div className="space-y-2">
					<Label htmlFor="confirmPassword">Confirm New Password</Label>
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
							Saving...
						</>
					) : (
						"Update password"
					)}
				</Button>
			</form>
		</AuthCard>
	);
}

