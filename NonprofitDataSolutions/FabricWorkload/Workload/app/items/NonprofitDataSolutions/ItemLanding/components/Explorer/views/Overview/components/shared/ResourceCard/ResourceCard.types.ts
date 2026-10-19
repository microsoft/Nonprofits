export interface ResourceCardData {
	id: string;
	title: string;
	description: string;
	imagePath: string;
	link: string;
}

export interface ResourceCardProps {
	data: ResourceCardData;
}
