"use client";

import * as React from "react";

export function useInView<T extends Element>(options?: IntersectionObserverInit): [React.RefObject<T | null>, boolean] {
	const ref = React.useRef<T | null>(null);
	const [inView, setInView] = React.useState(false);

	React.useEffect(() => {
		if (!ref.current || inView) return;
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setInView(true);
						observer.disconnect();
					}
				});
			},
			{ rootMargin: "100px", threshold: 0.01, ...options }
		);
		observer.observe(ref.current);
		return () => observer.disconnect();
	}, [inView, options]);

	return [ref, inView];
}


