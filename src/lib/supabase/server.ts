import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

export async function getSupabaseServerClient(): Promise<SupabaseClient> {
	const cookieStore = await cookies();

	return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		cookies: {
			get(name: string) {
				return cookieStore.get(name)?.value;
			},
			set(name: string, value: string, options: Record<string, unknown>) {
				cookieStore.set({ name, value, ...options });
			},
			remove(name: string, options: Record<string, unknown>) {
				cookieStore.set({ name, value: "", ...options, expires: new Date(0) });
			},
		},
	});
}
