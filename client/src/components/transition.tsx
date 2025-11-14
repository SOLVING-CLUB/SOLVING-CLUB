
import { useEffect, useState } from "react";

export function FadeIn({ children, delay = 0, offsetY = 8 }: { children: React.ReactNode; delay?: number; offsetY?: number }) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		const t = setTimeout(() => setMounted(true), 10);
		return () => clearTimeout(t);
	}, []);
	return (
		<div
			style={{
				transition: "opacity 250ms ease, transform 250ms ease",
				transitionDelay: `${delay}ms`,
				opacity: mounted ? 1 : 0,
				transform: mounted ? "translateY(0)" : `translateY(${offsetY}px)`,
			}}
		>
			{children}
		</div>
	);
}
