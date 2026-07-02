import { WorkloadClientAPI } from '@ms-fabric/workload-client';

import { FabricPlatformClient, TokenProvider } from './FabricPlatformClient';
import { Lakehouse } from './FabricPlatformTypes';

/**
 * API wrapper for Fabric Platform Lakehouse operations
 * Provides methods for managing lakehouses within workspaces
 * Uses centralized token management
 */
export class LakehouseClient extends FabricPlatformClient {
	constructor(workloadClient: WorkloadClientAPI, tokenProvider: TokenProvider) {
		super(workloadClient, tokenProvider);
	}

	/**
	 * Returns properties of the specified lakehouse
	 * @param workspaceId The workspace ID
	 * @param lakehouseId The lakehouse ID
	 * @returns Promise<Lakehouse>
	 */
	async getLakehouse(workspaceId: string, lakehouseId: string): Promise<Lakehouse> {
		return this.get<Lakehouse>(`/workspaces/${workspaceId}/lakehouses/${lakehouseId}`);
	}
}
