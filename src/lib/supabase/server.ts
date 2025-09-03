import { cookies } from "next/headers";
import { createServerClient, SupabaseClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

export async function getSupabaseServerClient(): Promise<SupabaseClient> {
	const cookieStore = await cookies();

	return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		cookies: {
			get(name: string) {
				return cookieStore.get(name)?.value;
			},
			set(name: string, value: string, options: any) {
				cookieStore.set({ name, value, ...options });
			},
			remove(name: string, options: any) {
				cookieStore.set({ name, value: "", ...options, expires: new Date(0) });
			},
		},
	});
}
