import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

export async function middleware(request: NextRequest) {
	let response = NextResponse.next({ request: { headers: request.headers } });

	const supabaseUrl = SUPABASE_URL;
	const supabaseAnon = SUPABASE_ANON_KEY;

	// If env vars are missing in local/dev, skip Supabase to avoid runtime error
	if (supabaseUrl && supabaseAnon) {
		const supabase = createServerClient(supabaseUrl, supabaseAnon, {
			cookies: {
				get(name: string) {
					return request.cookies.get(name)?.value;
				},
				set(name: string, value: string, _options: Record<string, unknown>) {
					// RequestCookies.set requires (name, value)
					request.cookies.set(name, value);
					response = NextResponse.next({ request: { headers: request.headers } });
					// Response cookies support options
					response.cookies.set({ name, value });
				},
				remove(name: string, _options: Record<string, unknown>) {
					request.cookies.set(name, "");
					response = NextResponse.next({ request: { headers: request.headers } });
					response.cookies.set({ name, value: "", expires: new Date(0) });
				},
			},
		});

		await supabase.auth.getUser();
	}
	return response;
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|auth).*)"],
};
