import { ItemLikeV2, OpenItemSettingsConfig, OpenUIResult, WorkloadClientAPI } from '@ms-fabric/workload-client';

/**
 * Calls the 'itemSettings.open' function from the WorkloadClientAPI, opening the settings pane shared UI component for the item.
 *
 * @param {ItemLikeV2} item - The item for which we want to show the settings pane.
 * @param {WorkloadClientAPI} workloadClient - An instance of the WorkloadClientAPI.
 * @param {string} selectedSettingId - The ID of the tab we want to show. If no ID is passed, the item settings panel will open in the 'About' Tab.
 * @returns {OpenUIResult} - The result of the UI operation.
 */
export async function callOpenSettings(
	workloadClient: WorkloadClientAPI,
	item: ItemLikeV2,
	selectedSettingId?: string,
): Promise<OpenUIResult> {
	const config: OpenItemSettingsConfig = {
		item,
		selectedSettingId,
	};

	logger.info('Open item settings:', config);

	try {
		const result: OpenUIResult = await workloadClient.itemSettings.open(config);
		logger.info('Item settings opened:', result);
		return result;
	} catch (exception) {
		logger.error('Open settings failed:', item, exception);
	}

	return null;
}
