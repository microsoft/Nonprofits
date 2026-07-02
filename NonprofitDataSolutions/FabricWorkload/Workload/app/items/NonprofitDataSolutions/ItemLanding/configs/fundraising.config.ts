import { openInstallationWizard } from '@src/controller/NavigationController';
import { PageName } from '@src/items/NonprofitDataSolutions/telemetry/PageViewTelemetry';

import { FUNDRAISING_ITEM_PAGE_ROUTE, PageId } from '../ItemLanding.model';
import { type WorkloadItemConfig, WorkloadType } from '../context/WorkloadItemContext/WorkloadItemContext.config';

/**
 * Configuration for Fundraising item type
 * This configuration is used by the WorkloadItemProvider to provide
 * fundraising-specific behavior while using the generic context
 */
export const fundraisingConfig: WorkloadItemConfig = {
	itemType: WorkloadType.Fundraising,
	displayName: (process.env.WORKLOAD_NAME ?? '').startsWith('Org.') ? 'Fundraising [DEV]' : 'Fundraising',
	itemPageRoute: FUNDRAISING_ITEM_PAGE_ROUTE,
	openWizard: openInstallationWizard,
	telemetryPageNames: {
		[PageId.Overview]: PageName.FundraisingOverview,
		[PageId.Deployments]: PageName.FundraisingDetails,
		[PageId.PostDeploymentSetup]: PageName.FundraisingPostDeploymentSetup,
	},
};
