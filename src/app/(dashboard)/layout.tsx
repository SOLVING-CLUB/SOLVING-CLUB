import Providers from "@/components/providers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardFrame from "@/components/dashboard-frame";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = await getSupabaseServerClient();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session) {
		redirect("/auth/login");
	}

	return (
		<Providers>
			<DashboardFrame>{children}</DashboardFrame>
		</Providers>
	);
}
