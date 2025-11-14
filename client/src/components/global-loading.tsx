

import * as React from "react";
import LoadingOverlay from "@/components/loading-overlay";
import { useLocation } from "wouter";

type GlobalLoadingContextValue = {
	show: (label?: string) => void;
	hide: () => void;
	setLabel: (label: string) => void;
};

const GlobalLoadingContext = React.createContext<GlobalLoadingContextValue | undefined>(undefined);

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
	const [pendingCount, setPendingCount] = React.useState(0);
	const [label, setLabel] = React.useState<string>("Loading");
	const pathname = useLocation();

	const show = React.useCallback((nextLabel?: string) => {
		if (nextLabel) setLabel(nextLabel);
		setPendingCount((c) => c + 1);
	}, []);

	const hide = React.useCallback(() => {
		setPendingCount((c) => Math.max(0, c - 1));
	}, []);

	// Auto-hide shortly after route change if nothing else is loading
	React.useEffect(() => {
		if (pendingCount === 0) return;
		const t = setTimeout(() => setPendingCount(0), 1200);
		return () => clearTimeout(t);
		// only on route changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname]);

	const value = React.useMemo<GlobalLoadingContextValue>(() => ({ show, hide, setLabel }), [show, hide]);

	return (
		<GlobalLoadingContext.Provider value={value}>
			{children}
			<LoadingOverlay visible={pendingCount > 0} label={label} />
		</GlobalLoadingContext.Provider>
	);
}

export function useGlobalLoading() {
	const ctx = React.useContext(GlobalLoadingContext);
	if (!ctx) throw new Error("useGlobalLoading must be used within GlobalLoadingProvider");
	return ctx;
}


