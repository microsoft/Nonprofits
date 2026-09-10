import { ItemReference } from '../controller/ItemCRUDController';
import { OneLakeClient } from './OneLakeClient';

export class OneLakeClientItemWrapper {
	private client: OneLakeClient;
	private item: ItemReference;
	constructor(client: OneLakeClient, item: ItemReference) {
		this.client = client;
		this.item = item;
	}

	/**
	 * Check if a file exists in this item's OneLake storage
	 * @param filePath The file path relative to the item
	 * @returns Promise<boolean>
	 */
	async checkIfFileExists(filePath: string): Promise<boolean> {
		const itemPath = this.getPath(filePath);
		return this.client.checkIfFileExists(itemPath);
	}

	/**
	 * Write content to a file as base64 in this item's OneLake storage
	 * @param filePath The file path relative to the item
	 * @param content The content to write as base64 encoded string
	 */
	async writeFileAsBase64(filePath: string, content: string): Promise<void> {
		const itemPath = this.getPath(filePath);
		return this.client.writeFileAsBase64(itemPath, content);
	}

	/**
	 * Write content to a file as base64 in this item's OneLake storage
	 * @param filePath The file path relative to the item
	 * @param content The content to write as base64 encoded string
	 */
	async writeFileAsBase64AtCustomFolder(filePath: string, content: string, folderName: string): Promise<void> {
		const itemPath = OneLakeClient.getPath(this.item.workspaceId, folderName, filePath);
		return this.client.writeFileAsBase64(itemPath, content);
	}

	/**
	 * Read a file as base64 from this item's OneLake storage
	 * @param filePath The file path relative to the item
	 * @returns Promise<string> The file content as base64 string
	 */
	async readFileAsBase64(filePath: string): Promise<string> {
		const itemPath = this.getPath(filePath);
		return this.client.readFileAsBase64(itemPath);
	}

	/**
	 * Write content to a file as text in this item's OneLake storage
	 * @param filePath The file path relative to the item
	 * @param content The text content to write
	 */
	async writeFileAsText(filePath: string, content: string): Promise<void> {
		const itemPath = this.getPath(filePath);
		return this.client.writeFileAsText(itemPath, content);
	}

	/**
	 * Read a file as text from this item's OneLake storage
	 * @param filePath The file path relative to the item
	 * @returns Promise<string> The file content as text
	 */
	async readFileAsText(filePath: string): Promise<string> {
		const itemPath = this.getPath(filePath);
		return this.client.readFileAsText(itemPath);
	}

	/**
	 * Delete a file from this item's OneLake storage
	 * @param filePath The file path relative to the item
	 */
	async deleteFile(filePath: string): Promise<void> {
		const itemPath = this.getPath(filePath);
		return this.client.deleteFile(itemPath);
	}

	/**
	 * Create a folder in this item's OneLake storage
	 * @param folderPath The folder path relative to the item
	 */
	async createFolder(folderPath: string): Promise<void> {
		const itemPath = this.getPath(folderPath);
		return this.client.createFolder(itemPath);
	}

	/**
	 * Get the full OneLake path for a file in this item
	 * @param filePath The file path relative to the item
	 * @returns The full OneLake path
	 */
	getPath(filePath: string): string {
		return OneLakeClient.getPath(this.item.workspaceId, this.item.id, filePath);
	}

	/**
	 * Get the file path for the Files folder in this item
	 * @param fileName The name of the file
	 * @returns The OneLake file path
	 */
	getFilePath(fileName: string): string {
		return OneLakeClient.getFilePath(this.item.workspaceId, this.item.id, fileName);
	}

	/**
	 * Get the path for a table
	 * @param tableName The name of the table
	 * @returns The OneLake table path
	 */
	getTablePath(tableName: string): string {
		return OneLakeClient.getTablePath(this.item.workspaceId, this.item.id, tableName);
	}
}
