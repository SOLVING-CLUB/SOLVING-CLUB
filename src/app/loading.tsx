export default function Loading() {
	return (
		<div className="min-h-[60vh] w-full flex items-center justify-center">
			<div className="flex items-center gap-3 text-muted-foreground">
				<span className="inline-block h-5 w-5 rounded-full border-2 border-muted-foreground/40 border-t-muted-foreground animate-spin" />
				<span>Loading…</span>
			</div>
		</div>
	);
}


