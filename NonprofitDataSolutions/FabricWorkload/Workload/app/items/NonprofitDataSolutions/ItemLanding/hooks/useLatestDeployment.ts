import { useMemo } from 'react';

import { FundraisingItem } from '@src/hooks/useWorkloadItem';

import { DeploymentStatus, PackageDeployment } from '@originalInstaller/PackageInstallerItemModel';

export type FundraisingDeploymentInfo = PackageDeployment & {
	deployedBy: string;
	deployedOn: string;
	status: DeploymentStatus;
};

/**
 * Maps PackageDeployment to DeploymentInfo interface
 */
const mapDeploymentToInfo = (
	deployment: PackageDeployment,
	workloadItem?: FundraisingItem | null,
): FundraisingDeploymentInfo => {
	// Format date to string - handles ISO string format
	const formatDate = (date: string | undefined): string => {
		if (!date) return 'Unknown';

		// Convert ISO string to Date object
		const dateObj = new Date(date);

		// Check if the date is valid
		if (isNaN(dateObj.getTime())) return 'Unknown';

		return dateObj.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		});
	};
	return {
		...deployment,
		deployedBy: workloadItem?.modifiedBy || 'Unknown',
		deployedOn: formatDate(deployment.triggeredTime as unknown as string),
		status: deployment.status,
	};
};

/**
 * Hook to find the latest deployment from a workload item
 * @param workloadItem - The workload item containing deployments
 * @returns The latest deployment or null if no deployments exist
 */
export const useLatestDeployment = (workloadItem: FundraisingItem | null): FundraisingDeploymentInfo | null => {
	return useMemo(() => {
		// Return null if no item or no definition
		if (!workloadItem?.definition?.deployments) {
			return null;
		}

		const deployments = workloadItem.definition.deployments;

		// Return null if deployments array is empty
		if (deployments.length === 0) {
			return null;
		}

		// Sort deployments by triggeredTime (most recent first)
		// Handle cases where triggeredTime might be undefined
		const sortedDeployments = [...deployments].sort((a, b) => {
			const timeA = a.triggeredTime ? new Date(a.triggeredTime).getTime() : 0;
			const timeB = b.triggeredTime ? new Date(b.triggeredTime).getTime() : 0;

			// If both have no time, maintain original order
			if (timeA === 0 && timeB === 0) {
				return 0;
			}

			// Items with time come before items without time
			if (timeA === 0) return 1;
			if (timeB === 0) return -1;

			// Sort by time descending (newest first)
			return timeB - timeA;
		});

		const mappedDeployment = mapDeploymentToInfo(sortedDeployments[0], workloadItem);
		return mappedDeployment;
	}, [workloadItem]);
};
