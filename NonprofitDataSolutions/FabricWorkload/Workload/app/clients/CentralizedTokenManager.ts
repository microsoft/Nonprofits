import { WorkloadClientAPI } from '@ms-fabric/workload-client';

import { TokenProvider } from './FabricPlatformClient';

/**
 * Centralized Token Manager
 * Handles token acquisition, caching, and refresh for all Fabric API clients
 * Provides a single point of authentication with comprehensive scopes
 */
export class CentralizedTokenManager implements TokenProvider {
	private readonly workloadClient: WorkloadClientAPI;
	private readonly scopes: string[];
	private sharedToken: string | null = null;
	private tokenExpiry: Date | null = null;
	private tokenPromise: Promise<string> | null = null;

	constructor(workloadClient: WorkloadClientAPI, scopes: string[]) {
		this.workloadClient = workloadClient;
		this.scopes = scopes;
	}

	/**
	 * Gets a shared token with all required scopes, using caching for performance
	 * Implements the TokenProvider interface
	 * @returns Promise<string> Access token
	 */
	async getToken(): Promise<string> {
		// If there's an ongoing token fetch, wait for it
		if (this.tokenPromise) {
			return this.tokenPromise;
		}

		// Check if we have a valid cached token that hasn't expired
		if (this.tokenExpiry && new Date() < this.tokenExpiry) {
			return this.sharedToken!;
		}

		// Token is missing or expired - fetch a new one
		this.tokenPromise = this.fetchToken();
		return this.tokenPromise;
	}

	/**
	 * Internal method to fetch a new token
	 * @returns Promise<string> Access token
	 */
	private async fetchToken(): Promise<string> {
		try {
			const tokenResult = await this.workloadClient.auth.acquireFrontendAccessToken({
				scopes: this.scopes,
			});

			this.sharedToken = tokenResult.token;
			this.tokenExpiry = tokenResult.expiry ?? new Date(Date.now() + 10 * 60 * 1000);
			this.tokenPromise = null; // Clear the promise after successful fetch

			return this.sharedToken;
		} catch (error) {
			this.tokenPromise = null; // Clear the promise on error
			logger.error('Token acquire failed:', error);
			throw new Error(
				`Failed to acquire access token: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	/**
	 * Manually refresh the shared token (useful for long-running operations)
	 * @returns Promise<string> New access token
	 */
	async refreshToken(): Promise<string> {
		this.sharedToken = null;
		this.tokenExpiry = null;
		this.tokenPromise = this.fetchToken();
		return this.tokenPromise;
	}
}
