import { WorkloadClientAPI } from '@ms-fabric/workload-client';

import { FabricPlatformClient, TokenProvider } from './FabricPlatformClient';
import {
	AddWorkspaceRoleAssignmentRequest,
	AssignWorkspaceToCapacityRequest,
	CreateWorkspaceRequest,
	PaginatedResponse,
	UpdateWorkspaceRequest,
	UpdateWorkspaceRoleAssignmentRequest,
	Workspace,
	WorkspaceIdentity,
	WorkspaceInfo,
	WorkspaceRole,
	WorkspaceRoleAssignment,
} from './FabricPlatformTypes';

/**
 * API wrapper for Fabric Platform Workspace operations
 * Provides methods for managing workspaces, roles, and capacity assignments
 * Uses centralized token management
 */
export class WorkspaceClient extends FabricPlatformClient {
	constructor(workloadClient: WorkloadClientAPI, tokenProvider: TokenProvider) {
		super(workloadClient, tokenProvider);
	}

	// ============================
	// Workspace Management
	// ============================

	/**
	 * Returns a list of workspaces the user can access
	 * @param roles Optional filter by workspace role
	 * @param continuationToken Token for pagination
	 * @returns Promise<PaginatedResponse<Workspace>>
	 */
	async listWorkspaces(roles?: WorkspaceRole[], continuationToken?: string): Promise<PaginatedResponse<Workspace>> {
		let endpoint = '/workspaces';
		const params = new URLSearchParams();

		if (roles && roles.length > 0) {
			params.append('roles', roles.join(','));
		}
		if (continuationToken) {
			params.append('continuationToken', continuationToken);
		}

		if (params.toString()) {
			endpoint += `?${params.toString()}`;
		}

		return this.get<PaginatedResponse<Workspace>>(endpoint);
	}

	/**
	 * Gets all workspaces the user can access (handles pagination automatically)
	 * @param roles Optional filter by workspace role
	 * @returns Promise<Workspace[]>
	 */
	async getAllWorkspaces(roles?: WorkspaceRole[]): Promise<Workspace[]> {
		let endpoint = '/workspaces';
		if (roles && roles.length > 0) {
			endpoint += `?roles=${roles.join(',')}`;
		}
		return this.getAllPages<Workspace>(endpoint);
	}

	/**
	 * Creates a new workspace
	 * @param request CreateWorkspaceRequest
	 * @returns Promise<Workspace>
	 */
	async createWorkspace(request: CreateWorkspaceRequest): Promise<Workspace> {
		return this.post<Workspace>('/workspaces', request);
	}

	/**
	 * Returns specified workspace information
	 * @param workspaceId The workspace ID
	 * @returns Promise<WorkspaceInfo>
	 */
	async getWorkspace(workspaceId: string): Promise<WorkspaceInfo> {
		return this.get<WorkspaceInfo>(`/workspaces/${workspaceId}`);
	}

	/**
	 * Updates the properties of the specified workspace
	 * @param workspaceId The workspace ID
	 * @param request UpdateWorkspaceRequest
	 * @returns Promise<Workspace>
	 */
	async updateWorkspace(workspaceId: string, request: UpdateWorkspaceRequest): Promise<Workspace> {
		return this.patch<Workspace>(`/workspaces/${workspaceId}`, request);
	}

	/**
	 * Deletes the specified workspace
	 * @param workspaceId The workspace ID
	 * @returns Promise<void>
	 */
	async deleteWorkspace(workspaceId: string): Promise<void> {
		await this.delete<void>(`/workspaces/${workspaceId}`);
	}

	// ============================
	// Workspace Role Management
	// ============================

	/**
	 * Returns a list of workspace role assignments
	 * @param workspaceId The workspace ID
	 * @param continuationToken Token for pagination
	 * @returns Promise<PaginatedResponse<WorkspaceRoleAssignment>>
	 */
	async listWorkspaceRoleAssignments(
		workspaceId: string,
		continuationToken?: string,
	): Promise<PaginatedResponse<WorkspaceRoleAssignment>> {
		let endpoint = `/workspaces/${workspaceId}/roleAssignments`;
		if (continuationToken) {
			endpoint += `?continuationToken=${encodeURIComponent(continuationToken)}`;
		}
		return this.get<PaginatedResponse<WorkspaceRoleAssignment>>(endpoint);
	}

	/**
	 * Gets all workspace role assignments (handles pagination automatically)
	 * @param workspaceId The workspace ID
	 * @returns Promise<WorkspaceRoleAssignment[]>
	 */
	async getAllWorkspaceRoleAssignments(workspaceId: string): Promise<WorkspaceRoleAssignment[]> {
		return this.getAllPages<WorkspaceRoleAssignment>(`/workspaces/${workspaceId}/roleAssignments`);
	}

	/**
	 * Adds a new workspace role assignment
	 * @param workspaceId The workspace ID
	 * @param request AddWorkspaceRoleAssignmentRequest
	 * @returns Promise<WorkspaceRoleAssignment>
	 */
	async addWorkspaceRoleAssignment(
		workspaceId: string,
		request: AddWorkspaceRoleAssignmentRequest,
	): Promise<WorkspaceRoleAssignment> {
		return this.post<WorkspaceRoleAssignment>(`/workspaces/${workspaceId}/roleAssignments`, request);
	}

	/**
	 * Gets the specified workspace role assignment
	 * @param workspaceId The workspace ID
	 * @param roleAssignmentId The role assignment ID
	 * @returns Promise<WorkspaceRoleAssignment>
	 */
	async getWorkspaceRoleAssignment(workspaceId: string, roleAssignmentId: string): Promise<WorkspaceRoleAssignment> {
		return this.get<WorkspaceRoleAssignment>(`/workspaces/${workspaceId}/roleAssignments/${roleAssignmentId}`);
	}

	/**
	 * Updates the specified workspace role assignment
	 * @param workspaceId The workspace ID
	 * @param roleAssignmentId The role assignment ID
	 * @param request UpdateWorkspaceRoleAssignmentRequest
	 * @returns Promise<WorkspaceRoleAssignment>
	 */
	async updateWorkspaceRoleAssignment(
		workspaceId: string,
		roleAssignmentId: string,
		request: UpdateWorkspaceRoleAssignmentRequest,
	): Promise<WorkspaceRoleAssignment> {
		return this.patch<WorkspaceRoleAssignment>(
			`/workspaces/${workspaceId}/roleAssignments/${roleAssignmentId}`,
			request,
		);
	}

	/**
	 * Deletes the specified workspace role assignment
	 * @param workspaceId The workspace ID
	 * @param roleAssignmentId The role assignment ID
	 * @returns Promise<void>
	 */
	async deleteWorkspaceRoleAssignment(workspaceId: string, roleAssignmentId: string): Promise<void> {
		await this.delete<void>(`/workspaces/${workspaceId}/roleAssignments/${roleAssignmentId}`);
	}

	// ============================
	// Capacity Management
	// ============================

	/**
	 * Assigns the workspace to a capacity
	 * @param workspaceId The workspace ID
	 * @param request AssignWorkspaceToCapacityRequest
	 * @returns Promise<void>
	 */
	async assignWorkspaceToCapacity(workspaceId: string, request: AssignWorkspaceToCapacityRequest): Promise<void> {
		await this.post<void>(`/workspaces/${workspaceId}/assignToCapacity`, request);
	}

	/**
	 * Unassigns the workspace from a capacity
	 * @param workspaceId The workspace ID
	 * @returns Promise<void>
	 */
	async unassignWorkspaceFromCapacity(workspaceId: string): Promise<void> {
		await this.post<void>(`/workspaces/${workspaceId}/unassignFromCapacity`);
	}

	// ============================
	// Workspace Identity Management
	// ============================

	/**
	 * Provisions a workspace identity
	 * @param workspaceId The workspace ID
	 * @returns Promise<WorkspaceIdentity>
	 */
	async provisionWorkspaceIdentity(workspaceId: string): Promise<WorkspaceIdentity> {
		return this.post<WorkspaceIdentity>(`/workspaces/${workspaceId}/provisionIdentity`);
	}

	/**
	 * Deprovisions a workspace identity
	 * @param workspaceId The workspace ID
	 * @returns Promise<void>
	 */
	async deprovisionWorkspaceIdentity(workspaceId: string): Promise<void> {
		await this.post<void>(`/workspaces/${workspaceId}/deprovisionIdentity`);
	}
}
