

import React from "react";

type Star = {
	x: number;
	y: number;
	radius: number;
	opacity: number;
	phase: number;
};

type StarfieldProps = {
	className?: string;
};

// GPU-friendly canvas starfield with DPR scaling, resize handling,
// reduced-motion support, and subtle twinkle.
export default function Starfield({ className }: StarfieldProps) {
	const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
	const rafRef = React.useRef<number | null>(null);
	const starsRef = React.useRef<Star[]>([]);

	const drawFrame = React.useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, timeMs: number, motion: boolean) => {
		// Background
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, width, height);

		const time = timeMs / 1000;

		for (const star of starsRef.current) {
			const baseOpacity = star.opacity;
			const twinkle = motion ? 0.35 * Math.sin(time * 0.9 + star.phase) : 0;
			const alpha = Math.max(0, Math.min(1, baseOpacity + twinkle));

			ctx.beginPath();
			ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
			ctx.closePath();
			ctx.fillStyle = `rgba(255,255,255,${alpha})`;
			ctx.fill();
		}
 	}, []);

	React.useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { alpha: false });
		if (!ctx) return;

		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
 
 		function resize() {
 			const c = canvasRef.current;
 			if (!c || !ctx) return;
 			const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
 			const width = Math.floor(c.clientWidth * dpr);
 			const height = Math.floor(c.clientHeight * dpr);
 			c.width = width;
 			c.height = height;
 			ctx.setTransform(1, 0, 0, 1, 0, 0);
 			ctx.scale(dpr, dpr);

 			// Generate stars proportional to area, clamped for perf
 			const area = c.clientWidth * c.clientHeight;
 			const target = Math.round(Math.min(1200, Math.max(200, area / 2500)));
 			const stars: Star[] = [];
 			for (let i = 0; i < target; i++) {
 				stars.push({
 					x: Math.random() * c.clientWidth,
 					y: Math.random() * c.clientHeight,
 					radius: Math.random() < 0.85 ? 0.6 : 1.1,
 					opacity: 0.35 + Math.random() * 0.55,
 					phase: Math.random() * Math.PI * 2,
 				});
 			}
 			starsRef.current = stars;
 		}

 		resize();

 		let lastTime = performance.now();
 		let acc = 0;
 		const targetFps = 30; // cap for battery friendliness
 		const frameInterval = 1000 / targetFps;

 		function loop(now: number) {
 			const delta = now - lastTime;
 			lastTime = now;
 			acc += delta;
 			if (acc >= frameInterval) {
 				const c = canvasRef.current;
 				if (c && ctx) {
 					drawFrame(ctx, c.clientWidth, c.clientHeight, now, !media.matches);
 				}
 				acc = 0;
 			}
 			rafRef.current = requestAnimationFrame(loop);
 		}

 		const initialCanvas = canvasRef.current;
 		if (initialCanvas && ctx) {
 			drawFrame(ctx, initialCanvas.clientWidth, initialCanvas.clientHeight, performance.now(), !media.matches);
 		}
 		rafRef.current = requestAnimationFrame(loop);

 		window.addEventListener("resize", resize);
 		return () => {
 			if (rafRef.current) cancelAnimationFrame(rafRef.current);
 			window.removeEventListener("resize", resize);
 		};
 	}, [drawFrame]);

 	return (
 		<div className={className}>
 			<canvas ref={canvasRef} className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
 		</div>
 	);
}


