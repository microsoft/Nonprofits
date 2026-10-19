import { PackageItem } from '../PackageInstallerItemModel';

export type DeploymentItemLifecycle = 'pending' | 'in-progress' | 'succeeded' | 'failed';

export interface DeploymentItemStatusEntry {
	packageItem: PackageItem;
	status: DeploymentItemLifecycle;
	errorMessage?: string;
	updatedAt: Date | null;
}

export type DeploymentItemStatusCollection = DeploymentItemStatusEntry[];

export interface DeploymentItemStatusUpdate {
	packageItem: PackageItem;
	status: DeploymentItemLifecycle;
	errorMessage?: string;
	updatedAt?: Date | null;
}

export function createInitialDeploymentStatuses(items: PackageItem[] = []): DeploymentItemStatusCollection {
	return items.map(
		(packageItem): DeploymentItemStatusEntry => ({
			packageItem,
			status: 'pending',
			errorMessage: undefined,
			updatedAt: null,
		}),
	);
}

export function upsertDeploymentItemStatus(
	collection: DeploymentItemStatusCollection,
	update: DeploymentItemStatusUpdate,
): DeploymentItemStatusCollection {
	const nextCollection = collection.map((entry) =>
		entry.packageItem === update.packageItem
			? {
					...entry,
					status: update.status,
					errorMessage: update.errorMessage ?? entry.errorMessage,
					updatedAt: update.updatedAt ?? new Date(),
				}
			: entry,
	);

	const isExisting = collection.some((entry) => entry.packageItem === update.packageItem);
	if (!isExisting) {
		nextCollection.push({
			packageItem: update.packageItem,
			status: update.status,
			errorMessage: update.errorMessage,
			updatedAt: update.updatedAt ?? new Date(),
		});
	}

	return nextCollection;
}
