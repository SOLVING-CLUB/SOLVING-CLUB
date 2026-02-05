import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PermissionKey } from "@/lib/access/permissions";

type PermissionState = {
	loading: boolean;
	permissions: Set<PermissionKey>;
	has: (permission: PermissionKey) => boolean;
};

export function usePermissions(projectId?: string | null): PermissionState {
	const [loading, setLoading] = useState(true);
	const [permissions, setPermissions] = useState<Set<PermissionKey>>(new Set());

	useEffect(() => {
		let isMounted = true;

		async function load() {
			setLoading(true);
			const { data: { session } } = await supabase.auth.getSession();
			if (!session?.user) {
				if (isMounted) {
					setPermissions(new Set());
					setLoading(false);
				}
				return;
			}

			const { data, error } = await supabase.rpc("access_effective_permissions", {
				project_id: projectId ?? null,
			});

			if (!isMounted) return;

			if (error) {
				console.warn("Failed to load permissions:", error);
				setPermissions(new Set());
			} else {
				const keys = (data ?? []).map((row: { permission_key: PermissionKey }) => row.permission_key);
				setPermissions(new Set(keys));
			}
			setLoading(false);
		}

		load();

		const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
			load();
		});

		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, [projectId]);

	return {
		loading,
		permissions,
		has: (permission) => permissions.has(permission),
	};
}
