"use client";
import { createBrowserClient, SupabaseClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
	if (!cachedClient) {
		cachedClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
	}
	return cachedClient;
}
