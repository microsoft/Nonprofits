export interface DocumentationLink {
	title: string;
	url: string;
}

export interface DocumentationSectionProps {
	links: DocumentationLink[];
	labels?: {
		sectionTitle?: string;
		openInNewTabLabel?: string;
	};
}
