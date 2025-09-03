import Sidebar from "@/components/sidebar";
import Providers from "@/components/providers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = getSupabaseServerClient();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session) {
		redirect("/auth/login");
	}

	return (
		<div className="min-h-screen grid grid-cols-[240px_1fr]">
			<Sidebar />
			<Providers>
				<main className="p-6">{children}</main>
			</Providers>
		</div>
	);
}
