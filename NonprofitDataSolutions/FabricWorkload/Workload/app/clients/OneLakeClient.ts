import { WorkloadClientAPI } from '@ms-fabric/workload-client';

import { EnvironmentConstants } from '../constants';
import { ItemReference } from '../controller/ItemCRUDController';
import { FabricPlatformClient, TokenProvider } from './FabricPlatformClient';
import { OneLakeClientItemWrapper } from './OneLakeClientItemWrapper';

export const FILE_FOLDER_NAME = 'Files';
export const TABLE_FOLDER_NAME = 'Tables';

let sharedTokenProvider: TokenProvider;

/**
 * API wrapper for OneLake operations
 * Provides methods for reading and writing files to OneLake storage
 * Uses centralized token management
 */
export class OneLakeClient extends FabricPlatformClient {
	constructor(workloadClient: WorkloadClientAPI, tokenProvider: TokenProvider) {
		sharedTokenProvider = tokenProvider;
		super(workloadClient, tokenProvider);
	}

	/**
	 * Create a wrapper for a OneLake item that correctly prefexis all calls to the onelake client with the item workspace and item id
	 * @param item The OneLake item to use to access OneLake
	 * @returns A OneLakeItemClient instance that is corectly configure to always use conent in the item directories in OneLake
	 */
	createItemWrapper(item: ItemReference) {
		return new OneLakeClientItemWrapper(this, item);
	}

	/**
	 * Check if a file exists in OneLake
	 * @param filePath The OneLake file path
	 * @returns Promise<boolean>
	 */
	async checkIfFileExists(filePath: string): Promise<boolean> {
		const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${filePath}?resource=file`;
		try {
			const accessToken = await this.getAccessToken();
			const response = await fetch(url, {
				method: 'HEAD',
				headers: { Authorization: `Bearer ${accessToken.token}` },
			});
			if (response.status === 200) {
				return true;
			} else if (response.status === 404) {
				return false;
			} else {
				logger.warn(`Unexpected status ${response.status} for ${filePath}`);
				return false;
			}
		} catch (error: any) {
			logger.error(`Check file exists failed for ${filePath}:`, error);
			return false;
		}
	}

	/**
	 * Write content to a OneLake file as base64
	 * @param filePath The OneLake file path
	 * @param content The content to write as base64 encoded string
	 */
	async writeFileAsBase64(filePath: string, content: string): Promise<void> {
		const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${filePath}?resource=file`;
		logger.info(`Write file as base64: ${filePath}`);

		let accessToken: any;
		try {
			accessToken = await this.getAccessToken();
			logger.info(`Access token acquired for: ${filePath}`);
		} catch (error) {
			logger.error(`Get access token failed for ${filePath}:`, error);
			return;
		}

		try {
			// First, create an empty file
			logger.info(`Creating file: ${url}`);
			const response = await fetch(url, {
				method: 'PUT',
				headers: { Authorization: `Bearer ${accessToken.token}` },
				body: '', // Create empty file
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			logger.info(`File created: ${filePath}`);
		} catch (error: any) {
			logger.error(`Create file failed ${filePath}:`, error);
			throw error;
		}
		// Then append the base64 content as binary data
		logger.info(`Appending base64 content: ${filePath}`);
		// NOTE: The original code called this.x, but there is no x method. Should this be appendBinaryToFile?
		if (typeof this.appendBinaryToFile === 'function') {
			await this.appendBinaryToFile(accessToken.token, filePath, content);
			logger.info(`Base64 content appended: ${filePath}`);
		} else {
			logger.warn(`appendBinaryToFile method not found, skipping append`);
		}
	}

	/**
	 * Read a file from OneLake as base64
	 * @param filePath The OneLake file path
	 * @returns Promise<string> The file content as base64 string
	 */
	async readFileAsBase64(filePath: string): Promise<string> {
		const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${filePath}`;
		try {
			const accessToken = await this.getAccessToken();
			const response = await fetch(url, {
				headers: { Authorization: `Bearer ${accessToken.token}` },
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const content = await response.text();
			logger.info(`Read file as base64: ${filePath}`);
			return Buffer.from(content, 'base64').toString('utf8');
		} catch (error: any) {
			logger.error(`Read file as base64 failed ${filePath}:`, error);
			return '';
		}
	}

	/**
	 * Write content to a OneLake file as text
	 * @param filePath The OneLake file path
	 * @param content The text content to write
	 */
	async writeFileAsText(filePath: string, content: string): Promise<void> {
		const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${filePath}?resource=file`;
		const accessToken = await this.getAccessToken();

		try {
			const response = await fetch(url, {
				method: 'PUT',
				headers: { Authorization: `Bearer ${accessToken.token}` },
				body: '', // Create empty file
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			logger.info(`File created as text: ${filePath}`);
		} catch (error: any) {
			logger.error(`Create text file failed ${filePath}:`, error);
			return;
		}
		await this.appendToFile(accessToken.token, filePath, content);
	}

	/**
	 * Read a file from OneLake as text
	 * @param filePath The OneLake file path
	 * @returns Promise<string> The file content as text
	 */
	async readFileAsText(filePath: string): Promise<string> {
		const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${filePath}`;
		try {
			const accessToken = await this.getAccessToken();
			const response = await fetch(url, {
				headers: { Authorization: `Bearer ${accessToken.token}` },
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const content = await response.text();
			logger.info(`Read file as text: ${filePath}`);
			return content;
		} catch (error: any) {
			logger.error(`Read file as text failed ${filePath}:`, error);
			return '';
		}
	}

	/**
	 * Delete a file from OneLake
	 * @param filePath The OneLake file path
	 */
	async deleteFile(filePath: string): Promise<void> {
		const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${filePath}?recursive=true`;
		try {
			const accessToken = await this.getAccessToken();
			const response = await fetch(url, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${accessToken.token}` },
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			logger.info(`File deleted: ${filePath}`);
		} catch (error: any) {
			logger.error(`Delete file failed ${filePath}:`, error);
		}
	}

	/**
	 * Create a folder in OneLake by creating a placeholder file
	 * @param folderPath The path to the folder
	 */
	async createFolder(folderPath: string): Promise<void> {
		// OneLake doesn't have explicit folder creation, so we create a placeholder file
		const placeholderPath = `${folderPath}/.folder_placeholder`;
		await this.writeFileAsText(placeholderPath, '');
	}

	/**
	 * Get the OneLake file path for a specific file in the Files folder
	 * @param workspaceId The ID of the workspace
	 * @param itemId The ID of the item
	 * @param fileName The name of the file
	 * @returns The OneLake file path
	 */
	static getFilePath(workspaceId: string, itemId: string, fileName: string): string {
		return OneLakeClient.getPath(workspaceId, itemId, `${FILE_FOLDER_NAME}/${fileName}`);
	}

	/**
	 * Get the path for a table
	 * @param workspaceId
	 * @param itemId
	 * @param tableName
	 * @returns
	 */
	static getTablePath(workspaceId: string, itemId: string, tableName: string): string {
		return OneLakeClient.getPath(workspaceId, itemId, `${TABLE_FOLDER_NAME}/${tableName}`);
	}

	/**
	 * Get the OneLake path for a specific file (generic version)
	 * @param workspaceId The workspace ID
	 * @param itemId The item ID
	 * @param fileName The file name/path
	 * @returns The OneLake path
	 */
	static getPath(workspaceId: string, itemId: string, fileName: string): string {
		return `${workspaceId}/${itemId}/${fileName}`;
	}

	// Private helper methods

	private async appendToFile(token: string, filePath: string, content: string): Promise<void> {
		const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${filePath}`;
		const appendQuery = this.buildAppendQueryParameters();
		const appendUrl = `${url}?${appendQuery}`;

		try {
			const appendResponse = await fetch(appendUrl, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: content,
			});
			if (!appendResponse.ok) throw new Error(`HTTP ${appendResponse.status}`);

			// For Node.js: Buffer.byteLength, for browser: new TextEncoder().encode(content).length
			const contentLength =
				typeof Buffer !== 'undefined'
					? Buffer.byteLength(content, 'utf8')
					: new TextEncoder().encode(content).length;

			const flushQuery = this.buildFlushQueryParameters(contentLength);
			const flushUrl = `${url}?${flushQuery}`;

			const flushResponse = await fetch(flushUrl, {
				method: 'PATCH',
				headers: { Authorization: `Bearer ${token}` },
				body: '',
			});
			if (!flushResponse.ok) throw new Error(`HTTP ${flushResponse.status}`);

			logger.info(`Append to file: ${filePath}`);
		} catch (error: any) {
			logger.error(`Append to file failed ${filePath}:`, error);
			throw error;
		}
	}

	private async appendBinaryToFile(token: string, filePath: string, base64Content: string): Promise<void> {
		const url = `${EnvironmentConstants.OneLakeDFSBaseUrl}/${filePath}`;
		const appendQuery = this.buildAppendQueryParameters();
		const appendUrl = `${url}?${appendQuery}`;

		try {
			// Decode base64 string to binary data
			const binaryString = atob(base64Content);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}

			const appendResponse = await fetch(appendUrl, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: bytes,
			});
			if (!appendResponse.ok) throw new Error(`HTTP ${appendResponse.status}`);

			// Flush with content length (bytes length, not string length)
			const contentLength = bytes.length;
			const flushQuery = this.buildFlushQueryParameters(contentLength);
			const flushUrl = `${url}?${flushQuery}`;

			const flushResponse = await fetch(flushUrl, {
				method: 'PATCH',
				headers: { Authorization: `Bearer ${token}` },
				body: '',
			});
			if (!flushResponse.ok) throw new Error(`HTTP ${flushResponse.status}`);

			logger.info(`Append binary to file: ${filePath}`);
		} catch (error: any) {
			logger.error(`Append binary failed ${filePath}:`, error);
			throw error;
		}
	}

	private buildAppendQueryParameters(): string {
		return 'position=0&action=append';
	}

	private buildFlushQueryParameters(contentLength: number): string {
		return `position=${contentLength}&action=flush`;
	}
}

// Legacy function exports for backward compatibility
// These can be removed once all code is migrated to use the OneLakeClient class

export async function checkIfFileExists(workloadClient: WorkloadClientAPI, filePath: string): Promise<boolean> {
	const client = new OneLakeClient(workloadClient, sharedTokenProvider);
	return client.checkIfFileExists(filePath);
}

export async function writeToOneLakeFileAsBase64(
	workloadClient: WorkloadClientAPI,
	filePath: string,
	content: string,
): Promise<void> {
	const client = new OneLakeClient(workloadClient, sharedTokenProvider);
	return client.writeFileAsBase64(filePath, content);
}

export async function readOneLakeFileAsBase64(workloadClient: WorkloadClientAPI, filePath: string): Promise<string> {
	const client = new OneLakeClient(workloadClient, sharedTokenProvider);
	return client.readFileAsBase64(filePath);
}

export async function writeToOneLakeFileAsText(
	workloadClient: WorkloadClientAPI,
	filePath: string,
	content: string,
): Promise<void> {
	const client = new OneLakeClient(workloadClient, sharedTokenProvider);
	return client.writeFileAsText(filePath, content);
}

export async function readOneLakeFileAsText(workloadClient: WorkloadClientAPI, filePath: string): Promise<string> {
	const client = new OneLakeClient(workloadClient, sharedTokenProvider);
	return client.readFileAsText(filePath);
}

export async function deleteOneLakeFile(workloadClient: WorkloadClientAPI, filePath: string): Promise<void> {
	const client = new OneLakeClient(workloadClient, sharedTokenProvider);
	return client.deleteFile(filePath);
}

export async function createOneLakeFolder(workloadClient: WorkloadClientAPI, folderPath: string): Promise<void> {
	const client = new OneLakeClient(workloadClient, sharedTokenProvider);
	return client.createFolder(folderPath);
}

export function getOneLakeFilePath(workspaceId: string, itemId: string, fileName: string): string {
	return OneLakeClient.getFilePath(workspaceId, itemId, fileName);
}

export function getOneLakePath(workspaceId: string, itemId: string, fileName: string): string {
	return OneLakeClient.getPath(workspaceId, itemId, fileName);
}
