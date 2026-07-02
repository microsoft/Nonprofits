import { OneLakeClient } from '@src/clients/OneLakeClient';

import type { Package, PackageItemPart } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

const SAMPLE_DATA_PATH_TOKEN = 'nds-silver-sampledata';
const SILVER_LAKEHOUSE_SOURCE_ID = 'Fundraising_SL_Lakehouse';

export type SampleDataInstallProgress = {
	/** 1-based index of the file currently being processed. */
	current: number;
	/** Total number of files to install. */
	total: number;
	/** Name of the file being processed (e.g. "Account.csv"). */
	fileName: string;
};

export type SampleDataInstallResult = {
	installedFiles: string[];
	failedFiles: string[];
};

/**
 * Loads the bundled Fundraising package definition and extracts the list of
 * sample-data file parts (those whose path includes `nds-silver-sampledata`).
 */
async function getSampleDataFileDefinitions(): Promise<PackageItemPart[]> {
	const mod = await import('@src/assets/items/PackageInstallerItem/Fundraising/package.json');
	const pkg = (mod.default ?? mod) as unknown as Package;

	const silverItem = pkg.items?.find((item) => item.sourceId === SILVER_LAKEHOUSE_SOURCE_ID);
	if (!silverItem?.data?.files) return [];

	return silverItem.data.files.filter(
		(part) => typeof part.path === 'string' && part.path.toLowerCase().includes(SAMPLE_DATA_PATH_TOKEN),
	);
}

/**
 * Fetches a bundled app-asset file and returns its content as a base64 string
 * (the same encoding that `OneLakeClient.writeFileAsBase64` expects).
 */
async function fetchAssetAsBase64(assetPath: string): Promise<string> {
	const response = await fetch(assetPath);
	if (!response.ok) {
		throw new Error(`Failed to fetch asset ${assetPath} (HTTP ${response.status})`);
	}

	const buffer = await response.arrayBuffer();
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * Re-installs sample-data CSV files from the bundled app assets into the
 * Silver Lakehouse of the current workspace.
 *
 * This mirrors the logic used by the original package installer
 * (`BaseDeploymentStrategy.createPackageItemData`) so the files end up
 * at the same OneLake path (`Files/nds-silver-sampledata/*.csv`).
 *
 * The Deployment Pipeline moves Lakehouse item metadata but may not carry
 * over OneLake file content — so we re-install from the bundled assets
 * (the same source the original installer uses).
 *
 * @param oneLake       OneLake client instance (from `FabricPlatformAPIClient.oneLake`)
 * @param workspaceId   Current workspace ID
 * @param silverLakehouseId  Fabric item ID of the Silver Lakehouse in the current workspace
 * @param onProgress    Optional callback invoked before each file is written
 */
export async function installSampleData(
	oneLake: OneLakeClient,
	workspaceId: string,
	silverLakehouseId: string,
	onProgress?: (progress: SampleDataInstallProgress) => void,
): Promise<SampleDataInstallResult> {
	const files = await getSampleDataFileDefinitions();
	const result: SampleDataInstallResult = { installedFiles: [], failedFiles: [] };

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const fileName = file.path.split('/').pop() ?? file.path;

		onProgress?.({ current: i + 1, total: files.length, fileName });

		try {
			const base64Content = await fetchAssetAsBase64(file.payload);
			const targetPath = OneLakeClient.getPath(workspaceId, silverLakehouseId, file.path);
			await oneLake.writeFileAsBase64(targetPath, base64Content);
			result.installedFiles.push(fileName);
		} catch (e) {
			console.warn(`[installSampleData] Failed to install ${fileName}`, e);
			result.failedFiles.push(fileName);
		}
	}

	return result;
}
