import { WorkloadClientAPI } from '@ms-fabric/workload-client';

import { FabricPlatformClient, TokenProvider } from './FabricPlatformClient';
import {
	CreateItemRequest,
	Item,
	ItemDefinitionResponse,
	PaginatedResponse,
	UpdateItemDefinitionRequest,
	UpdateItemRequest,
} from './FabricPlatformTypes';

/**
 * API wrapper for Fabric Platform Item operations
 * Provides methods for managing items (reports, datasets, notebooks, etc.)
 * Uses centralized token management
 */
export class ItemClient extends FabricPlatformClient {
	constructor(workloadClient: WorkloadClientAPI, tokenProvider: TokenProvider) {
		super(workloadClient, tokenProvider);
	}

	// ============================
	// Item Management
	// ============================

	/**
	 * Returns a list of items from the specified workspace
	 * @param workspaceId The workspace ID
	 * @param continuationToken Token for pagination
	 * @returns Promise<PaginatedResponse<Item>>
	 */
	async listItems(workspaceId: string, continuationToken?: string): Promise<PaginatedResponse<Item>> {
		let endpoint = `/workspaces/${workspaceId}/items`;
		if (continuationToken) {
			endpoint += `?continuationToken=${encodeURIComponent(continuationToken)}`;
		}
		return this.get<PaginatedResponse<Item>>(endpoint);
	}

	/**
	 * Gets all items from the specified workspace (handles pagination automatically)
	 * @param workspaceId The workspace ID
	 * @returns Promise<Item[]>
	 */
	async getAllItems(workspaceId: string): Promise<Item[]> {
		return this.getAllPages<Item>(`/workspaces/${workspaceId}/items`);
	}

	/**
	 * Creates a new item in the specified workspace
	 * @param workspaceId The workspace ID
	 * @param request CreateItemRequest
	 * @returns Promise<Item>
	 */
	async createItem(workspaceId: string, request: CreateItemRequest): Promise<Item> {
		return this.post<Item>(`/workspaces/${workspaceId}/items`, request);
	}

	/**
	 * Creates a new item and returns full HTTP response metadata (status, headers, raw body)
	 * Useful to detect async 202 Accepted responses and operation headers.
	 */
	async createItemWithResponse(
		workspaceId: string,
		request: CreateItemRequest,
	): Promise<{
		status: number;
		statusText: string;
		headers: Record<string, string | null>;
		rawBody?: string;
		body?: any;
		requestBody?: string;
	}> {
		return this.postWithResponse(`/workspaces/${workspaceId}/items`, request);
	}

	/**
	 * Public wrapper to poll arbitrary operation endpoints (GET) and return full response metadata.
	 * Useful because `getWithResponse` is protected on the base client.
	 */
	async getOperationWithResponse(operationUrl: string): Promise<{
		status: number;
		statusText: string;
		headers: Record<string, string | null>;
		rawBody?: string;
		body?: any;
	}> {
		return this.getWithResponse(operationUrl);
	}

	/**
	 * Public wrapper for arbitrary POST endpoints that need full response metadata.
	 * Useful for LRO-style APIs where callers need response headers.
	 */
	async postOperationWithResponse(endpoint: string, data?: any): Promise<{
		status: number;
		statusText: string;
		headers: Record<string, string | null>;
		rawBody?: string;
		body?: any;
		requestBody?: string;
	}> {
		return this.postWithResponse(endpoint, data);
	}

	/**
	 * Returns properties of the specified item
	 * @param workspaceId The workspace ID
	 * @param itemId The item ID
	 * @returns Promise<Item>
	 */
	async getItem(workspaceId: string, itemId: string): Promise<Item> {
		return this.get<Item>(`/workspaces/${workspaceId}/items/${itemId}`);
	}

	/**
	 * Updates the properties of the specified item
	 * @param workspaceId The workspace ID
	 * @param itemId The item ID
	 * @param request UpdateItemRequest
	 * @returns Promise<Item>
	 */
	async updateItem(workspaceId: string, itemId: string, request: UpdateItemRequest): Promise<Item> {
		return this.patch<Item>(`/workspaces/${workspaceId}/items/${itemId}`, request);
	}

	/**
	 * Deletes the specified item
	 * @param workspaceId The workspace ID
	 * @param itemId The item ID
	 * @returns Promise<void>
	 */
	async deleteItem(workspaceId: string, itemId: string): Promise<void> {
		await this.delete<void>(`/workspaces/${workspaceId}/items/${itemId}`);
	}

	// ============================
	// Item Definition Management
	// ============================

	/**
	 * Returns the definition of the specified item
	 * @param workspaceId The workspace ID
	 * @param itemId The item ID
	 * @param format Optional format parameter
	 * @returns Promise<ItemDefinitionResponse>
	 */
	async getItemDefinition(workspaceId: string, itemId: string, format?: string): Promise<ItemDefinitionResponse> {
		let endpoint = `/workspaces/${workspaceId}/items/${itemId}/getDefinition`;
		if (format) {
			endpoint += `?format=${encodeURIComponent(format)}`;
		}
		return this.post<ItemDefinitionResponse>(endpoint);
	}

	/**
	 * Updates the definition of the specified item
	 * @param workspaceId The workspace ID
	 * @param itemId The item ID
	 * @param request UpdateItemDefinitionRequest
	 * @returns Promise<void>
	 */
	async updateItemDefinition(
		workspaceId: string,
		itemId: string,
		request: UpdateItemDefinitionRequest,
	): Promise<void> {
		await this.post<void>(`/workspaces/${workspaceId}/items/${itemId}/updateDefinition`, request);
	}

	// ============================
	// Item Connections
	// ============================

	/**
	 * Returns a list of connections used by the specified item
	 * @param workspaceId The workspace ID
	 * @param itemId The item ID
	 * @param continuationToken Token for pagination
	 * @returns Promise<any> - Note: Return type depends on connections.json definitions
	 */
	async listItemConnections(workspaceId: string, itemId: string, continuationToken?: string): Promise<any> {
		let endpoint = `/workspaces/${workspaceId}/items/${itemId}/connections`;
		if (continuationToken) {
			endpoint += `?continuationToken=${encodeURIComponent(continuationToken)}`;
		}
		return this.get<any>(endpoint);
	}

	// ============================
	// Helper Methods
	// ============================

	/**
	 * Gets items by type from the specified workspace
	 * @param workspaceId The workspace ID
	 * @param itemType The item type to filter by
	 * @returns Promise<Item[]>
	 */
	async getItemsByType(workspaceId: string, itemType: string): Promise<Item[]> {
		const allItems = await this.getAllItems(workspaceId);
		return allItems.filter((item) => item.type === itemType);
	}

	/**
	 * Gets items in a specific folder
	 * @param workspaceId The workspace ID
	 * @param folderId The folder ID
	 * @returns Promise<Item[]>
	 */
	async getItemsInFolder(workspaceId: string, folderId: string): Promise<Item[]> {
		const allItems = await this.getAllItems(workspaceId);
		return allItems.filter((item) => item.folderId === folderId);
	}

	/**
	 * Searches for items by display name
	 * @param workspaceId The workspace ID
	 * @param searchTerm The search term to match against display names
	 * @param caseSensitive Whether the search should be case sensitive (default: false)
	 * @returns Promise<Item[]>
	 */
	async searchItemsByName(workspaceId: string, searchTerm: string, caseSensitive: boolean = false): Promise<Item[]> {
		const allItems = await this.getAllItems(workspaceId);
		const searchPattern = caseSensitive ? searchTerm : searchTerm.toLowerCase();

		return allItems.filter((item) => {
			const itemName = caseSensitive ? item.displayName : item.displayName.toLowerCase();
			return itemName.includes(searchPattern);
		});
	}

	/**
	 * Creates multiple items in batch
	 * @param workspaceId The workspace ID
	 * @param requests Array of CreateItemRequest
	 * @returns Promise<Item[]>
	 */
	async createItemsBatch(workspaceId: string, requests: CreateItemRequest[]): Promise<Item[]> {
		const createdItems: Item[] = [];

		for (const request of requests) {
			try {
				const item = await this.createItem(workspaceId, request);
				createdItems.push(item);
			} catch (error) {
				logger.error(`Create item failed ${request.displayName}:`, error);
				// Continue with other items even if one fails
			}
		}

		return createdItems;
	}
}
