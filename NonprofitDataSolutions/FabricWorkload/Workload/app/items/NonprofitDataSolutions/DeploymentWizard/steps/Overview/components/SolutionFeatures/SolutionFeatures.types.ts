export interface Feature {
	icon: React.ComponentType;
	title: string;
	description: string;
}

export interface SolutionFeaturesProps {
	features: Feature[];
	ariaLabel?: string;
}
