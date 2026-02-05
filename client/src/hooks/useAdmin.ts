import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useAdmin() {
	const [loading, setLoading] = useState(true);
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		let isMounted = true;

		async function load() {
			setLoading(true);
			const { data: { session } } = await supabase.auth.getSession();
			const user = session?.user;
			if (!user) {
				if (isMounted) {
					setIsAdmin(false);
					setLoading(false);
				}
				return;
			}

			const { data, error } = await supabase
				.from("profiles")
				.select("is_admin")
				.eq("id", user.id)
				.maybeSingle();

			if (isMounted) {
				if (error) {
					console.warn("Failed to load admin flag:", error);
					setIsAdmin(false);
				} else {
					setIsAdmin(Boolean(data?.is_admin));
				}
				setLoading(false);
			}
		}

		load();

		const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
			load();
		});

		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, []);

	return { isAdmin, loading };
}
