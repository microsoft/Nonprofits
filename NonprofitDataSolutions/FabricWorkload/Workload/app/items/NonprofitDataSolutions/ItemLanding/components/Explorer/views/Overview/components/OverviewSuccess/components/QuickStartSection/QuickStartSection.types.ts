import { DeployedItem } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

export interface QuickStartData {
	title: string;
	buttonText: string;
}

export interface QuickStartStepData {
	id: string;
	number: string;
	title: string;
	buttonText: string;
	item?: DeployedItem;
	onClick?: () => void;
}

export interface QuickStartSectionProps {
	data: QuickStartData;
	stepsData: QuickStartStepData[];
}
