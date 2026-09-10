import { ExplorerItemProps } from './components/ExplorerItem';

export interface ExplorerSidebarProps {
	items: ExplorerItemProps[];
	onItemSelect: (item: ExplorerItemProps) => void;
	selectedItemId?: string;
}
