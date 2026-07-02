import { WorkloadClientAPI } from '@ms-fabric/workload-client';

import { FabricPlatformClient, TokenProvider } from './FabricPlatformClient';
import {
	CreateFolderRequest,
	Folder,
	MoveFolderRequest,
	PaginatedResponse,
	UpdateFolderRequest,
} from './FabricPlatformTypes';

/**
 * API wrapper for Fabric Platform Folder operations
 * Provides methods for managing folders within workspaces
 * Uses centralized token management
 */
export class FolderClient extends FabricPlatformClient {
	constructor(workloadClient: WorkloadClientAPI, tokenProvider: TokenProvider) {
		super(workloadClient, tokenProvider);
	}

	// ============================
	// Folder Management
	// ============================

	/**
	 * Returns a list of folders from the specified workspace
	 * @param workspaceId The workspace ID
	 * @param rootFolderId Optional root folder ID to filter by
	 * @param recursive Whether to include nested folders (default: true)
	 * @param continuationToken Token for pagination
	 * @returns Promise<PaginatedResponse<Folder>>
	 */
	async listFolders(
		workspaceId: string,
		rootFolderId?: string,
		recursive: boolean = true,
		continuationToken?: string,
	): Promise<PaginatedResponse<Folder>> {
		let endpoint = `/workspaces/${workspaceId}/folders`;
		const params = new URLSearchParams();

		if (rootFolderId) {
			params.append('rootFolderId', rootFolderId);
		}
		params.append('recursive', recursive.toString());
		if (continuationToken) {
			params.append('continuationToken', continuationToken);
		}

		if (params.toString()) {
			endpoint += `?${params.toString()}`;
		}

		return this.get<PaginatedResponse<Folder>>(endpoint);
	}

	/**
	 * Gets all folders from the specified workspace (handles pagination automatically)
	 * @param workspaceId The workspace ID
	 * @param rootFolderId Optional root folder ID to filter by
	 * @param recursive Whether to include nested folders (default: true)
	 * @returns Promise<Folder[]>
	 */
	async getAllFolders(workspaceId: string, rootFolderId?: string, recursive: boolean = true): Promise<Folder[]> {
		let endpoint = `/workspaces/${workspaceId}/folders`;
		const params = new URLSearchParams();

		if (rootFolderId) {
			params.append('rootFolderId', rootFolderId);
		}
		params.append('recursive', recursive.toString());

		if (params.toString()) {
			endpoint += `?${params.toString()}`;
		}

		return this.getAllPages<Folder>(endpoint);
	}

	/**
	 * Creates a new folder in the specified workspace
	 * @param workspaceId The workspace ID
	 * @param request CreateFolderRequest
	 * @returns Promise<Folder>
	 */
	async createFolder(workspaceId: string, request: CreateFolderRequest): Promise<Folder> {
		return this.post<Folder>(`/workspaces/${workspaceId}/folders`, request);
	}

	/**
	 * Returns properties of the specified folder
	 * @param workspaceId The workspace ID
	 * @param folderId The folder ID
	 * @returns Promise<Folder>
	 */
	async getFolder(workspaceId: string, folderId: string): Promise<Folder> {
		return this.get<Folder>(`/workspaces/${workspaceId}/folders/${folderId}`);
	}

	/**
	 * Updates the properties of the specified folder
	 * @param workspaceId The workspace ID
	 * @param folderId The folder ID
	 * @param request UpdateFolderRequest
	 * @returns Promise<Folder>
	 */
	async updateFolder(workspaceId: string, folderId: string, request: UpdateFolderRequest): Promise<Folder> {
		return this.patch<Folder>(`/workspaces/${workspaceId}/folders/${folderId}`, request);
	}

	/**
	 * Deletes the specified folder (must be empty)
	 * @param workspaceId The workspace ID
	 * @param folderId The folder ID
	 * @returns Promise<void>
	 */
	async deleteFolder(workspaceId: string, folderId: string): Promise<void> {
		await this.delete<void>(`/workspaces/${workspaceId}/folders/${folderId}`);
	}

	/**
	 * Moves the specified folder to a new location
	 * @param workspaceId The workspace ID
	 * @param folderId The folder ID
	 * @param request MoveFolderRequest
	 * @returns Promise<Folder>
	 */
	async moveFolder(workspaceId: string, folderId: string, request: MoveFolderRequest): Promise<Folder> {
		return this.post<Folder>(`/workspaces/${workspaceId}/folders/${folderId}/move`, request);
	}

	// ============================
	// Helper Methods
	// ============================

	/**
	 * Gets the folder hierarchy starting from a root folder
	 * @param workspaceId The workspace ID
	 * @param rootFolderId The root folder ID (optional, defaults to workspace root)
	 * @returns Promise<Folder[]>
	 */
	async getFolderHierarchy(workspaceId: string, rootFolderId?: string): Promise<Folder[]> {
		return this.getAllFolders(workspaceId, rootFolderId, true);
	}

	/**
	 * Gets only direct child folders (non-recursive)
	 * @param workspaceId The workspace ID
	 * @param parentFolderId The parent folder ID (optional, defaults to workspace root)
	 * @returns Promise<Folder[]>
	 */
	async getDirectChildFolders(workspaceId: string, parentFolderId?: string): Promise<Folder[]> {
		return this.getAllFolders(workspaceId, parentFolderId, false);
	}

	/**
	 * Creates a folder hierarchy by creating nested folders
	 * @param workspaceId The workspace ID
	 * @param folderPath Array of folder names representing the path
	 * @param parentFolderId The parent folder ID to start from (optional)
	 * @returns Promise<Folder> - Returns the deepest created folder
	 */
	async createFolderHierarchy(workspaceId: string, folderPath: string[], parentFolderId?: string): Promise<Folder> {
		let currentParentId = parentFolderId;
		let lastCreatedFolder: Folder | undefined;

		for (const folderName of folderPath) {
			// Check if folder already exists
			const existingFolders = await this.getDirectChildFolders(workspaceId, currentParentId);
			const existingFolder = existingFolders.find((folder) => folder.displayName === folderName);

			if (existingFolder) {
				currentParentId = existingFolder.id;
				lastCreatedFolder = existingFolder;
			} else {
				// Create the folder
				const createRequest: CreateFolderRequest = {
					displayName: folderName,
					parentFolderId: currentParentId,
				};
				lastCreatedFolder = await this.createFolder(workspaceId, createRequest);
				currentParentId = lastCreatedFolder.id;
			}
		}

		if (!lastCreatedFolder) {
			throw new Error('No folders were created or found');
		}

		return lastCreatedFolder;
	}

	/**
	 * Searches for folders by display name
	 * @param workspaceId The workspace ID
	 * @param searchTerm The search term to match against display names
	 * @param caseSensitive Whether the search should be case sensitive (default: false)
	 * @returns Promise<Folder[]>
	 */
	async searchFoldersByName(
		workspaceId: string,
		searchTerm: string,
		caseSensitive: boolean = false,
	): Promise<Folder[]> {
		const allFolders = await this.getAllFolders(workspaceId);
		const searchPattern = caseSensitive ? searchTerm : searchTerm.toLowerCase();

		return allFolders.filter((folder) => {
			const folderName = caseSensitive ? folder.displayName : folder.displayName.toLowerCase();
			return folderName.includes(searchPattern);
		});
	}

	/**
	 * Gets the full path of a folder (from workspace root)
	 * @param workspaceId The workspace ID
	 * @param folderId The folder ID
	 * @returns Promise<string[]> - Array of folder names representing the path
	 */
	async getFolderPath(workspaceId: string, folderId: string): Promise<string[]> {
		const path: string[] = [];
		let currentFolderId: string | undefined = folderId;

		while (currentFolderId) {
			const folder = await this.getFolder(workspaceId, currentFolderId);
			path.unshift(folder.displayName);
			currentFolderId = folder.parentFolderId;
		}

		return path;
	}

	/**
	 * Checks if a folder is empty (contains no subfolders)
	 * @param workspaceId The workspace ID
	 * @param folderId The folder ID
	 * @returns Promise<boolean>
	 */
	async isFolderEmpty(workspaceId: string, folderId: string): Promise<boolean> {
		const childFolders = await this.getDirectChildFolders(workspaceId, folderId);
		return childFolders.length === 0;
	}
}
