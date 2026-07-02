export interface Prerequisite {
	requirement: string;
	description: string;
}

export interface PrerequisitesSectionProps {
	prerequisites: Prerequisite[];
	ariaLabels?: {
		list?: string;
		requirement?: string;
	};
}
