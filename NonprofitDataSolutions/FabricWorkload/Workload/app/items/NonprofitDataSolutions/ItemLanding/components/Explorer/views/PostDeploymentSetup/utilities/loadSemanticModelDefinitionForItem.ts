import { WorkloadClientAPI } from '@ms-fabric/workload-client';

import { FabricPlatformAPIClient } from '@src/clients/FabricPlatformAPIClient';

import { getItemDefinitionViaOperation } from './getItemDefinitionViaOperation';
import { loadSemanticModelDefinition } from './loadSemanticModelDefinition';

export const loadSemanticModelDefinitionForItem = (
	fabricClient: FabricPlatformAPIClient,
	workloadClient: WorkloadClientAPI,
	workspaceId: string,
	itemId: string,
) => {
	return loadSemanticModelDefinition(
		() => fabricClient.items.getItemDefinition(workspaceId, itemId),
		() =>
			workloadClient.itemCrudPublic.getItemDefinition({
				itemId,
			}),
		() => fabricClient.artifacts.getArtifactDefinition(workspaceId, itemId),
		() =>
			getItemDefinitionViaOperation(
				workspaceId,
				itemId,
				(endpoint) => fabricClient.items.postOperationWithResponse(endpoint),
				(url) => fabricClient.items.getOperationWithResponse(url),
			),
	);
};
