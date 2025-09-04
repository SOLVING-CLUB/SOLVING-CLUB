"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
	if (!cachedClient) {
		cachedClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
	}
	return cachedClient;
}
