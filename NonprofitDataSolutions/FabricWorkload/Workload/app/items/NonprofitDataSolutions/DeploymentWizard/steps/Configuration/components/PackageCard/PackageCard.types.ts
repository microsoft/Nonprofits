export interface PackageCardProps {
	id: string;
	name: string;
	description: string;
	items: string[];
	isSelected: boolean;
	isRequired?: boolean;
	onClick?: () => void;
	onToggle?: (packageId: string, isSelected: boolean) => void;
}
