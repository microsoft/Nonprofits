import React from 'react';

import { DeploymentItemStatus, DeployedItem } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

import { useWorkspaceItemsIndex } from './useWorkspaceItemsIndex';

type LinkTarget = { workspaceId: string; itemId: string };

type Options = {
	/**
	 * When false, moved-item resolution is disabled and links keep pointing to the original workspace/item IDs.
	 * This is useful when you want a deliberate post-deployment setup step before remapping references.
	 */
	enableResolution?: boolean;
};

/**
 * Helpers for dealing with deployments after a Fabric Deployment Pipeline move/copy.
 *
 * When an installer item and its deployment history are moved to another workspace, historical `workspaceId/itemId`
 * values can point back to the original (dev) workspace. This hook provides:
 * - resolving a deployed item by `type + displayName` in the current workspace
 * - computing a safe link target (or null) for UI links
	 * - checking whether a deployed item belongs to a different workspace than the current workspace
 */
export const useResolveMovedDeployedItem = (currentWorkspaceId?: string, options?: Options) => {
	const { resolveItem } = useWorkspaceItemsIndex(currentWorkspaceId);
	const enableResolution = options?.enableResolution !== false;

	const isDeployedItemInOtherWorkspace = React.useCallback(
		(item?: Pick<DeployedItem, 'workspaceId'>): boolean => {
			return !!item && !!currentWorkspaceId && item.workspaceId !== currentWorkspaceId;
		},
		[currentWorkspaceId],
	);

	const resolveDeployedItem = React.useCallback(
		(item?: DeployedItem): DeployedItem | undefined => {
			if (!item || !currentWorkspaceId) {
				return item;
			}

			if (!enableResolution) {
				return item;
			}

			if (!isDeployedItemInOtherWorkspace(item)) {
				return item;
			}

			const resolved = resolveItem(item.type, item.displayName);
			return resolved
				? {
						...item,
						id: resolved.id,
						workspaceId: resolved.workspaceId,
						description: resolved.description,
					}
				: undefined;
		},
		[currentWorkspaceId, enableResolution, isDeployedItemInOtherWorkspace, resolveItem],
	);

	const getLinkTarget = React.useCallback(
		(item: DeployedItem): LinkTarget | null => {
			if (item.deploymentStatus !== DeploymentItemStatus.Succeeded) {
				return null;
			}

			if (!currentWorkspaceId) {
				return null;
			}

			if (!isDeployedItemInOtherWorkspace(item)) {
				return { workspaceId: item.workspaceId, itemId: item.id };
			}

			if (!enableResolution) {
				return { workspaceId: item.workspaceId, itemId: item.id };
			}

			const resolved = resolveItem(item.type, item.displayName);
			return resolved ? { workspaceId: currentWorkspaceId, itemId: resolved.id } : null;
		},
		[currentWorkspaceId, enableResolution, isDeployedItemInOtherWorkspace, resolveItem],
	);

	const isMovedAndUnresolved = React.useCallback(
		(originalItem?: DeployedItem, resolvedItem?: DeployedItem): boolean => {
			return isDeployedItemInOtherWorkspace(originalItem) && !resolvedItem;
		},
		[isDeployedItemInOtherWorkspace],
	);

	return {
		resolveDeployedItem,
		getLinkTarget,
		isMoved: isDeployedItemInOtherWorkspace,
		isMovedAndUnresolved,
	};
};
