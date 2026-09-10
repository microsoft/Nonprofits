import type { ResolvedItemEntry } from '../../PostDeploymentSetup.types';

export interface ResolvedItemsCardProps {
	isLoading: boolean;
	entries: ResolvedItemEntry[];
}
