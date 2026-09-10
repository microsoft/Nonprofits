import { WorkloadClientAPI } from '@ms-fabric/workload-client';
import jwt_decode from 'jwt-decode';

interface TokenClaims {
	tid?: string; // Tenant ID
	oid?: string; // Object ID (User ID)
	upn?: string; // User Principal Name
	name?: string; // User display name
	[key: string]: unknown;
}

export interface TelemetryContextInfo {
	tenantId?: string;
	userId?: string;
}

/**
 * Extracts telemetry context information (tenant ID, user ID) from workload client access token
 * @param workloadClient Workload client instance
 * @returns Object containing tenantId and userId, or empty object if token cannot be acquired
 */
export async function extractTelemetryContext(workloadClient: WorkloadClientAPI): Promise<TelemetryContextInfo> {
	try {
		const tokenResult = await workloadClient.auth.acquireFrontendAccessToken({ scopes: ['openid', 'profile'] });
		const decoded = jwt_decode<TokenClaims>(tokenResult.token);

		return {
			tenantId: decoded.tid,
			userId: decoded.oid,
		};
	} catch (error) {
		console.warn('Failed to acquire token for telemetry context:', error);
		return {};
	}
}

/**
 * Extracts tenant ID from JWT access token
 * @param token JWT access token
 * @returns Tenant ID or undefined if not present
 */
export function extractTenantId(token: string): string | undefined {
	try {
		const decoded = jwt_decode<TokenClaims>(token);
		return decoded.tid;
	} catch (error) {
		console.warn('Failed to decode token for tenant ID:', error);
		return undefined;
	}
}

/**
 * Extracts user ID from JWT access token
 * @param token JWT access token
 * @returns User ID (oid) or undefined if not present
 */
export function extractUserId(token: string): string | undefined {
	try {
		const decoded = jwt_decode<TokenClaims>(token);
		return decoded.oid;
	} catch (error) {
		console.warn('Failed to decode token for user ID:', error);
		return undefined;
	}
}
