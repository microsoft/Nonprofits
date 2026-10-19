export interface ShimmerProps {
	/** CSS width (e.g. '80%', '16px'). */
	width: string;
	/** CSS height (e.g. '12px'). */
	height: string;
	/** Render as a circle / pill instead of a rectangle. */
	round?: boolean;
	/** Optional extra className. */
	className?: string;
}
