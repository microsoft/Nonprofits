import { DeploymentContext } from './DeploymentContext';

/**
 * Utility class for handling content operations during deployment.
 * Provides static methods for fetching, processing, and transforming various types of content.
 */
export class ContentHelper {
	/**
	 * Performs a lightweight deep clone for JSON-compatible values using JSON serialization.
	 * Handy for duplicating asset templates before applying in-memory transformations.
	 */
	static cloneJson<T>(value: T): T {
		return JSON.parse(JSON.stringify(value));
	}
	/**
	 * Converts a JSON-serializable value into a Base64 string suitable for inline payloads.
	 * Uses Node's Buffer when available and falls back to browser-friendly TextEncoder logic.
	 */
	static toInlineBase64(value: unknown): string {
		const jsonPayload = JSON.stringify(value, null, 2);
		const nodeBuffer = (globalThis as any).Buffer;
		if (nodeBuffer && typeof nodeBuffer.from === 'function') {
			return nodeBuffer.from(jsonPayload, 'utf8').toString('base64');
		}

		const globalBtoa = typeof btoa === 'function' ? btoa : undefined;
		const hasTextEncoder = typeof TextEncoder !== 'undefined';
		if (hasTextEncoder && globalBtoa) {
			const utf8Bytes = new TextEncoder().encode(jsonPayload);
			let binary = '';
			for (let index = 0; index < utf8Bytes.length; index += 1) {
				binary += String.fromCharCode(utf8Bytes[index]);
			}
			return globalBtoa(binary);
		}

		if (globalBtoa) {
			return globalBtoa(ContentHelper.encodeUtf8Binary(jsonPayload));
		}

		throw new Error('Base64 encoding is not supported in this environment.');
	}

	/**
	 * Fetches content from an asset URL and returns it as plain text.
	 * @param depContext - The deployment context for logging purposes
	 * @param path - The URL path to the asset to fetch
	 * @returns Promise that resolves to the content as a string
	 * @throws Error if the fetch operation fails or returns a non-ok status
	 * @example
	 * ```typescript
	 * const content = await ContentHelper.getAssetContent(depContext, '/assets/config.json');
	 * ```
	 */
	static async getAssetContent(depContext: DeploymentContext, path: string): Promise<string> {
		const response = await fetch(path);
		if (!response.ok) {
			depContext.logError('Error fetching content:', path);
			throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
		}
		return await response.text();
	}

	/**
	 * Fetches content from an asset URL and returns it as a Blob object.
	 * Useful for handling binary data or when you need to preserve the exact format of the content.
	 * @param depContext - The deployment context for logging purposes
	 * @param path - The URL path to the asset to fetch
	 * @returns Promise that resolves to the content as a Blob
	 * @throws Error if the fetch operation fails or returns a non-ok status
	 * @example
	 * ```typescript
	 * const blob = await ContentHelper.getAssetContentBlob(depContext, '/assets/image.png');
	 * ```
	 */
	static async getAssetContentBlob(depContext: DeploymentContext, path: string): Promise<Blob> {
		const response = await fetch(path);
		if (!response.ok) {
			depContext.logError('Error fetching content:', path);
			throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
		}
		return await response.blob();
	}

	/**
	 * Fetches content from an external URL and returns it as a Base64 encoded string.
	 * Validates that the URL is absolute (starts with http:// or https://) before fetching.
	 * Uses arrayBuffer approach to handle both text and binary content consistently.
	 * @param depContext - The deployment context for logging purposes
	 * @param url - The absolute URL to fetch content from
	 * @returns Promise that resolves to the content encoded as a Base64 string
	 * @throws Error if the URL format is invalid or if the fetch operation fails
	 * @example
	 * ```typescript
	 * const base64Content = await ContentHelper.getLinkContentAsBase64(depContext, 'https://example.com/file.pdf');
	 * ```
	 */
	static async getLinkContentAsBase64(depContext: DeploymentContext, url: string): Promise<string> {
		// Validate that the URL is absolute
		if (!url.startsWith('http://') && !url.startsWith('https://')) {
			throw new Error(`Invalid URL format. Expected absolute URL starting with http:// or https://, got: ${url}`);
		}

		// Create a proper URL object to ensure it's valid
		const validatedUrl = new URL(url);
		depContext.log(`Validated URL: ${validatedUrl.toString()}`);

		const response = await fetch(validatedUrl.toString());
		if (!response.ok) {
			throw new Error(`Failed to fetch deployment file from link: ${response.status} ${response.statusText}`);
		}

		// Always use arrayBuffer approach for consistent handling of both text and binary
		const arrayBuffer = await response.arrayBuffer();
		const bytes = new Uint8Array(arrayBuffer);

		// Convert bytes to binary string
		let binaryString = '';
		for (let i = 0; i < bytes.length; i++) {
			binaryString += String.fromCharCode(bytes[i]);
		}

		return btoa(binaryString);
	}

	/**
	 * Fetches content from an asset URL and returns it as a Base64 encoded string.
	 * Uses arrayBuffer approach to handle both text and binary content consistently.
	 * This method is ideal for converting assets to Base64 format for inline embedding or storage.
	 * @param depContext - The deployment context for logging purposes
	 * @param path - The URL path to the asset to fetch
	 * @returns Promise that resolves to the content encoded as a Base64 string
	 * @throws Error if the fetch operation fails or returns a non-ok status
	 * @example
	 * ```typescript
	 * const base64Content = await ContentHelper.getAssetContentAsBase64(depContext, '/assets/document.pdf');
	 * ```
	 */
	static async getAssetContentAsBase64(depContext: DeploymentContext, path: string): Promise<string> {
		const response = await fetch(path);
		if (!response.ok) {
			depContext.logError('Error fetching content:', path);
			throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
		}

		// Always use arrayBuffer approach for consistent handling of both text and binary
		const arrayBuffer = await response.arrayBuffer();
		const bytes = new Uint8Array(arrayBuffer);

		// Convert bytes to binary string
		let binaryString = '';
		for (let i = 0; i < bytes.length; i++) {
			binaryString += String.fromCharCode(bytes[i]);
		}

		return btoa(binaryString);
	}

	/**
	 * Recursively traverses an object and replaces string values that match variable names.
	 * This method supports deep object traversal, handling nested objects and arrays.
	 * String values that match keys in the variableMap will be replaced with their corresponding values.
	 * Non-matching strings are left unchanged.
	 *
	 * @param obj - The object to iterate over and transform. Can be any type (string, array, object, primitive)
	 * @param variableMap - Record containing variable names as keys and replacement values as strings
	 * @returns Promise that resolves to the transformed object with variables replaced
	 *
	 * @example
	 * ```typescript
	 * const variables = { "{{USER_ID}}": "12345", "{{WORKSPACE_ID}}": "ws-789" };
	 * const config = {
	 *   userId: "{{USER_ID}}",
	 *   workspace: "{{WORKSPACE_ID}}",
	 *   settings: {
	 *     owner: "{{USER_ID}}"
	 *   }
	 * };
	 * const result = await ContentHelper.replaceVariablesInObject(config, variables);
	 * // Result: { userId: "12345", workspace: "ws-789", settings: { owner: "12345" } }
	 * ```
	 */
	static async replaceVariablesInObject(obj: any, variableMap: Record<string, string>): Promise<any> {
		if (typeof obj === 'string') {
			return variableMap[obj] || obj;
		} else if (Array.isArray(obj)) {
			return Promise.all(obj.map((item) => this.replaceVariablesInObject(item, variableMap)));
		} else if (typeof obj === 'object' && obj !== null) {
			const newObj: Record<string, any> = {};
			for (const key in obj) {
				newObj[key] = await this.replaceVariablesInObject(obj[key], variableMap);
			}
			return newObj;
		}
		return obj;
	}

	private static encodeUtf8Binary(input: string): string {
		const encoded = encodeURIComponent(input);
		let binary = '';
		for (let index = 0; index < encoded.length; index += 1) {
			const char = encoded[index];
			if (char === '%') {
				const hex = encoded.slice(index + 1, index + 3);
				binary += String.fromCharCode(parseInt(hex, 16));
				index += 2;
			} else {
				binary += char;
			}
		}
		return binary;
	}
}
