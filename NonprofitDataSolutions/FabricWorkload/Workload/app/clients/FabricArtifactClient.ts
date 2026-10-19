import { WorkloadClientAPI } from '@ms-fabric/workload-client';

import { FabricPlatformClient, TokenProvider } from './FabricPlatformClient';

/**
 * Fabric Artifact API response types
 */
export interface ArtifactMetadata {
	id: string;
	displayName: string;
	description?: string;
	type: string;
	workspaceId: string;
	createdDate: string;
	modifiedDate: string;
	createdBy?: {
		id: string;
		displayName: string;
		userPrincipalName: string;
	};
	modifiedBy?: {
		id: string;
		displayName: string;
		userPrincipalName: string;
	};
}

export interface CreateArtifactRequest {
	displayName: string;
	description?: string;
	type: string;
	definition?: any;
}

export interface UpdateArtifactRequest {
	displayName?: string;
	description?: string;
	definition?: any;
}

export interface ArtifactListResponse {
	value: ArtifactMetadata[];
	continuationToken?: string;
}

/**
 * Client for Fabric Artifact API operations
 * Provides methods for managing Fabric artifacts (lakehouses, notebooks, datasets, etc.)
 * Uses centralized token management
 */
export class FabricArtifactClient extends FabricPlatformClient {
	constructor(workloadClient: WorkloadClientAPI, tokenProvider: TokenProvider) {
		super(workloadClient, tokenProvider);
	}

	// ============================
	// Artifact Management
	// ============================

	/**
	 * Get all artifacts in a workspace
	 * @param workspaceId The workspace ID
	 * @returns Promise<ArtifactMetadata[]>
	 */
	async getArtifacts(workspaceId: string): Promise<ArtifactMetadata[]> {
		const endpoint = `/workspaces/${encodeURIComponent(workspaceId)}/artifacts`;
		return this.getAllPages<ArtifactMetadata>(endpoint);
	}

	/**
	 * Get artifacts by type in a workspace
	 * @param workspaceId The workspace ID
	 * @param artifactType The artifact type to filter by
	 * @returns Promise<ArtifactMetadata[]>
	 */
	async getArtifactsByType(workspaceId: string, artifactType: string): Promise<ArtifactMetadata[]> {
		const endpoint = `/workspaces/${encodeURIComponent(workspaceId)}/artifacts?$filter=type eq '${encodeURIComponent(artifactType)}'`;
		return this.getAllPages<ArtifactMetadata>(endpoint);
	}

	/**
	 * Get a specific artifact
	 * @param workspaceId The workspace ID
	 * @param artifactId The artifact ID
	 * @returns Promise<ArtifactMetadata>
	 */
	async getArtifact(workspaceId: string, artifactId: string): Promise<ArtifactMetadata> {
		const endpoint = `/workspaces/${encodeURIComponent(workspaceId)}/artifacts/${encodeURIComponent(artifactId)}`;
		return this.get<ArtifactMetadata>(endpoint);
	}

	/**
	 * Create a new artifact
	 * @param workspaceId The workspace ID
	 * @param request The create artifact request
	 * @returns Promise<ArtifactMetadata>
	 */
	async createArtifact(workspaceId: string, request: CreateArtifactRequest): Promise<ArtifactMetadata> {
		const endpoint = `/workspaces/${encodeURIComponent(workspaceId)}/artifacts`;
		return this.post<ArtifactMetadata>(endpoint, request);
	}

	/**
	 * Update an existing artifact
	 * @param workspaceId The workspace ID
	 * @param artifactId The artifact ID
	 * @param request The update artifact request
	 * @returns Promise<ArtifactMetadata>
	 */
	async updateArtifact(
		workspaceId: string,
		artifactId: string,
		request: UpdateArtifactRequest,
	): Promise<ArtifactMetadata> {
		const endpoint = `/workspaces/${encodeURIComponent(workspaceId)}/artifacts/${encodeURIComponent(artifactId)}`;
		return this.patch<ArtifactMetadata>(endpoint, request);
	}

	/**
	 * Delete an artifact
	 * @param workspaceId The workspace ID
	 * @param artifactId The artifact ID
	 * @returns Promise<void>
	 */
	async deleteArtifact(workspaceId: string, artifactId: string): Promise<void> {
		const endpoint = `/workspaces/${encodeURIComponent(workspaceId)}/artifacts/${encodeURIComponent(artifactId)}`;
		return this.delete<void>(endpoint);
	}

	// ============================
	// Lakehouse-specific methods
	// ============================

	/**
	 * Get lakehouses. When workspaceId is provided returns lakehouses from that
	 * workspace; otherwise queries every accessible workspace in parallel.
	 * @param workspaceId Optional workspace ID — omit to search across the tenant
	 * @returns Promise<ArtifactMetadata[]>
	 */
	async getLakehouses(workspaceId?: string): Promise<ArtifactMetadata[]> {
		if (workspaceId) {
			const endpoint = `/workspaces/${encodeURIComponent(workspaceId)}/lakehouses`;
			return this.getAllPages<ArtifactMetadata>(endpoint);
		}

		const workspaces = await this.getAllPages<{ id: string }>('/workspaces');
		const results = await Promise.all(
			workspaces.map((ws) => this.getLakehouses(ws.id).catch(() => [] as ArtifactMetadata[])),
		);
		return results.flat();
	}

	/**
	 * Create a new lakehouse
	 * @param workspaceId The workspace ID
	 * @param displayName The lakehouse display name
	 * @param description Optional description
	 * @returns Promise<ArtifactMetadata>
	 */
	async createLakehouse(workspaceId: string, displayName: string, description?: string): Promise<ArtifactMetadata> {
		const request: CreateArtifactRequest = {
			displayName,
			description,
			type: 'Lakehouse',
		};
		return this.createArtifact(workspaceId, request);
	}

	// ============================
	// Notebook-specific methods
	// ============================

	/**
	 * Get all notebooks in a workspace
	 * @param workspaceId The workspace ID
	 * @returns Promise<ArtifactMetadata[]>
	 */
	async getNotebooks(workspaceId: string): Promise<ArtifactMetadata[]> {
		const endpoint = `/workspaces/${encodeURIComponent(workspaceId)}/notebooks`;
		return this.getAllPages<ArtifactMetadata>(endpoint);
	}

	/**
	 * Create a new notebook
	 * @param workspaceId The workspace ID
	 * @param displayName The notebook display name
	 * @param description Optional description
	 * @returns Promise<ArtifactMetadata>
	 */
	async createNotebook(workspaceId: string, displayName: string, description?: string): Promise<ArtifactMetadata> {
		const request: CreateArtifactRequest = {
			displayName,
			description,
			type: 'Notebook',
		};
		return this.createArtifact(workspaceId, request);
	}

	// ============================
	// Dataset-specific methods
	// ============================

	/**
	 * Get all datasets in a workspace
	 * @param workspaceId The workspace ID
	 * @returns Promise<ArtifactMetadata[]>
	 */
	async getDatasets(workspaceId: string): Promise<ArtifactMetadata[]> {
		const endpoint = `/workspaces/${encodeURIComponent(workspaceId)}/datasets`;
		return this.getAllPages<ArtifactMetadata>(endpoint);
	}

	/**
	 * Create a new dataset
	 * @param workspaceId The workspace ID
	 * @param displayName The dataset display name
	 * @param description Optional description
	 * @returns Promise<ArtifactMetadata>
	 */
	async createDataset(workspaceId: string, displayName: string, description?: string): Promise<ArtifactMetadata> {
		const request: CreateArtifactRequest = {
			displayName,
			description,
			type: 'Dataset',
		};
		return this.createArtifact(workspaceId, request);
	}

	// ============================
	// Artifact Definition Management
	// ============================

	/**
	 * Get artifact definition
	 * @param workspaceId The workspace ID
	 * @param artifactId The artifact ID
	 * @returns Promise<any>
	 */
	async getArtifactDefinition(workspaceId: string, artifactId: string): Promise<any> {
		const endpoint = `/workspaces/${encodeURIComponent(workspaceId)}/artifacts/${encodeURIComponent(artifactId)}/definition`;
		return this.get<any>(endpoint);
	}

	/**
	 * Update artifact definition
	 * @param workspaceId The workspace ID
	 * @param artifactId The artifact ID
	 * @param definition The new definition
	 * @returns Promise<void>
	 */
	async updateArtifactDefinition(workspaceId: string, artifactId: string, definition: any): Promise<void> {
		const endpoint = `/workspaces/${encodeURIComponent(workspaceId)}/artifacts/${encodeURIComponent(artifactId)}/definition`;
		return this.put<void>(endpoint, definition);
	}

	// ============================
	// Utility Methods
	// ============================

	/**
	 * Check if an artifact exists
	 * @param workspaceId The workspace ID
	 * @param artifactId The artifact ID
	 * @returns Promise<boolean>
	 */
	async artifactExists(workspaceId: string, artifactId: string): Promise<boolean> {
		try {
			await this.getArtifact(workspaceId, artifactId);
			return true;
		} catch (error) {
			if (error instanceof Error && 'statusCode' in error && (error as any).statusCode === 404) {
				return false;
			}
			throw error;
		}
	}

	/**
	 * Find artifact by name
	 * @param workspaceId The workspace ID
	 * @param displayName The artifact display name
	 * @param artifactType Optional artifact type filter
	 * @returns Promise<ArtifactMetadata | undefined>
	 */
	async findArtifactByName(
		workspaceId: string,
		displayName: string,
		artifactType?: string,
	): Promise<ArtifactMetadata | undefined> {
		const artifacts = artifactType
			? await this.getArtifactsByType(workspaceId, artifactType)
			: await this.getArtifacts(workspaceId);

		return artifacts.find((artifact) => artifact.displayName === displayName);
	}

	/**
	 * Get artifact count by type
	 * @param workspaceId The workspace ID
	 * @returns Promise<Record<string, number>>
	 */
	async getArtifactCountByType(workspaceId: string): Promise<Record<string, number>> {
		const artifacts = await this.getArtifacts(workspaceId);
		const counts: Record<string, number> = {};

		artifacts.forEach((artifact) => {
			counts[artifact.type] = (counts[artifact.type] || 0) + 1;
		});

		return counts;
	}
}
