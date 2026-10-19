import { Home20Regular, TrayItemAdd20Regular } from '@fluentui/react-icons';

import { PageId } from '../../ItemLanding.model';
import { ExplorerItemProps } from './components/ExplorerSidebar/components/ExplorerItem';

export const explorerLabels = {
	explorerInterface: 'Explorer interface',
	mainContentArea: 'Main content area',
};

export const explorerItems: ExplorerItemProps[] = [
	{
		id: PageId.Overview,
		label: 'Overview',
		icon: Home20Regular,
		description: 'General overview and dashboard',
	},
	{
		id: PageId.Deployments,
		label: 'Deployments',
		icon: TrayItemAdd20Regular,
		description: 'Manage and view deployments',
	},
];
