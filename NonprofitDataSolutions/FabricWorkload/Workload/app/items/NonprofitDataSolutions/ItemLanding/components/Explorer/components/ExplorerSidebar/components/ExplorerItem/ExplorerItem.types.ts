export interface ExplorerItemProps {
	id: string;
	label: string;
	icon: React.ComponentType<any>;
	content?: React.ComponentType<any>;
	description?: string;

	onItemSelect?: (item: ExplorerItemProps) => void;
	isSelected?: boolean;
}
