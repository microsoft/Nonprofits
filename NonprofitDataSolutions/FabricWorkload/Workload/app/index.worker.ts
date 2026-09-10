import { InitParams, ItemLikeV2, NotificationType, createWorkloadClient } from '@ms-fabric/workload-client';

import { workloadTelemetryService } from '@services/telemetry';

import { callDialogClose } from './controller/DialogController';
import { callPageOpen } from './controller/PageController';
import { FUNDRAISING_ITEM_PAGE_ROUTE } from './items/NonprofitDataSolutions/ItemLanding/ItemLanding.model';
import {
	FUNDRAISING_CREATION_FAILURE_ACTION,
	FUNDRAISING_CREATION_SUCCESS_ACTION,
	GET_ITEM_SETTINGS_ACTION,
	OPEN_FUNDRAISING_ITEM_ACTION,
} from './items/NonprofitDataSolutions/actions';
import {
	logItemCreationFailed,
	logItemCreationSucceeded,
} from './items/NonprofitDataSolutions/telemetry/ItemCreationTelemetry';

/*
 * Represents a fabric item with additional metadata and a payload.
 * This interface extends WorkloadItem and includes a payload property.
 */
interface ItemCreationFailureData {
	errorCode?: string;
	resultCode?: string;
}

/**
 * Represents a fabric item with additional metadata and a payload.
 * This interface extends WorkloadItem and includes a payload property.
 */
interface ItemCreationSuccessData {
	item: ItemLikeV2;
}

interface WorkloadItemNavigationData {
	itemObjectId: string;
	pageId?: string;
}

const ROUTE_MAP = {
	[FUNDRAISING_CREATION_SUCCESS_ACTION]: FUNDRAISING_ITEM_PAGE_ROUTE,
	[OPEN_FUNDRAISING_ITEM_ACTION]: FUNDRAISING_ITEM_PAGE_ROUTE,
};

export async function initialize(params: InitParams) {
	console.log('Worker initialization started:', params);

	const workloadClient = createWorkloadClient();

	await workloadTelemetryService.initializeForWorkload(workloadClient);

	const workloadName = process.env.WORKLOAD_NAME;

	workloadClient.action.onAction(async function ({ action, data }) {
		switch (action) {
			case FUNDRAISING_CREATION_SUCCESS_ACTION: {
				const { item } = data as ItemCreationSuccessData;

				logItemCreationSucceeded({
					itemId: item.objectId,
					itemName: item.displayName,
					workspaceId: item.folderObjectId,
					itemType: item.itemType,
				});
				await workloadTelemetryService.flush();

				// Wizard must be open on top of the newly created item's overview page
				const path = ROUTE_MAP[action].replace(':itemObjectId', item.objectId).replace(':pageId?', 'overview');
				await callPageOpen(workloadClient, workloadName || '', path, { autostartwizard: 'true' });

				return { succeeded: true };
			}
			case OPEN_FUNDRAISING_ITEM_ACTION: {
				const { itemObjectId, pageId } = data as WorkloadItemNavigationData;
				const targetPage = pageId || 'overview';

				const workloadPath = ROUTE_MAP[action]
					.replace(':itemObjectId', itemObjectId)
					.replace(':pageId?', targetPage);

				// Close the deployment wizard before navigating so users land on the item cleanly.
				await callDialogClose(workloadClient);
				await workloadClient.navigation.navigate('workload', {
					path: workloadPath,
				});
				return { succeeded: true };
			}

			case FUNDRAISING_CREATION_FAILURE_ACTION: {
				const failureData = data as ItemCreationFailureData;
				const errorMessage = `Failed to create item, error code: ${failureData.errorCode}, result code: ${failureData.resultCode}`;

				logItemCreationFailed({
					itemId: '',
					itemName: '',
					errorMessage,
					errorDetails: failureData,
				});
				await workloadTelemetryService.flush();

				await workloadClient.notification.open({
					title: 'Error creating item',
					notificationType: NotificationType.Error,
					message: errorMessage,
				});
				return { succeeded: false };
			}
			case GET_ITEM_SETTINGS_ACTION: {
				return [
					{
						name: 'about',
						displayName: 'About',
						workloadSettingLocation: {
							workloadName,
							route: 'fundraising-item-about',
						},
						workloadIframeHeight: '1000px',
					},
				];
			}
			default:
				throw new Error('Unknown action received');
		}
	});
}
