import { AccessToken, WorkloadClientAPI } from '@ms-fabric/workload-client';

import { EnvironmentConstants } from '../constants';
import { ErrorResponse } from './FabricPlatformTypes';

/**
 * Token provider interface for centralized authentication
 */
export interface TokenProvider {
	getToken(): Promise<string>;
	refreshToken(): Promise<string>;
}

/**
 * Custom error class for Fabric Platform API errors
 * Includes structured error information from the API response
 */
export class FabricPlatformError extends Error {
	public readonly statusCode: number;
	public readonly statusText: string;
	public readonly errorResponse?: ErrorResponse;
	public readonly requestId?: string;

	constructor(
		statusCode: number,
		statusText: string,
		errorResponse?: ErrorResponse,
		requestId?: string,
		originalError?: Error,
	) {
		const message = errorResponse?.message || `HTTP ${statusCode}: ${statusText}`;
		super(message);

		this.name = 'FabricPlatformError';
		this.statusCode = statusCode;
		this.statusText = statusText;
		this.errorResponse = errorResponse;
		this.requestId = requestId || errorResponse?.requestId;

		// Maintain proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, FabricPlatformError);
		}

		// Include original error stack if available
		if (originalError?.stack) {
			this.stack += '\nCaused by: ' + originalError.stack;
		}
	}

	/**
	 * Get the error code from the error response
	 */
	get errorCode(): string | undefined {
		return this.errorResponse?.errorCode;
	}

	/**
	 * Get the error details from the error response
	 */
	get errorDetails(): any[] | undefined {
		return this.errorResponse?.moreDetails;
	}

	/**
	 * Convert to a plain object for logging/serialization
	 */
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			statusCode: this.statusCode,
			statusText: this.statusText,
			errorCode: this.errorCode,
			errorResponse: this.errorResponse,
			requestId: this.requestId,
			stack: this.stack,
		};
	}
}

/**
 * Abstract base class for Fabric Platform API Clients
 * Provides common HTTP client functionality with authentication
 * Supports method-based scope selection (read scopes for GET, write scopes for POST/DELETE/etc)
 */
export abstract class FabricPlatformClient {
	// Global cooldown timestamp (ms since epoch). When set, clients should avoid calling the Fabric API
	// until the timestamp. This helps coordinate rate-limit windows across all clients.
	private static globalCooldownUntil: number | null = null;
	protected workloadClient: WorkloadClientAPI;
	protected baseUrl: string = EnvironmentConstants.FabricApiBaseUrl;
	protected tokenProvider: TokenProvider;

	constructor(workloadClient: WorkloadClientAPI, tokenProvider: TokenProvider) {
		this.workloadClient = workloadClient;
		this.tokenProvider = tokenProvider;
	}

	/**
	 * Get an authenticated access token for Fabric API calls
	 * @returns Promise<AccessToken>
	 */
	protected async getAccessToken(): Promise<AccessToken> {
		const token = await this.tokenProvider.getToken();
		return { token };
	}

	/**
	 * Make an authenticated HTTP request to the Fabric API
	 * @param url The endpoint URL (can be relative or absolute)
	 * @param options RequestInit options
	 * @returns Promise<T>
	 */
	protected async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
		const response = await this.makeRequestWithResponse(url, options);

		// Return parsed body if available, otherwise undefined
		return response.body as T;
	}

	/**
	 * GET request helper
	 * @param endpoint The API endpoint
	 * @returns Promise<T>
	 */
	protected get<T>(endpoint: string): Promise<T> {
		return this.makeRequest<T>(endpoint, { method: 'GET' });
	}

	/**
	 * POST request helper
	 * @param endpoint The API endpoint
	 * @param data The request body
	 * @returns Promise<T>
	 */
	protected post<T>(endpoint: string, data?: any): Promise<T> {
		return this.makeRequest<T>(endpoint, {
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	/**
	 * POST helper that returns full response metadata (status, headers, raw body and parsed JSON)
	 * Useful for callers that need to inspect asynchronous 202 responses and operation headers.
	 */
	protected async postWithResponse(
		endpoint: string,
		data?: any,
	): Promise<{
		status: number;
		statusText: string;
		headers: Record<string, string | null>;
		rawBody: string | undefined;
		body?: any;
		requestBody?: string;
	}> {
		const requestBody = data ? JSON.stringify(data) : undefined;

		// Use makeRequest with custom handling to capture full response
		return this.makeRequestWithResponse(endpoint, {
			method: 'POST',
			body: requestBody,
		});
	}

	/**
	 * Internal helper that wraps makeRequest logic but returns full response metadata
	 */
	private async makeRequestWithResponse(
		url: string,
		options: RequestInit = {},
	): Promise<{
		status: number;
		statusText: string;
		headers: Record<string, string | null>;
		rawBody: string | undefined;
		body?: any;
		requestBody?: string;
	}> {
		const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}/v1${url}`;

		const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
		let networkAttempts = 0;
		const maxNetworkRetries = 2;
		let tokenRefreshAttempts = 0;
		const maxTokenRefreshRetries = 1;

		// Retry loop to handle transient network errors and token refresh
		while (true) {
			// If a global cooldown is in effect, wait (up to a cap) before attempting the request.
			// Check inside the loop so retries also respect cooldown that may have been set by concurrent requests.
			const now = Date.now();
			if (FabricPlatformClient.globalCooldownUntil && FabricPlatformClient.globalCooldownUntil > now) {
				const remaining = FabricPlatformClient.globalCooldownUntil - now;
				const cap = 120000; // cap wait to 2 minutes
				if (remaining > cap) {
					logger.warn(
						`Global Fabric API cooldown in effect for ${Math.round(remaining / 1000)}s — refusing to wait longer than ${Math.round(cap / 1000)}s`,
					);
					throw new FabricPlatformError(429, 'Too Many Requests', undefined, undefined);
				}
				logger.warn(
					`Global cooldown active — waiting ${Math.round(remaining / 1000)}s before calling ${fullUrl}`,
				);
				await new Promise((r) => setTimeout(r, remaining));
			}

			try {
				const accessToken = await this.getAccessToken();
				const response = await fetch(fullUrl, {
					...options,
					headers: {
						Authorization: `Bearer ${accessToken.token}`,
						'Content-Type': 'application/json',
						'User-Agent': 'ms-fabric-wdk',
						...options.headers,
					},
				});

				// Reset network retry counter on successful fetch
				networkAttempts = 0;
				tokenRefreshAttempts = 0;

				// Capture headers
				const headersObj: Record<string, string | null> = {};
				response.headers.forEach((v, k) => (headersObj[k] = v));

				// Capture raw body
				let rawBody: string | undefined;
				let parsed: any | undefined;
				try {
					rawBody = await response.text();
					if (rawBody) {
						try {
							parsed = JSON.parse(rawBody);
						} catch {
							/* ignore parse error */
						}
					}
				} catch (err) {
					// ignore
				}

				// Handle non-OK responses with error handling
				if (!response.ok) {
					// Type guard to check if parsed object is an ErrorResponse
					const errorResponse = parsed as ErrorResponse | undefined;
					const requestId =
						response.headers.get('x-ms-request-id') ||
						response.headers.get('request-id') ||
						response.headers.get('x-request-id') ||
						undefined;

					if (response.status === 429) {
						// Parse server guidance for cooldown
						let waitMs = 0;
						const retryAfter = response.headers.get('Retry-After') || response.headers.get('retry-after');
						if (retryAfter) {
							const seconds = parseInt(retryAfter, 10);
							if (!isNaN(seconds)) waitMs = seconds * 1000;
							else {
								const until = Date.parse(retryAfter);
								if (!isNaN(until)) {
									const diff = until - Date.now();
									if (diff > 0) waitMs = diff;
								}
							}
						} else {
							// Try to locate an 'until' timestamp
							const messageSource =
								errorResponse && typeof errorResponse.message === 'string'
									? errorResponse.message
									: rawBody || '';

							if (messageSource) {
								const m = /(?:blocked\s*)?until[:\s]*([^\)\n]+)/i.exec(messageSource);
								if (m && m[1]) {
									const parsedDate = Date.parse(m[1].trim());
									if (!isNaN(parsedDate)) {
										const diff = parsedDate - Date.now();
										if (diff > 0) waitMs = diff;
									}
								}
							}
						}

						if (waitMs > 0) {
							FabricPlatformClient.globalCooldownUntil = Date.now() + waitMs;
							logger.warn(
								`Received 429 from Fabric API for ${fullUrl}; setting global cooldown for ${Math.round(waitMs / 1000)}s. requestId=${requestId}`,
							);
						} else {
							const defaultCooldownMs = 30000;
							FabricPlatformClient.globalCooldownUntil = Date.now() + defaultCooldownMs;
							logger.warn(
								`Received 429 from Fabric API for ${fullUrl}; no 'Retry-After' parsed — applying default cooldown ${Math.round(defaultCooldownMs / 1000)}s. requestId=${requestId}`,
							);
						}

						throw new FabricPlatformError(response.status, response.statusText, errorResponse, requestId);
					}

					if (response.status === 401) {
						// Unauthorized - token may be expired, refresh and retry once
						if (tokenRefreshAttempts < maxTokenRefreshRetries) {
							tokenRefreshAttempts++;
							logger.warn(
								`Received 401 from Fabric API for ${fullUrl}; refreshing token and retrying. requestId=${requestId}`,
							);

							// Explicitly refresh the token if the provider supports it
							try {
								await this.tokenProvider.refreshToken();
							} catch (refreshError) {
								logger.error('Token refresh failed:', refreshError);
								throw new FabricPlatformError(
									response.status,
									'Token refresh failed',
									errorResponse,
									requestId,
								);
							}

							// Continue to next iteration to retry with fresh token
							continue;
						}
						// No more token refresh retries - throw error
						const fpErr = new FabricPlatformError(
							response.status,
							response.statusText,
							errorResponse,
							requestId,
						);
						logger.error('Token refresh failed for:', url, fpErr);
						throw fpErr;
					}

					// Non-429/401 -> throw structured error
					const fpErr = new FabricPlatformError(
						response.status,
						response.statusText,
						errorResponse,
						requestId,
					);
					logger.error('Api request failed for:', url, fpErr);
					throw fpErr;
				}

				return {
					status: response.status,
					statusText: response.statusText,
					headers: headersObj,
					rawBody,
					body: parsed,
					requestBody: options.body as string | undefined,
				};
			} catch (error) {
				// On network errors, retry a small number of times with backoff
				if (!(error instanceof FabricPlatformError) && networkAttempts < maxNetworkRetries) {
					networkAttempts++;
					const waitMs = 1000 * Math.pow(2, networkAttempts - 1);
					logger.warn(
						`Network error for ${fullUrl}; retrying in ${Math.round(waitMs / 1000)}s (attempt ${networkAttempts}/${maxNetworkRetries})`,
					);
					await sleep(waitMs);
					// Continue to next iteration to retry
					continue;
				}

				// No more retries or error is FabricPlatformError - rethrow
				if (error instanceof FabricPlatformError) {
					throw error;
				}
				logger.error('API request failed for:', url, error);
				throw error;
			}
		}
	}

	/**
	 * GET helper that returns full response metadata (status, headers, raw body and parsed JSON)
	 * Useful for polling long-running operation endpoints.
	 */
	protected async getWithResponse(endpoint: string): Promise<{
		status: number;
		statusText: string;
		headers: Record<string, string | null>;
		rawBody: string | undefined;
		body?: any;
	}> {
		return this.makeRequestWithResponse(endpoint, { method: 'GET' });
	}

	/**
	 * PATCH request helper
	 * @param endpoint The API endpoint
	 * @param data The request body
	 * @returns Promise<T>
	 */
	protected patch<T>(endpoint: string, data: any): Promise<T> {
		return this.makeRequest<T>(endpoint, {
			method: 'PATCH',
			body: JSON.stringify(data),
		});
	}

	/**
	 * PUT request helper
	 * @param endpoint The API endpoint
	 * @param data The request body
	 * @returns Promise<T>
	 */
	protected put<T>(endpoint: string, data: any): Promise<T> {
		return this.makeRequest<T>(endpoint, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	}

	/**
	 * DELETE request helper
	 * @param endpoint The API endpoint
	 * @returns Promise<T>
	 */
	protected delete<T>(endpoint: string): Promise<T> {
		return this.makeRequest<T>(endpoint, { method: 'DELETE' });
	}

	/**
	 * Helper to handle paginated responses automatically
	 * @param endpoint The API endpoint
	 * @returns Promise<T[]>
	 */
	protected async getAllPages<T>(endpoint: string): Promise<T[]> {
		const allItems: T[] = [];
		let continuationToken: string | undefined;

		do {
			const url = continuationToken
				? `${endpoint}${endpoint.includes('?') ? '&' : '?'}continuationToken=${encodeURIComponent(continuationToken)}`
				: endpoint;

			const response: any = await this.get(url);

			if (response.value && Array.isArray(response.value)) {
				allItems.push(...response.value);
				continuationToken = response.continuationToken;
			} else if (Array.isArray(response)) {
				// Some endpoints return arrays directly
				allItems.push(...response);
				break;
			} else {
				// Single item response
				allItems.push(response);
				break;
			}
		} while (continuationToken);

		return allItems;
	}
}
