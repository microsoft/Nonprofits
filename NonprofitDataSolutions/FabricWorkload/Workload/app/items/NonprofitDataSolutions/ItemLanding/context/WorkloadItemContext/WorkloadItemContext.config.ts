import type { OpenUIResult, WorkloadClientAPI } from '@ms-fabric/workload-client';

import { PageName } from '@src/items/NonprofitDataSolutions/telemetry/PageViewTelemetry';

/**
 * Workload type enumeration
 * Add new workload types here as they are implemented
 */
export enum WorkloadType {
	Fundraising = 'fundraising',
	// Programs = 'programs',
	// Grants = 'grants',
}

/**
 * Configuration interface for WorkloadItemContext
 * This allows the context to be reused for different item types
 */
export interface WorkloadItemConfig {
	/** Item type identifier (e.g., WorkloadType.Fundraising) */
	itemType: WorkloadType;

	/** Display name for the item type (e.g., 'Fundraising', 'Programs', 'Grants') */
	displayName: string;

	/** Route pattern for the item page (e.g., '/fundraising-item/:itemObjectId/:pageId?') */
	itemPageRoute: string;

	/**
	 * Function to open the deployment wizard for this item type
	 * @param workloadClient - The Fabric workload client
	 * @param itemObjectId - The item's object ID
	 * @returns Promise with the OpenUIResult
	 */
	openWizard: (workloadClient: WorkloadClientAPI, itemObjectId: string) => Promise<OpenUIResult>;

	/**
	 * Mapping of page IDs to telemetry PageName values
	 * This allows different workload types to have different telemetry names
	 */
	telemetryPageNames: {
		[pageId: string]: PageName;
	};
}
