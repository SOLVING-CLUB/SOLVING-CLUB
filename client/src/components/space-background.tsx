export {};

function StarLayer({ className }: { className?: string }) {
	return (
		<div
			className={className}
			style={{
				backgroundImage:
					"radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,.7) 0, transparent 1px)," +
					"radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,.65) 0, transparent 1px)," +
					"radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,.55) 0, transparent 1px)," +
					"radial-gradient(1px 1px at 90% 20%, rgba(255,255,255,.8) 0, transparent 1px)",
				backgroundSize: "3px 3px, 2px 2px, 2px 2px, 2px 2px",
				animation: "pulse 3s ease-in-out infinite",
				opacity: 0.35,
			}}
		/>
	);
}

export default function SpaceBackground() {
	return (
		<div className="pointer-events-none absolute inset-0 -z-10">
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_130%,rgba(67,56,202,.35)_0%,rgba(2,6,23,1)_45%,rgba(0,0,0,1)_100%)]" />
			<StarLayer className="absolute inset-0" />
		</div>
	);
}
