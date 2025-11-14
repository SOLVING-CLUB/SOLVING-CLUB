import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
	if (!cachedClient) {
		cachedClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
	}
	return cachedClient;
}

